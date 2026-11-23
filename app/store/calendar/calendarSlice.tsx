import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface CalendarAttendance {
  id?: string;
  work_date: string;
  status: string | null;
  lop_value: number | string;
  needs_regularization: boolean;
  is_late: boolean;
  is_locked: boolean;
}

export interface CalendarEvent {
  type: "COMMON_HOLIDAY" | "EMPLOYEE_HOLIDAY" | "PENDING_LEAVE" | string;
  date?: string;
  from_date?: string;
  to_date?: string;
  name?: string;
  days?: number;
  status?: string;
}

export interface CalendarDay {
  date: string;
  attendance: CalendarAttendance | null;
  events: CalendarEvent[];
}

export interface EmployeeCalendarData {
  employee: {
    id: string;
    emp_code: string;
    name: string;
    designation: string;
  };
  calendar: {
    month: number;
    year: number;
    days: CalendarDay[];
    events: CalendarEvent[];
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface CalendarState {
  data: EmployeeCalendarData | null;
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  data: null,
  loading: false,
  error: null,
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

export const fetchMyCalendar = createAsyncThunk<
  EmployeeCalendarData,
  { month: number; year: number },
  { rejectValue: string }
>("calendar/fetchMyCalendar", async ({ month, year }, { rejectWithValue }) => {
  if (typeof window === "undefined") {
    return rejectWithValue("Calendar requests require a browser session.");
  }

  const token = localStorage.getItem("token");
  if (!token) {
    return rejectWithValue("Authentication token not found.");
  }

  try {
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    });
    const response = await fetch(
      `${API_BASE_URL}/api/v1/employees/me/calendar?${params.toString()}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    let result: ApiResponse<EmployeeCalendarData>;
    try {
      result = await response.json();
    } catch {
      throw new Error(`Loading calendar failed (${response.status}).`);
    }

    if (!response.ok || !result.success || result.data === undefined) {
      throw new Error(result.message || `Loading calendar failed (${response.status}).`);
    }

    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unable to load employee calendar."
    );
  }
});

const calendarSlice = createSlice({
  name: "calendar",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCalendar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyCalendar.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMyCalendar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Unable to load employee calendar.";
      });
  },
});

export default calendarSlice.reducer;
