import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const requireModule = createRequire(import.meta.url);
const sourcePath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/store/profile/profileSlice.tsx');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function createHarness(fetchImpl) {
  const context = vm.createContext({
    window: {},
    localStorage: { getItem: () => 'test-token' },
    process: { env: {} },
    Error,
    URLSearchParams,
  });
  const loadedModule = { exports: {} };
  const localRequire = (name) => {
    if (name === '../auth/authenticatedFetch') return { authenticatedFetch: fetchImpl };
    if (name === '../auth/authSlice') return { logout: { type: 'auth/logout' } };
    return requireModule(name);
  };
  new vm.Script(`(function (exports, require, module) { ${compiled}\n})`, { filename: sourcePath })
    .runInContext(context)(loadedModule.exports, localRequire, loadedModule);
  const slice = loadedModule.exports;
  const profile = { employee: {}, profile: { marital_status: 'Unmarried' }, pending_requests: [] };
  let state = slice.default(undefined, { type: '@@init' });
  state = slice.default(state, slice.fetchEmployeeProfile.pending('profile'));
  state = slice.default(state, slice.fetchEmployeeProfile.fulfilled(profile, 'profile'));
  const dispatch = (action) => {
    if (typeof action === 'function') return action(dispatch, () => ({ profile: state }), undefined);
    state = slice.default(state, action);
    return action;
  };
  return { slice, dispatch, getState: () => state };
}

test('personal request posts its payload and adds pending history without updating approved data', async () => {
  let sent;
  const pending = {
    id: '32', section: 'PERSONAL', record_id: '6', request_type: 'UPDATE',
    existing_data: { marital_status: 'Unmarried' }, requested_data: { marital_status: 'Married' },
    status: 'PENDING', created_at: '2026-11-25T10:52:52.911Z',
  };
  const harness = createHarness(async (url, init) => {
    sent = { url, method: init.method, payload: JSON.parse(init.body) };
    return { ok: true, json: async () => ({ success: true, data: { request: pending } }) };
  });
  const payload = { marital_status: 'Married', height_cm: 185, date_of_birth: '1998-05-15' };
  await harness.dispatch(harness.slice.submitProfileRequest({ section: 'personal-details', payload })).unwrap();
  assert.equal(sent.url, '/api/v1/employee-profile/me/personal-details/request');
  assert.equal(sent.method, 'POST');
  assert.deepEqual(sent.payload, payload);
  assert.equal(harness.getState().data.profile.marital_status, 'Unmarried');
  assert.equal(harness.getState().data.pending_requests[0].id, '32');
});

test('a rejected request leaves approved data and pending history unchanged', async () => {
  const harness = createHarness(async () => ({
    ok: false, status: 400, json: async () => ({ success: false, message: 'Invalid personal details' }),
  }));
  await assert.rejects(
    harness.dispatch(harness.slice.submitProfileRequest({ section: 'personal-details', payload: { marital_status: 'Married' } })).unwrap(),
    (error) => error === 'Invalid personal details'
  );
  assert.equal(harness.getState().data.profile.marital_status, 'Unmarried');
  assert.equal(harness.getState().data.pending_requests.length, 0);
});
