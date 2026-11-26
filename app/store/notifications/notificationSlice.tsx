import { authenticatedFetch } from "../auth/authenticatedFetch";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export interface EmployeeNotification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  message: string;
  expires_on?: string | null;
  entity_type: string | null;
  entity_id: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export const isAnnouncementNotification = (notification: EmployeeNotification) =>
  notification.type.trim().toUpperCase() === "ANNOUNCEMENT" ||
  notification.entity_type?.trim().toLowerCase() === "announcement";

const toLocalISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const isActiveAnnouncementNotification = (
  notification: EmployeeNotification,
  now = new Date()
) =>
  isAnnouncementNotification(notification) &&
  (!notification.expires_on || notification.expires_on.slice(0, 10) >= toLocalISODate(now));

export const getNotificationHref = (notification: EmployeeNotification) => {
  const type = notification.type.trim().toUpperCase();
  const entityType = notification.entity_type?.trim().toLowerCase();

  if (type === "PAYSLIP_PUBLISHED" || entityType === "payslip") return "/payslip";
  if (type === "WORKDAY_SWAP" || entityType === "workday_swap_groups") return "/attendance";
  return `/notifications#notification-${encodeURIComponent(notification.id)}`;
};

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface NotificationState {
  notifications: EmployeeNotification[];
  pagination: NotificationPagination | null;
  unreadCount: number;
  loading: boolean;
  error: string | null;
  unreadCountLoading: boolean;
  unreadCountError: string | null;
  markingReadIds: string[];
  markingAllRead: boolean;
  actionError: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  pagination: null,
  unreadCount: 0,
  loading: false,
  error: null,
  unreadCountLoading: false,
  unreadCountError: null,
  markingReadIds: [],
  markingAllRead: false,
  actionError: null,
};

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const NOTIFICATIONS_URL = `${API_BASE_URL}/api/v1/notifications/me`;

const getAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    throw new Error("Notification requests require a browser session.");
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
  response: Response
): Promise<ApiResponse<T>> => {
  try {
    return await response.json() as ApiResponse<T>;
  } catch {
    throw new Error(`Notification request failed (${response.status}).`);
  }
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to process notification request.";

const ensureSuccess = <T,>(
  response: Response,
  result: ApiResponse<T>,
  requestName: string
) => {
  if (!response.ok || !result.success || result.data === undefined) {
    throw new Error(result.message || `${requestName} failed (${response.status}).`);
  }
  return result.data;
};

export const fetchMyNotifications = createAsyncThunk<
  { notifications: EmployeeNotification[]; pagination: NotificationPagination },
  void,
  { rejectValue: string }
>("notifications/fetchMyNotifications", async (_, { rejectWithValue }) => {
  try {
    const response = await authenticatedFetch(`${NOTIFICATIONS_URL}/get-notifications`, {
      headers: getAuthHeaders(),
    });
    const result = await readApiResponse<{
      notifications: EmployeeNotification[];
      pagination: NotificationPagination;
    }>(response);
    return ensureSuccess(response, result, "Loading notifications");
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchMyUnreadNotificationCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("notifications/fetchUnreadCount", async (_, { rejectWithValue }) => {
  try {
    const response = await authenticatedFetch(`${NOTIFICATIONS_URL}/unread-count`, {
      headers: getAuthHeaders(),
    });
    const result = await readApiResponse<{ unread_count: number }>(response);
    return ensureSuccess(response, result, "Loading unread notifications").unread_count;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const markAllNotificationsAsRead = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("notifications/markAllAsRead", async (_, { rejectWithValue }) => {
  try {
    const response = await authenticatedFetch(`${NOTIFICATIONS_URL}/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    const result = await readApiResponse<{ updated_count: number }>(response);
    return ensureSuccess(response, result, "Marking notifications as read").updated_count;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const markNotificationAsRead = createAsyncThunk<
  Pick<EmployeeNotification, "id" | "type" | "title" | "message" | "is_read" | "read_at">,
  string,
  { rejectValue: string }
>("notifications/markAsRead", async (id, { rejectWithValue }) => {
  try {
    const response = await authenticatedFetch(
      `${NOTIFICATIONS_URL}/${encodeURIComponent(id)}/read`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
      }
    );
    const result = await readApiResponse<{
      notification: Pick<
        EmployeeNotification,
        "id" | "type" | "title" | "message" | "is_read" | "read_at"
      >;
    }>(response);
    return ensureSuccess(response, result, "Marking notification as read").notification;
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(fetchMyNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Unable to load notifications.";
      })
      .addCase(fetchMyUnreadNotificationCount.pending, (state) => {
        state.unreadCountLoading = true;
        state.unreadCountError = null;
      })
      .addCase(fetchMyUnreadNotificationCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
        state.unreadCountLoading = false;
      })
      .addCase(fetchMyUnreadNotificationCount.rejected, (state, action) => {
        state.unreadCountLoading = false;
        state.unreadCountError =
          action.payload || action.error.message || "Unable to load unread notifications.";
      })
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.markingAllRead = true;
        state.actionError = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.markingAllRead = false;
        state.unreadCount = Math.max(0, state.unreadCount - action.payload);
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          is_read: true,
          read_at: notification.read_at || new Date().toISOString(),
        }));
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.markingAllRead = false;
        state.actionError =
          action.payload || action.error.message || "Unable to mark notifications as read.";
      })
      .addCase(markNotificationAsRead.pending, (state, action) => {
        state.actionError = null;
        if (!state.markingReadIds.includes(action.meta.arg)) {
          state.markingReadIds.push(action.meta.arg);
        }
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.markingReadIds = state.markingReadIds.filter((id) => id !== action.payload.id);
        const index = state.notifications.findIndex(
          (notification) => notification.id === action.payload.id
        );
        if (index >= 0) {
          const wasUnread = !state.notifications[index].is_read;
          state.notifications[index] = {
            ...state.notifications[index],
            ...action.payload,
          };
          if (wasUnread && action.payload.is_read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        } else if (action.payload.is_read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.markingReadIds = state.markingReadIds.filter(
          (id) => id !== action.meta.arg
        );
        state.actionError =
          action.payload || action.error.message || "Unable to mark notification as read.";
      });
  },
});

export default notificationSlice.reducer;
