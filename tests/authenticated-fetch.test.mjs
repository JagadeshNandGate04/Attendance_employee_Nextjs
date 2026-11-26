import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const importModule = createRequire(import.meta.url);
const dirname = path.dirname(fileURLToPath(import.meta.url));

function createHarness(fetchImpl) {
  const values = new Map([
    ["token", "old-access"],
    ["refreshToken", "old-refresh"],
    ["userDetails", "{}"],
    ["loginSuccess", "true"],
  ]);
  const localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  const context = vm.createContext({
    window: {},
    localStorage,
    fetch: fetchImpl,
    Headers,
    Response,
    URL,
    Error,
    console,
    process: { env: {} },
  });
  const fetchModule = {};

  function load(relativePath, dependencies) {
    const file = path.join(dirname, "..", relativePath);
    const source = fs.readFileSync(file, "utf8");
    const compiled = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const loadedModule = { exports: {} };
    const localRequire = (name) => {
      if (Object.hasOwn(dependencies, name)) return dependencies[name];
      return importModule(name);
    };
    new vm.Script(`(function (exports, require, module) { ${compiled}\n})`, { filename: file })
      .runInContext(context)(loadedModule.exports, localRequire, loadedModule);
    return loadedModule.exports;
  }

  const auth = load("app/store/auth/authSlice.tsx", {
    "@/app/store/quoteService": { clearSessionQuote() {} },
    "./authenticatedFetch": fetchModule,
  });
  let state = auth.default(undefined, { type: "@@init" });
  const dispatch = (action) => {
    if (typeof action === "function") return action(dispatch);
    state = auth.default(state, action);
    return action;
  };
  Object.assign(fetchModule, load("app/store/auth/authenticatedFetch.ts", {}));
  fetchModule.configureAuthenticatedFetch({
    refresh: () => dispatch(auth.refreshAuthToken()),
    logout: () => dispatch(auth.performLogout()),
  });
  return { ...fetchModule, localStorage, getState: () => state };
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("concurrent expired requests share a refresh and retry with the new token", async () => {
  let refreshCount = 0;
  const calls = [];
  const harness = createHarness(async (url, init) => {
    if (url.endsWith("/auth/refresh")) {
      refreshCount++;
      assert.equal(JSON.parse(init.body).refresh_token, "old-refresh");
      await new Promise((resolve) => setTimeout(resolve, 10));
      return jsonResponse({
        success: true,
        data: { token: "new-access", refresh_token: "new-refresh", expires_in: 3600 },
      });
    }
    calls.push({ token: init.headers.get("Authorization"), method: init.method, body: init.body });
    return jsonResponse({}, init.headers.get("Authorization") === "Bearer old-access" ? 401 : 200);
  });

  const responses = await Promise.all([
    harness.authenticatedFetch("/one", { method: "POST", body: '{"value":1}' }),
    harness.authenticatedFetch("/two"),
    harness.authenticatedFetch("/three"),
  ]);
  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200]);
  assert.equal(refreshCount, 1);
  assert.equal(calls.filter((call) => call.token === "Bearer new-access").length, 3);
  assert.equal(calls.filter((call) => call.method === "POST" && call.body === '{"value":1}').length, 2);
  assert.equal(harness.localStorage.getItem("refreshToken"), "new-refresh");
  assert.equal(harness.localStorage.getItem("token"), "new-access");
  assert.equal(harness.getState().token, "new-access");
});

test("a late 401 after token rotation retries without refreshing again", async () => {
  let resolveLate;
  let refreshCount = 0;
  const lateResponse = new Promise((resolve) => { resolveLate = resolve; });
  const harness = createHarness(async (url, init) => {
    if (url.endsWith("/auth/refresh")) {
      refreshCount++;
      return jsonResponse({
        success: true,
        data: { token: "new-access", refresh_token: "new-refresh", expires_in: 3600 },
      });
    }
    if (url === "/late" && init.headers.get("Authorization") === "Bearer old-access") {
      return lateResponse;
    }
    return jsonResponse({}, init.headers.get("Authorization") === "Bearer old-access" ? 401 : 200);
  });

  const late = harness.authenticatedFetch("/late");
  assert.equal((await harness.authenticatedFetch("/first")).status, 200);
  resolveLate(jsonResponse({}, 401));
  assert.equal((await late).status, 200);
  assert.equal(refreshCount, 1);
});

test("a rejected refresh clears the session and reports that sign-in is required", async () => {
  const harness = createHarness(async (url) =>
    url.endsWith("/auth/refresh")
      ? jsonResponse({ success: false, message: "Refresh token expired" }, 401)
      : jsonResponse({}, 401)
  );
  await assert.rejects(harness.authenticatedFetch("/protected"), /sign in again/i);
  assert.equal(harness.localStorage.getItem("token"), null);
  assert.equal(harness.localStorage.getItem("refreshToken"), null);
});

test("a refresh network error is surfaced without clearing the session", async () => {
  const harness = createHarness(async (url) => {
    if (url.endsWith("/auth/refresh")) throw new Error("Network unavailable");
    return jsonResponse({}, 401);
  });
  await assert.rejects(harness.authenticatedFetch("/protected"), /Network unavailable/);
  assert.equal(harness.localStorage.getItem("token"), "old-access");
  assert.equal(harness.localStorage.getItem("refreshToken"), "old-refresh");
});

test("a changed session is not overwritten by an in-flight refresh", async () => {
  let resolveRefresh;
  let refreshStarted;
  const started = new Promise((resolve) => { refreshStarted = resolve; });
  const harness = createHarness(async (url) => {
    if (url.endsWith("/auth/refresh")) {
      refreshStarted();
      return new Promise((resolve) => { resolveRefresh = resolve; });
    }
    return jsonResponse({}, 401);
  });
  const request = harness.authenticatedFetch("/protected");
  await started;
  harness.localStorage.setItem("token", "other-access");
  harness.localStorage.setItem("refreshToken", "other-refresh");
  resolveRefresh(jsonResponse({ success: true, data: { token: "new-access", expires_in: 3600 } }));
  await assert.rejects(request, /session changed/i);
  assert.equal(harness.localStorage.getItem("token"), "other-access");
  assert.equal(harness.localStorage.getItem("refreshToken"), "other-refresh");
});

test("non-401 responses are not refreshed, and a retried 401 is not retried again", async () => {
  let refreshCount = 0;
  let protectedCount = 0;
  const harness = createHarness(async (url) => {
    if (url.endsWith("/auth/refresh")) {
      refreshCount++;
      return jsonResponse({ success: true, data: { token: "new-access", expires_in: 3600 } });
    }
    protectedCount++;
    return jsonResponse({}, url === "/forbidden" ? 403 : 401);
  });
  assert.equal((await harness.authenticatedFetch("/forbidden")).status, 403);
  assert.equal(refreshCount, 0);
  assert.equal((await harness.authenticatedFetch("/protected")).status, 401);
  assert.equal(refreshCount, 1);
  assert.equal(protectedCount, 3);
});
