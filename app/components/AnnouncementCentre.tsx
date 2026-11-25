"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchMyNotifications,
  fetchMyUnreadNotificationCount,
  isActiveAnnouncementNotification,
  isAnnouncementNotification,
  markNotificationAsRead,
} from "../store/notifications/notificationSlice";

export default function AnnouncementCenter() {
  const dispatch = useAppDispatch();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const token = useAppSelector((state) => state.auth.token);
  const notification = useAppSelector((state) =>
    state.notifications.notifications
      .filter(
        (notification) =>
          !notification.is_read &&
          (isActiveAnnouncementNotification(notification) ||
            notification.type.trim().toUpperCase() === "WORKDAY_SWAP")
      )
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      )[0]
  );
  const markingRead = useAppSelector((state) =>
    notification
      ? state.notifications.markingReadIds.includes(notification.id)
      : false
  );
  const actionError = useAppSelector((state) => state.notifications.actionError);
  const isOpen = Boolean(token && notification);

  useEffect(() => {
    if (!token) return;

    const refresh = () => {
      void dispatch(fetchMyNotifications());
      void dispatch(fetchMyUnreadNotificationCount());
    };

    refresh();
    const intervalId = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(intervalId);
  }, [dispatch, token]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || !notification) return null;

  const dismiss = () => {
    void dispatch(markNotificationAsRead(notification.id));
  };

  const isAnnouncement = isAnnouncementNotification(notification);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="announcement-title"
      aria-describedby="announcement-message"
      onCancel={(event) => event.preventDefault()}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(580px,calc(100vw-2rem))] overflow-y-auto rounded-[32px] border border-[#ECE3D3] bg-[#FCFAF7] p-0 text-stone-800 shadow-[0_28px_80px_rgba(72,60,45,0.22)] backdrop:bg-stone-900/45 backdrop:backdrop-blur-xs font-sans antialiased"
    >
      {/* Decorative Warm Sand / Terracotta Top Accent Bar */}
      <div className={`h-2 w-full ${isAnnouncement ? "bg-[#C85D44]" : "bg-[#9B6A38]"}`} />

      <div className="p-6 sm:p-8">
        {/* Header with Icon and Badge */}
        <div className="flex items-start gap-4">
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl font-black shadow-xs ring-1 ring-inset ${
              isAnnouncement
                ? "bg-[#FEF1EC] text-[#C85D44] ring-[#F4C8B9]"
                : "bg-[#FDF8F0] text-[#9B6A38] ring-[#EDD7BE]"
            }`}
          >
            {isAnnouncement ? "!" : "⇄"}
          </span>

          <div className="min-w-0 flex-1">
            <span
              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                isAnnouncement
                  ? "bg-[#FEF1EC] text-[#C85D44]"
                  : "bg-[#FDF8F0] text-[#9B6A38]"
              }`}
            >
              {isAnnouncement ? "Important announcement" : "Workday swap"}
            </span>
            <h2
              id="announcement-title"
              className="mt-1.5 break-words text-xl font-black text-stone-900 sm:text-2xl"
            >
              {notification.title}
            </h2>
          </div>
        </div>

        {/* Announcement Message Body */}
        <div className="mt-5 rounded-2xl border border-[#ECE3D3] bg-white p-4 sm:p-5 shadow-xs">
          <p
            id="announcement-message"
            className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed text-stone-700 sm:text-[15px]"
          >
            {notification.message}
          </p>
        </div>

        {actionError && (
          <p role="alert" className="mt-3 rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] px-3.5 py-2 text-xs font-bold text-[#C85D44]">
            {actionError}
          </p>
        )}

        {/* Footer with Timestamp and Action */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE3D3] pt-4">
          <div className="flex items-center gap-1.5 text-xs text-stone-500">
            <svg className="h-3.5 w-3.5 text-[#707C65]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <time dateTime={notification.created_at} className="font-semibold">
              {new Intl.DateTimeFormat("en-IN", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              }).format(new Date(notification.created_at))}
            </time>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={dismiss}
            disabled={markingRead}
            className="rounded-xl bg-[#5D6953] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#4D5844] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {markingRead ? "Closing…" : "Acknowledge & Close"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
