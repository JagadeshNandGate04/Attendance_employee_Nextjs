import { authenticatedFetch } from "../auth/authenticatedFetch";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface Payslip {
  id: string;
  month: number;
  year: number;
  published_at: string;
  created_at: string;
  download_url: string;
}

interface PayslipState {
  payslips: Payslip[];
  total: number;
  loading: boolean;
  error: string | null;
  downloadingIds: string[];
  viewingIds: string[];
  downloadError: string | null;
  listRequestId: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

const initialState: PayslipState = {
  payslips: [],
  total: 0,
  loading: false,
  error: null,
  downloadingIds: [],
  viewingIds: [],
  downloadError: null,
  listRequestId: null,
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const PAYSLIPS_URL = `${API_BASE_URL}/api/v1/payroll/payslips/me`;

const getAuthHeaders = (accept: string): HeadersInit => {
  if (typeof window === "undefined") {
    throw new Error("Payslip requests require a browser session.");
  }
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("Authentication token not found. Please login again.");
  }
  return { Accept: accept, Authorization: `Bearer ${token}` };
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to process payslip request.";

const getResponseError = async (response: Response, action: string) => {
  if (response.headers.get("content-type")?.includes("application/json")) {
    try {
      const result: ApiResponse<never> = await response.json();
      if (typeof result.message === "string" && result.message) return result.message;
    } catch {
      return `${action} failed (${response.status}): invalid error response.`;
    }
  }
  return `${action} failed (${response.status}).`;
};

export const fetchMyPayslips = createAsyncThunk<
  { total: number; payslips: Payslip[] },
  void,
  { rejectValue: string }
>("payslips/fetchMyPayslips", async (_, { rejectWithValue }) => {
  try {
    const response = await authenticatedFetch(PAYSLIPS_URL, { headers: getAuthHeaders("application/json") });
    if (!response.ok) throw new Error(await getResponseError(response, "Loading payslips"));
    let result: ApiResponse<{ total: number; payslips: Payslip[] }>;
    try {
      result = await response.json();
    } catch {
      throw new Error("Loading payslips failed: invalid response.");
    }
    if (!result.success || !result.data || !Array.isArray(result.data.payslips) || typeof result.data.total !== "number") {
      throw new Error(result.message || "Loading payslips failed: invalid response.");
    }
    return result.data;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const fetchPayslipPdf = async (id: string, action: string) => {
  const response = await authenticatedFetch(`${PAYSLIPS_URL}/${encodeURIComponent(id)}/download`, {
    headers: getAuthHeaders("application/pdf"),
  });
  if (!response.ok) throw new Error(await getResponseError(response, action));
  const contentType = response.headers.get("content-type")?.toLowerCase() || "";
  if (contentType.includes("application/json") || contentType.includes("text/html")) {
    throw new Error(`${action} failed: the server did not return a PDF.`);
  }
  const blob = await response.blob();
  if (blob.size === 0) throw new Error(`${action} failed: the PDF is empty.`);
  return new Blob([blob], { type: "application/pdf" });
};

export const downloadMyPayslip = createAsyncThunk<
  void,
  { id: string; filename: string },
  { rejectValue: string }
>("payslips/downloadMyPayslip", async ({ id, filename }, { rejectWithValue }) => {
  try {
    const blob = await fetchPayslipPdf(id, "Downloading payslip");
    const url = URL.createObjectURL(blob);
    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const viewMyPayslip = createAsyncThunk<
  void,
  string,
  { rejectValue: string }
>("payslips/viewMyPayslip", async (id, { rejectWithValue }) => {
  let tab: Window | null = null;
  try {
    tab = window.open("", "_blank");
    if (!tab) throw new Error("Unable to open the payslip tab. Please allow pop-ups and try again.");
    tab.opener = null;
    const blob = await fetchPayslipPdf(id, "Viewing payslip");
    if (tab.closed) throw new Error("The payslip tab was closed before the PDF loaded.");
    const url = URL.createObjectURL(blob);
    try {
      tab.location.replace(url);
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
    const openedTab = tab;
    const timer = window.setInterval(() => {
      if (openedTab.closed) {
        URL.revokeObjectURL(url);
        window.clearInterval(timer);
      }
    }, 1000);
  } catch (error: unknown) {
    if (tab && !tab.closed) tab.close();
    return rejectWithValue(getErrorMessage(error));
  }
});

const payslipSlice = createSlice({
  name: "payslips",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyPayslips.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.listRequestId = action.meta.requestId;
      })
      .addCase(fetchMyPayslips.fulfilled, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) return;
        state.payslips = action.payload.payslips;
        state.total = action.payload.total;
        state.loading = false;
        state.listRequestId = null;
      })
      .addCase(fetchMyPayslips.rejected, (state, action) => {
        if (state.listRequestId !== action.meta.requestId) return;
        state.payslips = [];
        state.total = 0;
        state.loading = false;
        state.error = action.payload || action.error.message || "Unable to load payslips.";
        state.listRequestId = null;
      })
      .addCase(downloadMyPayslip.pending, (state, action) => {
        state.downloadingIds.push(action.meta.arg.id);
        state.downloadError = null;
      })
      .addCase(downloadMyPayslip.fulfilled, (state, action) => {
        state.downloadingIds = state.downloadingIds.filter((id) => id !== action.meta.arg.id);
      })
      .addCase(downloadMyPayslip.rejected, (state, action) => {
        state.downloadingIds = state.downloadingIds.filter((id) => id !== action.meta.arg.id);
        state.downloadError = action.payload || action.error.message || "Unable to download payslip.";
      })
      .addCase(viewMyPayslip.pending, (state, action) => {
        state.viewingIds.push(action.meta.arg);
        state.downloadError = null;
      })
      .addCase(viewMyPayslip.fulfilled, (state, action) => {
        state.viewingIds = state.viewingIds.filter((id) => id !== action.meta.arg);
      })
      .addCase(viewMyPayslip.rejected, (state, action) => {
        state.viewingIds = state.viewingIds.filter((id) => id !== action.meta.arg);
        state.downloadError = action.payload || action.error.message || "Unable to view payslip.";
      });
  },
});

export default payslipSlice.reducer;