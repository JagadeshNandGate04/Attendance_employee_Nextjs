import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface DashboardEmployee {
  id: string;
  emp_code: string;
  name: string;
  designation: string;
  username?: string;
}

export interface DashboardAttendance {
  id: string;
  work_date: string;
  status: string | null;
  first_in: string | null;
  last_out: string | null;
  work_min: number;
  break_min: number;
  permission_min: number;
  is_late: boolean;
  excess_break: boolean;
  needs_regularization: boolean;
  lop_value: number;
  is_locked: boolean;
  calculated_lop_value: number;
  adjusted_lop_value: number | null;
  lop_adjustment: number | null;
  is_pending: boolean;
}

export interface DashboardCalendarEvent {
  type: string;
  date?: string;
  name?: string;
  from_date?: string;
  to_date?: string;
  days?: number;
  status?: string;
}

export interface DashboardCalendarDay {
  date: string;
  attendance: DashboardAttendance | null;
  events: DashboardCalendarEvent[];
}

export interface EmployeeDashboard {
  employee: DashboardEmployee;
  calendar: {
    month: number;
    year: number;
    days: DashboardCalendarDay[];
    events: DashboardCalendarEvent[];
  };
}

export interface EmployeeBirthday {
  id: string;
  emp_code: string;
  name: string;
  month: number;
  day: number;
}

export interface BirthdayCalendarData {
  month: number | null;
  birthdays: EmployeeBirthday[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface DashboardState {
  data: EmployeeDashboard | null;
  loading: boolean;
  error: string | null;
  requestId: string | null;
  birthdays: BirthdayCalendarData | null;
  birthdaysLoading: boolean;
  birthdaysError: string | null;
  birthdaysRequestId: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
  requestId: null,
  birthdays: null,
  birthdaysLoading: false,
  birthdaysError: null,
  birthdaysRequestId: null,
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    throw new Error("Dashboard requests require a browser session.");
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

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to load your dashboard.";

export const fetchMyDashboard = createAsyncThunk<
  EmployeeDashboard,
  void,
  { rejectValue: string }
>("dashboard/fetchMyDashboard", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/employees/me/dashboard`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    let result: ApiResponse<EmployeeDashboard>;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Loading dashboard failed (${response.status}): invalid response.`);
    }

    if (!response.ok || !result.success || result.data === undefined) {
      throw new Error(result.message || `Loading dashboard failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchMyBirthdays = createAsyncThunk<
  BirthdayCalendarData,
  void,
  { rejectValue: string }
>("dashboard/fetchMyBirthdays", async (_, { rejectWithValue }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/notifications/me/birthdays`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    let result: ApiResponse<BirthdayCalendarData>;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Loading birthdays failed (${response.status}): invalid response.`);
    }

    if (!response.ok || !result.success || result.data === undefined) {
      throw new Error(result.message || `Loading birthdays failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyDashboard.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchMyDashboard.fulfilled, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.data = action.payload;
        state.loading = false;
        state.requestId = null;
      })
      .addCase(fetchMyDashboard.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload || action.error.message || "Unable to load your dashboard.";
        state.requestId = null;
      })
      .addCase(fetchMyBirthdays.pending, (state, action) => {
        state.birthdaysLoading = true;
        state.birthdaysError = null;
        state.birthdaysRequestId = action.meta.requestId;
      })
      .addCase(fetchMyBirthdays.fulfilled, (state, action) => {
        if (state.birthdaysRequestId !== action.meta.requestId) return;
        state.birthdays = action.payload;
        state.birthdaysLoading = false;
        state.birthdaysRequestId = null;
      })
      .addCase(fetchMyBirthdays.rejected, (state, action) => {
        if (state.birthdaysRequestId !== action.meta.requestId) return;
        state.birthdaysLoading = false;
        state.birthdaysError = action.payload || action.error.message || "Unable to load birthdays.";
        state.birthdaysRequestId = null;
      });
  },
});

export default dashboardSlice.reducer;
