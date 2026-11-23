import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface LeaveRequestPayload {
  from_date: string;
  to_date: string;
  reason: string;
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  from_date: string;
  to_date: string;
  days: string;
  reason: string;
  is_retroactive: boolean;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface MyLeaveRequests {
  total_requests: number;
  leave_requests: LeaveRequest[];
}

export interface LeaveBalance {
  current: number;
  pending_reserved: number;
  available_after_reservation: number;
}

export interface PermissionBalance {
  month: number;
  year: number;
  monthly_limit: number;
  used_minutes: number;
  pending_minutes: number;
  remaining_minutes: number;
}

export interface PermissionRequestPayload {
  perm_date: string;
  start_time: string;
  minutes: number;
  reason: string;
}

export interface PermissionRequest {
  id: string;
  user_id: string;
  perm_date: string;
  start_time: string;
  minutes: number;
  reason: string;
  is_retroactive: boolean;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface MyPermissionRequests {
  total_requests: number;
  permission_requests: PermissionRequest[];
}

export type RegularizationType = "MISSED_IN" | "MISSED_OUT" | "BOTH";

export interface RegularizationRequestPayload {
  work_date: string;
  type: RegularizationType;
  claimed_in?: string;
  claimed_out?: string;
  reason: string;
}

export interface RegularizationRequest {
  id: string;
  user_id: string;
  work_date: string;
  type: string;
  claimed_in: string | null;
  claimed_out: string | null;
  reason: string;
  status: string;
  decided_by?: string | null;
  decided_at?: string | null;
  decision_note?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface MyRegularizationRequests {
  requests: RegularizationRequest[];
}

export interface PermissionRequestResult {
  permission_request: PermissionRequest;
  balance: {
    monthly_limit: number;
    approved_minutes: number;
    pending_minutes: number;
    remaining_after_reservation: number;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface LeaveRequestState {
  applying: boolean;
  cancelling: boolean;
  error: string | null;
  leaveBalance: LeaveBalance | null;
  permissionBalance: PermissionBalance | null;
  permissionBalanceLoading: boolean;
  permissionBalanceError: string | null;
  applyingPermission: boolean;
  applyingRegularization: boolean;
  leaveRequests: LeaveRequest[];
  leaveRequestsLoading: boolean;
  leaveRequestsError: string | null;
  permissionRequests: PermissionRequest[];
  permissionRequestsLoading: boolean;
  permissionRequestsError: string | null;
  regularizationRequests: RegularizationRequest[];
  regularizationRequestsLoading: boolean;
  regularizationRequestsError: string | null;
}

const initialState: LeaveRequestState = {
  applying: false,
  cancelling: false,
  error: null,
  leaveBalance: null,
  permissionBalance: null,
  permissionBalanceLoading: false,
  permissionBalanceError: null,
  applyingPermission: false,
  applyingRegularization: false,
  leaveRequests: [],
  leaveRequestsLoading: false,
  leaveRequestsError: null,
  permissionRequests: [],
  permissionRequestsLoading: false,
  permissionRequestsError: null,
  regularizationRequests: [],
  regularizationRequestsLoading: false,
  regularizationRequestsError: null,
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    throw new Error("Leave requests require a browser session.");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found. Please login again.");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const readApiResponse = async <T,>(
  response: Response,
  requestType = "Request"
): Promise<ApiResponse<T>> => {
  try {
    return await response.json() as ApiResponse<T>;
  } catch {
    throw new Error(`${requestType} failed (${response.status}).`);
  }
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to process leave request.";

interface RequestMonthFilter {
  month: number;
  year: number;
}

const getMonthQuery = ({ month, year }: RequestMonthFilter) =>
  `?month=${encodeURIComponent(String(month))}&year=${encodeURIComponent(String(year))}`;

export const fetchMyLeaveRequests = createAsyncThunk<
  MyLeaveRequests,
  RequestMonthFilter,
  { rejectValue: string }
>("requests/fetchMyLeaveRequests", async (filter, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leave/me/requests${getMonthQuery(filter)}`,
      { headers: getAuthHeaders() }
    );
    const result = await readApiResponse<MyLeaveRequests>(response, "Leave requests");

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Leave requests failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchMyPermissionRequests = createAsyncThunk<
  MyPermissionRequests,
  RequestMonthFilter,
  { rejectValue: string }
>("requests/fetchMyPermissionRequests", async (filter, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/permission/me/permission/requests${getMonthQuery(filter)}`,
      { headers: getAuthHeaders() }
    );
    const result = await readApiResponse<MyPermissionRequests>(response, "Permission requests");

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Permission requests failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchMyRegularizationRequests = createAsyncThunk<
  MyRegularizationRequests,
  RequestMonthFilter,
  { rejectValue: string }
>("requests/fetchMyRegularizationRequests", async (filter, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/regularization/me${getMonthQuery(filter)}`,
      { headers: getAuthHeaders() }
    );
    const result = await readApiResponse<MyRegularizationRequests>(
      response,
      "Regularization requests"
    );

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Regularization requests failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const applyForLeave = createAsyncThunk<
  { leave_request: LeaveRequest; balance: LeaveBalance },
  LeaveRequestPayload,
  { rejectValue: string }
>("requests/applyForLeave", async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/leave/me/apply`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await readApiResponse<{
      leave_request: LeaveRequest;
      balance: LeaveBalance;
    }>(response);

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Leave application failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const cancelMyLeaveRequest = createAsyncThunk<
  LeaveRequest,
  { id: string },
  { rejectValue: string }
>("requests/cancelMyLeaveRequest", async ({ id }, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/leave/me/${encodeURIComponent(id)}/cancel`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );
    const result = await readApiResponse<{ leave_request: LeaveRequest }>(response);

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Leave cancellation failed (${response.status}).`);
    }

    return result.data.leave_request;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchMyPermissionBalance = createAsyncThunk<
  PermissionBalance,
  void,
  { rejectValue: string }
>("requests/fetchMyPermissionBalance", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/permission/me/balance`, {
      headers: getAuthHeaders(),
    });
    const result = await readApiResponse<PermissionBalance>(response, "Permission balance request");

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Permission balance request failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const applyForPermission = createAsyncThunk<
  PermissionRequestResult,
  PermissionRequestPayload,
  { rejectValue: string }
>("requests/applyForPermission", async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/permission/me/apply`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await readApiResponse<PermissionRequestResult>(response, "Permission application");

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Permission application failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const applyForRegularization = createAsyncThunk<
  { regularization_request: RegularizationRequest },
  RegularizationRequestPayload,
  { rejectValue: string }
>("requests/applyForRegularization", async (payload, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/regularization/me/apply`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await readApiResponse<{ regularization_request: RegularizationRequest }>(
      response,
      "Regularization application"
    );

    if (!response.ok || !result.success || !result.data?.regularization_request) {
      throw new Error(result.message || `Regularization application failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const cancelMyPermissionRequest = createAsyncThunk<
  PermissionRequest,
  { id: string },
  { rejectValue: string }
>("requests/cancelMyPermissionRequest", async ({ id }, { rejectWithValue }) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/permission/me/${encodeURIComponent(id)}/cancel`,
      {
        method: "POST",
        headers: getAuthHeaders(),
      }
    );
    const result = await readApiResponse<{ permission_request: PermissionRequest }>(
      response,
      "Permission cancellation"
    );

    if (!response.ok || !result.success || !result.data) {
      throw new Error(result.message || `Permission cancellation failed (${response.status}).`);
    }

    return result.data.permission_request;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const requestSlice = createSlice({
  name: "requests",
  initialState,
  reducers: {
    clearLeaveRequestError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.leaveRequestsLoading = true;
        state.leaveRequestsError = null;
        state.leaveRequests = [];
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action) => {
        state.leaveRequestsLoading = false;
        state.leaveRequests = action.payload.leave_requests;
      })
      .addCase(fetchMyLeaveRequests.rejected, (state, action) => {
        state.leaveRequestsLoading = false;
        state.leaveRequestsError =
          action.payload || action.error.message || "Unable to load leave requests.";
      })
      .addCase(fetchMyPermissionRequests.pending, (state) => {
        state.permissionRequestsLoading = true;
        state.permissionRequestsError = null;
        state.permissionRequests = [];
      })
      .addCase(fetchMyPermissionRequests.fulfilled, (state, action) => {
        state.permissionRequestsLoading = false;
        state.permissionRequests = action.payload.permission_requests;
      })
      .addCase(fetchMyPermissionRequests.rejected, (state, action) => {
        state.permissionRequestsLoading = false;
        state.permissionRequestsError =
          action.payload || action.error.message || "Unable to load permission requests.";
      })
      .addCase(fetchMyRegularizationRequests.pending, (state) => {
        state.regularizationRequestsLoading = true;
        state.regularizationRequestsError = null;
        state.regularizationRequests = [];
      })
      .addCase(fetchMyRegularizationRequests.fulfilled, (state, action) => {
        state.regularizationRequestsLoading = false;
        state.regularizationRequests = action.payload.requests;
      })
      .addCase(fetchMyRegularizationRequests.rejected, (state, action) => {
        state.regularizationRequestsLoading = false;
        state.regularizationRequestsError =
          action.payload || action.error.message || "Unable to load regularization requests.";
      })
      .addCase(applyForLeave.pending, (state) => {
        state.applying = true;
        state.error = null;
      })
      .addCase(applyForLeave.fulfilled, (state, action) => {
        state.applying = false;
        state.leaveBalance = action.payload.balance;
      })
      .addCase(applyForLeave.rejected, (state, action) => {
        state.applying = false;
        state.error = action.payload || action.error.message || "Unable to submit leave request.";
      })
      .addCase(cancelMyLeaveRequest.pending, (state) => {
        state.cancelling = true;
        state.error = null;
      })
      .addCase(cancelMyLeaveRequest.fulfilled, (state) => {
        state.cancelling = false;
      })
      .addCase(cancelMyLeaveRequest.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload || action.error.message || "Unable to cancel leave request.";
      })
      .addCase(fetchMyPermissionBalance.pending, (state) => {
        state.permissionBalanceLoading = true;
        state.permissionBalanceError = null;
        state.error = null;
      })
      .addCase(fetchMyPermissionBalance.fulfilled, (state, action) => {
        state.permissionBalanceLoading = false;
        state.permissionBalanceError = null;
        state.permissionBalance = action.payload;
      })
      .addCase(fetchMyPermissionBalance.rejected, (state, action) => {
        state.permissionBalanceLoading = false;
        state.permissionBalanceError =
          action.payload || action.error.message || "Unable to load permission balance.";
        state.error = state.permissionBalanceError;
      })
      .addCase(applyForPermission.pending, (state) => {
        state.applyingPermission = true;
        state.error = null;
      })
      .addCase(applyForPermission.fulfilled, (state, action) => {
        state.applyingPermission = false;
        const balance = state.permissionBalance;
        if (balance) {
          state.permissionBalance = {
            ...balance,
            used_minutes: action.payload.balance.approved_minutes,
            pending_minutes: action.payload.balance.pending_minutes,
            remaining_minutes: action.payload.balance.remaining_after_reservation,
          };
        }
      })
      .addCase(applyForPermission.rejected, (state, action) => {
        state.applyingPermission = false;
        state.error = action.payload || action.error.message || "Unable to submit permission request.";
      })
      .addCase(applyForRegularization.pending, (state) => {
        state.applyingRegularization = true;
        state.error = null;
      })
      .addCase(applyForRegularization.fulfilled, (state) => {
        state.applyingRegularization = false;
      })
      .addCase(applyForRegularization.rejected, (state, action) => {
        state.applyingRegularization = false;
        state.error = action.payload || action.error.message || "Unable to submit regularization request.";
      })
      .addCase(cancelMyPermissionRequest.pending, (state) => {
        state.cancelling = true;
        state.error = null;
      })
      .addCase(cancelMyPermissionRequest.fulfilled, (state) => {
        state.cancelling = false;
      })
      .addCase(cancelMyPermissionRequest.rejected, (state, action) => {
        state.cancelling = false;
        state.error = action.payload || action.error.message || "Unable to cancel permission request.";
      });
  },
});

export const { clearLeaveRequestError } = requestSlice.actions;
export default requestSlice.reducer;