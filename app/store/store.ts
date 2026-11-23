import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from "redux";
import authReducer from "./auth/authSlice";
import attendanceReducer from "./attendance/attendanceSlice";
import requestReducer from "./request/requestSlice";
import notificationReducer from "./notifications/notificationSlice";
import payslipReducer from "./paySlip/payslipSlice";
import dashboardReducer from "./dashboard/dashboardSlice";
import calendarReducer from "./calendar/calendarSlice";
import profileReducer from "./profile/profileSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  attendance: attendanceReducer,
  requests: requestReducer,
  notifications: notificationReducer,
  payslips: payslipReducer,
  dashboard: dashboardReducer,
  calendar: calendarReducer,
  
  // 👇 2. Add the profile reducer here
  profile: profileReducer,
});


export const store = configureStore({
  reducer: rootReducer
});

// Type definitions
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;