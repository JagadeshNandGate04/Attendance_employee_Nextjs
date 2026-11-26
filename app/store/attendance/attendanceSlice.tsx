import { authenticatedFetch } from "../auth/authenticatedFetch";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface AttendanceEmployee {
  id: string;
  emp_code: string;
  name: string;
  designation: string;
}

export interface AttendanceDaySummary {
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
  lop_value: string;
  is_locked: boolean;
}

export interface AttendanceMonthData {
  employee: AttendanceEmployee;
  month: number;
  year: number;
  day_summaries: AttendanceDaySummary[];
  today: {
    date: string;
    status: string;
    last_punch: string | null;
  };
  totals: {
    present: number;
    half: number;
    absent: number;
    leave: number;
    holiday: number;
    weekly_off: number;
    insufficient: number;
    late_count: number;
    work_hours: number;
    work_minutes: number;
  };
}

export interface AttendancePunch {
  id: string;
  punched_at: string;
  direction: string;
  source_type?: string;
  is_correction?: boolean;
  is_voided?: boolean;
}

export interface AttendanceSession {
  id: string;
  in_at: string | null;
  out_at: string | null;
  duration_min: number | null;
  flag: string | null;
}

export interface AttendanceDayData {
  employee: AttendanceEmployee;
  date: string;
  summary: (AttendanceDaySummary & {
    user_id?: string;
    created_at?: string;
    updated_at?: string;
  }) | null;
  sessions: AttendanceSession[];
  punches: AttendancePunch[];
  break_gaps: Array<Record<string, unknown>>;
  flags: {
    needs_regularization: boolean;
    is_late: boolean;
    excess_break: boolean;
    is_locked: boolean;
  };
  permissions: Array<Record<string, unknown>>;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface AttendanceState {
  monthData: AttendanceMonthData | null;
  dayData: AttendanceDayData | null;
  monthLoading: boolean;
  dayLoading: boolean;
  monthError: string | null;
  dayError: string | null;
  monthRequestId: string | null;
  dayRequestId: string | null;
}

const initialState: AttendanceState = {
  monthData: null,
  dayData: null,
  monthLoading: false,
  dayLoading: false,
  monthError: null,
  dayError: null,
  monthRequestId: null,
  dayRequestId: null,
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    throw new Error("Attendance requests require a browser session.");
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

const fetchAttendanceData = async <T,>(url: string): Promise<T> => {
  const response = await authenticatedFetch(url, { headers: getAuthHeaders() });
  let result: ApiResponse<T>;

  try {
    result = await response.json();
  } catch {
    throw new Error(`Attendance request failed (${response.status}).`);
  }

  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message || `Attendance request failed (${response.status}).`);
  }

  return result.data;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to load attendance.";

export const fetchMyAttendanceMonth = createAsyncThunk<
  AttendanceMonthData,
  { month: number; year: number },
  { rejectValue: string }
>("attendance/fetchMonth", async ({ month, year }, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    });
    return await fetchAttendanceData<AttendanceMonthData>(
      `${API_BASE_URL}/api/v1/attendance/me?${params.toString()}`
    );
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchMyAttendanceDay = createAsyncThunk<
  AttendanceDayData,
  { date: string },
  { rejectValue: string }
>("attendance/fetchDay", async ({ date }, { rejectWithValue }) => {
  try {
    const params = new URLSearchParams({ date });
    return await fetchAttendanceData<AttendanceDayData>(
      `${API_BASE_URL}/api/v1/attendance/me/day?${params.toString()}`
    );
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyAttendanceMonth.pending, (state, action) => {
        state.monthLoading = true;
        state.monthError = null;
        state.monthData = null;
        state.monthRequestId = action.meta.requestId;
      })
      .addCase(fetchMyAttendanceMonth.fulfilled, (state, action) => {
        if (state.monthRequestId !== action.meta.requestId) return;
        state.monthData = action.payload;
        state.monthLoading = false;
        state.monthRequestId = null;
      })
      .addCase(fetchMyAttendanceMonth.rejected, (state, action) => {
        if (state.monthRequestId !== action.meta.requestId) return;
        state.monthLoading = false;
        state.monthError = action.payload || action.error.message || "Unable to load attendance.";
        state.monthRequestId = null;
      })
      .addCase(fetchMyAttendanceDay.pending, (state, action) => {
        state.dayLoading = true;
        state.dayError = null;
        state.dayData = null;
        state.dayRequestId = action.meta.requestId;
      })
      .addCase(fetchMyAttendanceDay.fulfilled, (state, action) => {
        if (state.dayRequestId !== action.meta.requestId) return;
        state.dayData = action.payload;
        state.dayLoading = false;
        state.dayRequestId = null;
      })
      .addCase(fetchMyAttendanceDay.rejected, (state, action) => {
        if (state.dayRequestId !== action.meta.requestId) return;
        state.dayLoading = false;
        state.dayError = action.payload || action.error.message || "Unable to load day attendance.";
        state.dayRequestId = null;
      });
  },
});

export default attendanceSlice.reducer;