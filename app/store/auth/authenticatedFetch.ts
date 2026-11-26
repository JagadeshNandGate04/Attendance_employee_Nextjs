interface RefreshResult {
  success: boolean;
  message?: string;
  reauthenticate?: boolean;
  data?: { token: string };
}

let sessionHandlers: {
  refresh: () => Promise<RefreshResult>;
  logout: () => Promise<unknown>;
} | null = null;

export function configureAuthenticatedFetch(handlers: NonNullable<typeof sessionHandlers>) {
  sessionHandlers = handlers;
}

let refreshInFlight: {
  refreshToken: string;
  promise: ReturnType<typeof refresh>;
} | null = null;

let lastRefresh: {
  previousRefreshToken: string;
  refreshToken: string;
  accessToken: string;
} | null = null;

async function refresh(refreshToken: string) {
  if (!sessionHandlers) throw new Error("Session handling is not initialized.");
  const result = await sessionHandlers.refresh();
  if (!result.success || !result.data) {
    if (result.reauthenticate && localStorage.getItem("refreshToken") === refreshToken) {
      await sessionHandlers.logout();
    }
    throw new Error(result.message || "Unable to refresh your session.");
  }

  const currentRefreshToken = localStorage.getItem("refreshToken");
  if (!currentRefreshToken) {
    throw new Error("Your session changed. Please sign in again.");
  }
  lastRefresh = {
    previousRefreshToken: refreshToken,
    refreshToken: currentRefreshToken,
    accessToken: result.data.token,
  };
  return result.data.token;
}

function refreshOnce(refreshToken: string) {
  if (refreshInFlight?.refreshToken === refreshToken) {
    return refreshInFlight.promise;
  }
  const promise = refresh(refreshToken);
  refreshInFlight = { refreshToken, promise };
  const clearInFlight = () => {
    if (refreshInFlight?.promise === promise) refreshInFlight = null;
  };
  void promise.then(clearInFlight, clearInFlight);
  return promise;
}

export async function authenticatedFetch(
  input: string | URL,
  init: RequestInit = {}
): Promise<Response> {
  if (typeof window === "undefined") {
    throw new Error("Authenticated requests require a browser session.");
  }

  const token = localStorage.getItem("token");
  const refreshToken = localStorage.getItem("refreshToken");
  if (!token) throw new Error("Authentication token not found. Please login again.");

  const send = (accessToken: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    return fetch(input, { ...init, headers });
  };

  const response = await send(token);
  if (response.status !== 401) return response;

  const currentToken = localStorage.getItem("token");
  const currentRefreshToken = localStorage.getItem("refreshToken");
  const rotatedByThisClient =
    lastRefresh?.previousRefreshToken === refreshToken &&
    lastRefresh.refreshToken === currentRefreshToken &&
    lastRefresh.accessToken === currentToken;

  if (currentRefreshToken !== refreshToken && !rotatedByThisClient) {
    throw new Error("Your session changed. Please sign in again.");
  }
  if (!currentToken) throw new Error("Your session has ended. Please sign in again.");
  if (!refreshToken) {
    if (!sessionHandlers) throw new Error("Session handling is not initialized.");
    await sessionHandlers.logout();
    throw new Error("Your session has expired. Please sign in again.");
  }

  const retryToken = currentToken !== token
    ? currentToken
    : await refreshOnce(refreshToken);
  if (localStorage.getItem("token") !== retryToken) {
    throw new Error("Your session changed. Please sign in again.");
  }
  return send(retryToken);
}
