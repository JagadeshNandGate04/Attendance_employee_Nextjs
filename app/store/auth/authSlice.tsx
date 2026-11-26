
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AppDispatch } from "@/app/store/store";
import { clearSessionQuote } from "@/app/store/quoteService";
import { authenticatedFetch } from "./authenticatedFetch";

// ===============================
// USER INTERFACE
// ===============================

export interface User {
  id: string;
  emp_code: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  date_of_joining: string;
  designation: string;
  status: string;
  fcm_tokens: string[];
  created_at: string;
  updated_at: string;
}

// ===============================
// REQUEST INTERFACES
// ===============================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

// ===============================
// RESPONSE INTERFACES
// ===============================

interface LoginResponseData {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

interface RefreshResponseData {
  token: string;
  expires_in: number;
  refresh_token?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// ===============================
// AUTH STATE
// ===============================

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  loading: boolean;
  error: string | null;
  passwordLoading: boolean;
  passwordError: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  expiresIn: null,
  loading: false,
  error: null,
  passwordLoading: false,
  passwordError: null,
};

// ===============================
// API CONFIGURATION
// ===============================

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL || ""
).replace(/\/+$/, "");

const getApiUrl = (endpoint: string) => {
  return `${API_BASE_URL}${endpoint}`;
};

// ===============================
// LOCAL STORAGE HELPERS
// ===============================

const getUserFromLocalStorage = (): User | null => {
  try {
    if (typeof window === "undefined") return null;

    const userStr = localStorage.getItem("userDetails");

    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
    return null;
  }
};

const clearAuthStorage = () => {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userDetails");
  localStorage.removeItem("loginSuccess");
  localStorage.removeItem("tokenStoredTime");
  localStorage.removeItem("expiresIn");
};

// ===============================
// AUTH SLICE
// ===============================

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },

    setUserDetails(
      state,
      action: PayloadAction<LoginResponseData>
    ) {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refresh_token;
      state.expiresIn = action.payload.expires_in;
      state.error = null;
    },

    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },

    setRefreshToken(state, action: PayloadAction<string>) {
      state.refreshToken = action.payload;
    },

    setExpiresIn(state, action: PayloadAction<number>) {
      state.expiresIn = action.payload;
    },

    setUserData(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },

    restoreAuth(
      state,
      action: PayloadAction<{
        user: User;
        token: string;
        refreshToken: string | null;
        expiresIn: number | null;
      }>
    ) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.expiresIn = action.payload.expiresIn;
    },

    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },

    passwordStart(state) {
      state.passwordLoading = true;
      state.passwordError = null;
    },

    passwordSuccess(state) {
      state.passwordLoading = false;
      state.passwordError = null;
    },

    passwordFailure(state, action: PayloadAction<string>) {
      state.passwordLoading = false;
      state.passwordError = action.payload;
    },

    logout(state) {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.expiresIn = null;
      state.error = null;
      state.loading = false;
      state.passwordLoading = false;
      state.passwordError = null;
    },
  },
});

// ===============================
// EXPORT ACTIONS
// ===============================

export const {
  loginStart,
  setUserDetails,
  setToken,
  setRefreshToken,
  setExpiresIn,
  setUserData,
  restoreAuth,
  loginFailure,
  passwordStart,
  passwordSuccess,
  passwordFailure,
  logout,
} = authSlice.actions;

export default authSlice.reducer;

// ===============================
// INITIALIZE AUTH
// RESTORE SESSION FROM LOCAL STORAGE
// ===============================

export const initializeAuth =
  () => async (dispatch: AppDispatch) => {
    try {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      const user = getUserFromLocalStorage();
      const storedExpiresIn = localStorage.getItem("expiresIn");

      if (token && user) {
        dispatch(
          restoreAuth({
            user,
            token,
            refreshToken,
            expiresIn: storedExpiresIn
              ? Number(storedExpiresIn)
              : null,
          })
        );
      }
    } catch (error) {
      console.error("Error initializing auth:", error);
    }
  };

// ===============================
// LOGIN API
// POST /api/v1/auth/employee/login
// ===============================

export const login =
  (loginData: LoginRequest) =>
  async (dispatch: AppDispatch) => {
    dispatch(loginStart());

    try {
      const response = await fetch(
        getApiUrl("/api/v1/auth/employee/login"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(loginData),
        }
      );

      const data: ApiResponse<LoginResponseData> =
        await response.json();

      if (!response.ok || !data.success || !data.data) {
        const message = data.message || "Login failed";

        dispatch(loginFailure(message));

        return { success: false, message };
      }

      dispatch(setUserDetails(data.data));

      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem(
          "refreshToken",
          data.data.refresh_token
        );
        localStorage.setItem(
          "userDetails",
          JSON.stringify(data.data.user)
        );
        localStorage.setItem("loginSuccess", "true");
        localStorage.setItem(
          "tokenStoredTime",
          Date.now().toString()
        );
        localStorage.setItem(
          "expiresIn",
          data.data.expires_in.toString()
        );
      }

      return {
        success: true,
        message: data.message,
        payload: data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      dispatch(loginFailure(message));

      return { success: false, message };
    }
  };

// ===============================
// REFRESH TOKEN API
// POST /api/v1/auth/refresh
// ===============================

export const refreshAuthToken =
  () => async (dispatch: AppDispatch) => {
    try {
      if (typeof window === "undefined") {
        return {
          success: false,
          message: "Browser environment required",
        };
      }

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        return {
          success: false,
          message: "Your session has expired. Please sign in again.",
          reauthenticate: true,
        };
      }
      const originalToken = localStorage.getItem("token");

      const requestData: RefreshTokenRequest = {
        refresh_token: refreshToken,
      };

      const response = await fetch(
        getApiUrl("/api/v1/auth/refresh"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );

      const data: ApiResponse<RefreshResponseData> =
        await response.json();

      if (!response.ok || !data.success || !data.data?.token) {
        const message =
          data.message || "Unable to refresh token";

        return {
          success: false,
          message: response.status === 400 || response.status === 401 || response.status === 403
            ? "Your session has expired. Please sign in again."
            : message,
          reauthenticate: response.status === 400 || response.status === 401 || response.status === 403,
        };
      }

      if (
        localStorage.getItem("refreshToken") !== refreshToken ||
        localStorage.getItem("token") !== originalToken
      ) {
        return { success: false, message: "Your session changed. Please sign in again." };
      }

      // Update access token in Redux
      dispatch(setToken(data.data.token));
      dispatch(setExpiresIn(data.data.expires_in));
      if (data.data.refresh_token) {
        dispatch(setRefreshToken(data.data.refresh_token));
        localStorage.setItem("refreshToken", data.data.refresh_token);
      }

      // Update access token in localStorage
      localStorage.setItem("token", data.data.token);
      localStorage.setItem(
        "tokenStoredTime",
        Date.now().toString()
      );
      localStorage.setItem(
        "expiresIn",
        data.data.expires_in.toString()
      );

      return {
        success: true,
        message: "Token refreshed successfully",
        data: data.data,
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        message,
      };
    }
  };

// ===============================
// CHANGE PASSWORD API
// POST /api/v1/auth/changepassword
// ===============================

export const changePassword =
  (passwordData: ChangePasswordRequest) =>
  async (dispatch: AppDispatch) => {
    dispatch(passwordStart());

    try {
      if (typeof window === "undefined") {
        throw new Error("Browser environment required");
      }

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await authenticatedFetch(
        getApiUrl("/api/v1/auth/changepassword"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(passwordData),
        }
      );

      const data: ApiResponse<null> = await response.json();

      if (!response.ok || !data.success) {
        const message =
          data.message || "Password change failed";

        dispatch(passwordFailure(message));

        return {
          success: false,
          message,
        };
      }

      dispatch(passwordSuccess());

      return {
        success: true,
        message:
          data.message || "Password changed successfully",
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Unknown error";

      dispatch(passwordFailure(message));

      return {
        success: false,
        message,
      };
    }
  };

// ===============================
// LOGOUT
// ===============================

export const performLogout =
  () => async (dispatch: AppDispatch) => {
    if (typeof window !== "undefined") {
      clearAuthStorage();
      clearSessionQuote();
    }

    dispatch(logout());

    return {
      success: true,
      message: "Logged out successfully",
    };
  };
