'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import TopNav from '../components/topNavBar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  cancelMyLeaveRequest,
  cancelMyPermissionRequest,
  fetchMyLeaveRequests,
  fetchMyPermissionRequests,
  fetchMyPermissionBalance,
  fetchMyRegularizationRequests,
} from '../store/request/requestSlice';
import type {
  LeaveRequest,
  PermissionRequest,
  RegularizationRequest,
} from '../store/request/requestSlice';

// ==========================================
// TYPE DEFINITIONS (Unchanged)
// ==========================================

export type RequestCategory = 'LEAVE' | 'PERMISSION' | 'REGULARIZE';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'REJECTED' | 'UNKNOWN';

export interface RequestRecord {
  id: string;
  type: RequestCategory;
  appliedOn: string;
  targetDate: string;
  targetSub: string;
  details: string;
  categoryTag: string;
  ledgerImpact: string;
  ledgerImpactType?: 'badge' | 'text';
  status: RequestStatus;
  decidedBy: string;
  decisionNote?: string;
  rawId: number | string;
}

const formatRequestDate = (date: string) =>
  new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatAppliedDate = (date: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date)
  );

const normalizeStatus = (status: string): RequestStatus => {
  const normalized = status.toUpperCase();
  return normalized === 'PENDING' ||
    normalized === 'APPROVED' ||
    normalized === 'CANCELLED' ||
    normalized === 'REJECTED'
    ? normalized
    : 'UNKNOWN';
};

const mapLeaveRequest = (request: LeaveRequest): RequestRecord => ({
  id: `#LR-${request.id}`,
  rawId: request.id,
  type: 'LEAVE',
  appliedOn: formatAppliedDate(request.created_at),
  targetDate: `${formatRequestDate(request.from_date)} – ${formatRequestDate(request.to_date)}`,
  targetSub: `${request.days} day${request.days === '1' ? '' : 's'} requested`,
  details: request.reason,
  categoryTag: 'Leave Request',
  ledgerImpact: `-${request.days} Days`,
  status: normalizeStatus(request.status),
  decidedBy: 'Awaiting approval',
});

const mapPermissionRequest = (request: PermissionRequest): RequestRecord => ({
  id: `#PR-${request.id}`,
  rawId: request.id,
  type: 'PERMISSION',
  appliedOn: formatAppliedDate(request.created_at),
  targetDate: formatRequestDate(request.perm_date),
  targetSub: `${request.start_time.slice(0, 5)} · ${request.minutes} mins`,
  details: request.reason,
  categoryTag: 'Short Permission',
  ledgerImpact: `-${request.minutes} Mins`,
  status: normalizeStatus(request.status),
  decidedBy: 'Awaiting approval',
});

const formatClaimedPunch = (timestamp: string | null) =>
  timestamp
    ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' }).format(
        new Date(timestamp)
      )
    : null;

const mapRegularizationRequest = (request: RegularizationRequest): RequestRecord => {
  const claimedIn = formatClaimedPunch(request.claimed_in);
  const claimedOut = formatClaimedPunch(request.claimed_out);
  const claimSummary = [
    claimedIn ? `IN: ${claimedIn}` : null,
    claimedOut ? `OUT: ${claimedOut}` : null,
  ].filter(Boolean).join(' · ');

  return {
    id: `#RR-${request.id}`,
    rawId: request.id,
    type: 'REGULARIZE',
    appliedOn: formatAppliedDate(request.created_at),
    targetDate: formatRequestDate(request.work_date),
    targetSub: `${request.type.replaceAll('_', ' ')}${claimSummary ? ` · ${claimSummary}` : ''}`,
    details: request.reason,
    categoryTag: `${request.type.replaceAll('_', ' ')} regularization`,
    ledgerImpact: claimSummary || 'Punch correction',
    ledgerImpactType: 'badge',
    status: normalizeStatus(request.status),
    decidedBy: request.decided_by ? `Reviewer ${request.decided_by}` : 'Awaiting approval',
    decisionNote: request.decision_note || undefined,
  };
};

/* ------------------------------------------------------------------ */
/*  PRESENTATION HELPERS (styling only — no business logic)           */
/*  Mirrors the Earthy Warm look used on the Attendance page          */
/* ------------------------------------------------------------------ */

const REQUEST_TABS = [
  { id: 'ALL', label: 'All Requests' },
  { id: 'LEAVE', label: 'Leave Requests' },
  { id: 'PERMISSION', label: 'Permissions' },
  { id: 'REGULARIZE', label: 'Regularizations' },
] as const;

const STATUS_FILTERS = ['All', 'Pending', 'Approved', 'Cancelled', 'Rejected'];

const REQUEST_TYPES: RequestCategory[] = ['LEAVE', 'PERMISSION', 'REGULARIZE'];

// Display-only month label ("November 2026"). Guarded so a malformed value never throws while rendering.
const getMonthLabel = (monthValue: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthValue)) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthValue}-01T00:00:00Z`));
};

// "PENDING" -> "Pending"
const getStatusLabel = (status: RequestStatus) =>
  status.charAt(0) + status.slice(1).toLowerCase();

const primaryBtn =
  'flex items-center gap-2 rounded-2xl bg-[#C87961] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C87961]';

const secondaryBtn =
  'flex items-center gap-2 rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] px-5 py-3 text-sm font-bold text-[#46513F] shadow-xs transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953]';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953]';

type IconProps = { className?: string };

function CalendarIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function FingerprintIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0a8.003 8.003 0 0115.357-2m1.571 2.493a12.018 12.018 0 01-1.571 5.507"
      />
    </svg>
  );
}

function ShieldCheckIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  );
}

function LockIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function RefreshIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function ClipboardCheckIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

function InboxIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
      />
    </svg>
  );
}

function CheckCircleIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AlertCircleIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

interface RequestTheme {
  title: string;
  legend: string;
  icon: React.ComponentType<IconProps>;
  tile: string;
  stripe: string;
  hoverBorder: string;
  panel: string;
  label: string;
  impact: string;
}

// One colour family per request type (olive / sand / terracotta) — same palette as the metric cards.
const REQUEST_THEME: Record<RequestCategory, RequestTheme> = {
  LEAVE: {
    title: 'Leave Request',
    legend: 'Leave',
    icon: CalendarIcon,
    tile: 'bg-[#5D6953]',
    stripe: 'bg-[#5D6953]',
    hoverBorder: 'hover:border-[#707C65]/50',
    panel: 'border-[#E5ECE0] bg-[#F6F8F3]',
    label: 'text-[#5D6953]',
    impact: 'bg-[#5D6953] text-white',
  },
  PERMISSION: {
    title: 'Permission Request',
    legend: 'Permission',
    icon: ClockIcon,
    tile: 'bg-[#9B6A38]',
    stripe: 'bg-[#9B6A38]',
    hoverBorder: 'hover:border-[#9B6A38]/40',
    panel: 'border-[#F2E7D3] bg-[#FDF9F0]',
    label: 'text-[#9B6A38]',
    impact: 'bg-[#9B6A38] text-white',
  },
  REGULARIZE: {
    title: 'Regularization Request',
    legend: 'Regularization',
    icon: FingerprintIcon,
    tile: 'bg-[#C85D44]',
    stripe: 'bg-[#C85D44]',
    hoverBorder: 'hover:border-[#C85D44]/40',
    panel: 'border-[#F7DDD4] bg-[#FDF2EE]',
    label: 'text-[#C85D44]',
    impact: 'bg-[#C85D44] text-white',
  },
};

const STATUS_STYLES: Record<RequestStatus, { badge: string; dot: string }> = {
  PENDING: { badge: 'border-[#EDD7BE] bg-[#FDF8F0] text-[#9B6A38]', dot: 'bg-[#9B6A38]' },
  APPROVED: { badge: 'border-[#D9E2D2] bg-[#F6F8F3] text-[#5D6953]', dot: 'bg-[#5D6953]' },
  REJECTED: { badge: 'border-[#F4C8B9] bg-[#FEF1EC] text-[#C85D44]', dot: 'bg-[#C85D44]' },
  CANCELLED: { badge: 'border-[#E8E1D5] bg-[#F7F3EB] text-stone-500', dot: 'bg-stone-400' },
  UNKNOWN: { badge: 'border-[#E8E1D5] bg-[#F7F3EB] text-stone-500', dot: 'bg-stone-400' },
};

function StatusBadge({ status }: { status: RequestStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-bold tracking-wide ${style.badge}`}
    >
      <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
      {getStatusLabel(status)}
    </span>
  );
}

// Solid icon tile — plays the same role as the calendar DateBadge on the Attendance page
function TypeTile({ type }: { type: RequestCategory }) {
  const theme = REQUEST_THEME[type];
  const Icon = theme.icon;
  return (
    <div
      aria-hidden="true"
      className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ring-1 ring-black/5 ${theme.tile}`}
    >
      <Icon className="h-6 w-6" />
    </div>
  );
}

export default function EmployeeRequestsPage() {
  const dispatch = useAppDispatch();
  const {
    cancelling: isCancellingRequest,
    permissionBalance,
    permissionBalanceLoading,
    leaveRequests,
    leaveRequestsLoading,
    leaveRequestsError,
    permissionRequests,
    permissionRequestsLoading,
    permissionRequestsError,
    regularizationRequests,
    regularizationRequestsLoading,
    regularizationRequestsError,
  } = useAppSelector((state) => state.requests);
  const [activeTab, setActiveTab] = useState<'ALL' | 'LEAVE' | 'PERMISSION' | 'REGULARIZE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [recentRequests, setRecentRequests] = useState<RequestRecord[]>([]);
  const [requestOverrides, setRequestOverrides] = useState<Record<string, RequestRecord>>({});
  const [cancelRequest, setCancelRequest] = useState<RequestRecord | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [requestFeedback, setRequestFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const requestsList = useMemo(() => {
    const apiRequests = [
      ...leaveRequests.map(mapLeaveRequest),
      ...permissionRequests.map(mapPermissionRequest),
      ...regularizationRequests.map(mapRegularizationRequest),
    ];
    const uniqueRequests = new Map<string, RequestRecord>();
    [...recentRequests, ...apiRequests].forEach((request) => {
      if (!uniqueRequests.has(request.id)) uniqueRequests.set(request.id, request);
    });

    return [...uniqueRequests.values()].map((request) => requestOverrides[request.id] ?? request);
  }, [leaveRequests, permissionRequests, recentRequests, regularizationRequests, requestOverrides]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new Date();
      setSelectedMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const [yearText, monthText] = selectedMonth.split('-');
    const month = Number(monthText);
    const year = Number(yearText);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) return;

    void dispatch(fetchMyLeaveRequests({ month, year }));
    void dispatch(fetchMyPermissionRequests({ month, year }));
    void dispatch(fetchMyRegularizationRequests({ month, year }));
  }, [dispatch, selectedMonth]);

  useEffect(() => {
    void dispatch(fetchMyPermissionBalance());
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('employee-requests');
    channel.onmessage = (event: MessageEvent<{
      type?: string;
      request?: RequestRecord;
      requestMonth?: string;
    }>) => {
      if (event.data?.type === 'employee.regularization.applied') {
        const requestMonth = event.data.requestMonth;
        if (requestMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestMonth)) {
          setActiveTab('ALL');
          setStatusFilter('All');
          if (requestMonth === selectedMonth) {
            const [yearText, monthText] = requestMonth.split('-');
            void dispatch(fetchMyRegularizationRequests({
              month: Number(monthText),
              year: Number(yearText),
            }));
          } else {
            setSelectedMonth(requestMonth);
          }
          setRequestFeedback({ type: 'success', message: 'Regularization request submitted successfully.' });
        }
        return;
      }
      const request = event.data?.request;
      if (
        (event.data?.type === 'employee.leave.applied' ||
          event.data?.type === 'employee.permission.applied') &&
        (request?.type === 'LEAVE' || request?.type === 'PERMISSION') &&
        typeof request.id === 'string' &&
        (typeof request.rawId === 'string' || typeof request.rawId === 'number')
      ) {
        setRecentRequests((current) => [request, ...current.filter((item) => item.id !== request.id)]);
        setActiveTab('ALL');
        setStatusFilter('All');
        const requestMonth = event.data.requestMonth;
        if (requestMonth && /^\d{4}-(0[1-9]|1[0-2])$/.test(requestMonth)) {
          if (requestMonth === selectedMonth) {
            const [yearText, monthText] = requestMonth.split('-');
            const filter = { month: Number(monthText), year: Number(yearText) };
            void dispatch(fetchMyLeaveRequests(filter));
            void dispatch(fetchMyPermissionRequests(filter));
            void dispatch(fetchMyRegularizationRequests(filter));
          } else {
            setSelectedMonth(requestMonth);
          }
        }
        if (request.type === 'PERMISSION') {
          void dispatch(fetchMyPermissionBalance());
        }
        setRequestFeedback({
          type: 'success',
          message: `${request.type === 'LEAVE' ? 'Leave' : 'Permission'} request submitted successfully.`,
        });
      }
    };

    return () => channel.close();
  }, [dispatch, selectedMonth]);

  const requestFetchError =
    leaveRequestsError || permissionRequestsError || regularizationRequestsError;
  const isLoadingRequests =
    leaveRequestsLoading || permissionRequestsLoading || regularizationRequestsLoading;

  // Cancellation Handler
  const handleCancelRequest = async (record: RequestRecord, reason = '') => {
    try {
      if (record.type === 'LEAVE') {
        const cancelledRequest = await dispatch(
          cancelMyLeaveRequest({ id: String(record.rawId) })
        ).unwrap();
        setRequestOverrides((current) => ({
          ...current,
          [record.id]: {
            ...record,
            status: 'CANCELLED',
            decisionNote: reason.trim()
              ? `Self-cancelled · ${reason.trim()}`
              : 'Cancelled successfully',
          },
        }));
        setRequestFeedback({
          type: 'success',
          message: `Leave request #LR-${cancelledRequest.id} cancelled successfully.`,
        });
        setCancelRequest(null);
        setCancelReason('');
        setCancelError(null);
        return;
      }

      if (record.type === 'PERMISSION') {
        const cancelledRequest = await dispatch(
          cancelMyPermissionRequest({ id: String(record.rawId) })
        ).unwrap();
        void dispatch(fetchMyPermissionBalance());
        setRequestOverrides((current) => ({
          ...current,
          [record.id]: {
            ...record,
            status: 'CANCELLED',
            decisionNote: reason.trim()
              ? `Self-cancelled · ${reason.trim()}`
              : 'Cancelled successfully',
          },
        }));
        setRequestFeedback({
          type: 'success',
          message: `Permission request #PR-${cancelledRequest.id} cancelled successfully.`,
        });
        setCancelRequest(null);
        setCancelReason('');
        setCancelError(null);
        return;
      }

    } catch (err) {
      console.error('Error cancelling request:', err);
      const message =
        typeof err === 'string'
          ? err
          : err instanceof Error
            ? err.message
            : 'Failed to cancel request. Please try again.';
      if (record.type === 'LEAVE') {
        setCancelError(message);
      } else if (record.type === 'PERMISSION') {
        setCancelError(message);
      } else {
        alert(message);
      }
    }
  };

  // Filter computation
  const filteredRequests = requestsList.filter((item) => {
    if (activeTab === 'LEAVE' && item.type !== 'LEAVE') return false;
    if (activeTab === 'PERMISSION' && item.type !== 'PERMISSION') return false;
    if (activeTab === 'REGULARIZE' && item.type !== 'REGULARIZE') return false;
    if (statusFilter !== 'All' && item.status !== statusFilter.toUpperCase()) return false;
    return true;
  });

  const getCategoryCount = (cat: 'ALL' | 'LEAVE' | 'PERMISSION' | 'REGULARIZE') => {
    if (cat === 'ALL') return requestsList.length;
    return requestsList.filter((r) => r.type === cat).length;
  };

  // Display-only
  const selectedMonthLabel = getMonthLabel(selectedMonth);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white p-3 sm:p-5 md:p-7 lg:p-9">

      {/* ========================================================
          1. ORGANIC ABSTRACT CANVAS ARTWORK BACKDROP
          ======================================================== */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      >
        <svg
          className="h-full w-full object-cover opacity-90"
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M -120 -80 C 180 -120, 380 60, 400 300 C 420 540, 190 640, -60 680 Z"
            fill="#848F76"
          />
          <path
            d="M 1320 -150 C 1460 60, 1620 250, 2000 210 L 2000 -150 Z"
            fill="#E3BF96"
          />
          <path
            d="M 1260 1150 C 1420 840, 1660 700, 2040 680 L 2040 1150 Z"
            fill="#C85D44"
          />
          <path
            d="M 2000 300 C 1720 370, 1640 560, 1830 750 C 1910 830, 2000 870, 2000 870 Z"
            fill="#D9B288"
          />
          <path
            d="M -60 500 C 320 410, 760 630, 1120 430 C 1470 230, 1740 330, 2040 190"
            stroke="#707C65"
            strokeWidth="1.5"
            strokeOpacity="0.35"
            fill="none"
          />
          <path
            d="M 260 -60 C 440 330, 310 800, 720 970 C 1130 1140, 1600 900, 1980 1140"
            stroke="#C85D44"
            strokeWidth="1.5"
            strokeOpacity="0.25"
            fill="none"
          />
        </svg>
      </div>

      {/* ========================================================
          2. MAIN ELEVATED DASHBOARD CONTAINER BOARD
          ======================================================== */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] sm:rounded-[42px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:p-6 lg:p-8">

        {/* Top App Bar Navigation */}
        <TopNav active="request" />

        {/* ========================================================
            HEADER BAR: Title & 3 Action Buttons
            ======================================================== */}
        <div className="mt-2 flex flex-col justify-between gap-4 border-b border-[#ECE3D3] pb-4 lg:flex-row lg:items-center">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">
              WORKFLOW &amp; APPROVALS
            </span>
            <h1 className="mt-0.5 text-3xl font-black text-stone-900 sm:text-4xl">
              Requests Hub &amp; Applications
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-base">
              Submit and manage Leave requests, Short Permissions, and Attendance Punch Regularizations with automated calendar auditing.
            </p>
          </div>

          {/* 3 Action Triggers */}
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/requests/apply-leave"
              target="_blank"
              rel="noopener noreferrer"
              className={primaryBtn}
            >
              <CalendarIcon className="h-4 w-4" />
              <span>Apply Leave</span>
            </a>

            <a
              href="/requests/apply-permission"
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryBtn}
            >
              <ClockIcon className="h-4 w-4 text-[#707C65]" />
              <span>Request Permission</span>
            </a>

            <Link
              href="/requests/apply-regularization"
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryBtn}
            >
              <FingerprintIcon className="h-4 w-4 text-[#707C65]" />
              <span>Regularize Punch</span>
            </Link>
          </div>
        </div>

        {/* ========================================================
            4 METRIC SUMMARY CARDS (EARTHY WARM GRADIENTS)
            ======================================================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Card 1: Leave Ledger / Balance (Olive Deep) */}
          <div className="flex min-h-44 flex-col justify-between rounded-2xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-black uppercase leading-tight tracking-wider text-[#E8EEDF]">
                LEAVE LEDGER / BALANCE
              </span>
              <CalendarIcon className="h-5 w-5 shrink-0 text-white/80" />
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-[#D8DEC7]">Annual Balance</p>
              <p className="mt-0.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-white">12</span>
                <span className="text-sm font-bold text-[#D8DEC7]">Days Avail.</span>
              </p>
            </div>

            <div className="mt-4 border-t border-white/15 pt-3">
              <div className="flex flex-wrap justify-between gap-x-2 text-xs font-semibold text-[#D8DEC7]">
                <span>Monthly Cap: 2 Days</span>
                <span className="font-bold text-white">1 Day Remaining</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#E3BF96]" style={{ width: '50%' }} />
              </div>
            </div>
          </div>

          {/* Card 2: Short Permission (Warm Sand) */}
          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#E8D4B9] bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-lg border border-[#EDD7BE] bg-white px-3 py-1.5 text-xs font-black uppercase leading-tight tracking-wider text-[#815526]">
                SHORT PERMISSION
              </span>
              <ClockIcon className="h-5 w-5 shrink-0 text-[#9B6A38]" />
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-600">Monthly Allowance</p>
              <p className="mt-0.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-stone-900">
                  {permissionBalanceLoading ? '…' : permissionBalance?.remaining_minutes ?? '—'}
                </span>
                <span className="text-sm font-bold text-[#9B6A38]">Mins Left</span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EDD7BE] bg-white px-3.5 py-2 text-xs text-stone-700">
              <span className="font-bold text-stone-800">
                Quota: {permissionBalance?.monthly_limit ?? '—'} Mins / Mo
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#9B6A38]">
                {permissionBalance ? `${permissionBalance.remaining_minutes}m left` : 'Balance'}
              </span>
            </div>
          </div>

          {/* Card 3: Biometric Regularizations (Terracotta) */}
          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#F3C9BB] bg-gradient-to-br from-[#FFF8F5] to-[#FCE5DC] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-lg border border-[#F4C8B9] bg-white px-3 py-1.5 text-xs font-black uppercase leading-tight tracking-wider text-[#B24832]">
                BIOMETRIC LOG
              </span>
              <FingerprintIcon className="h-5 w-5 shrink-0 text-[#C85D44]" />
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-600">Regularizations</p>
              <p className="mt-0.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#B24832]">02</span>
                <span className="text-sm font-bold text-[#C85D44]/80">Open Logs</span>
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F4C8B9] bg-white px-3.5 py-2 text-xs text-stone-700">
              <span className="font-bold text-[#B24832]">Manager Review</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-[#C85D44]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#C85D44]" />
                Pending
              </span>
            </div>
          </div>

          {/* Card 4: Audit & Payroll Lock (Soft White / Olive) */}
          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#D9E2D2] bg-gradient-to-br from-white to-[#F0F5EB] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-lg border border-[#D9E2D2] bg-white px-3 py-1.5 text-xs font-black uppercase leading-tight tracking-wider text-[#46513F]">
                COMPLIANCE STATUS
              </span>
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-[#5D6953]" />
            </div>

            <div className="mt-4">
              <p className="text-sm font-semibold text-stone-600">Audit &amp; Payroll Lock</p>
              <p className="mt-0.5 flex items-baseline gap-2">
                <span className="text-3xl font-black text-stone-900">96%</span>
                <span className="text-sm font-bold text-[#5D6953]">Approval</span>
              </p>
              <p className="mt-1 text-xs font-medium text-stone-500">0 Rejected · 0 Policy Infractions</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F7F3EB] px-3.5 py-2 text-xs text-stone-700">
              <div className="flex items-center gap-1.5 text-stone-600">
                <LockIcon className="h-3.5 w-3.5 text-[#707C65]" />
                <span className="font-medium">Lock: Dec 01, 2026</span>
              </div>
              <span className="font-black text-[#5D6953]">Active Cycle</span>
            </div>
          </div>

        </div>

        {/* ========================================================
            FILTER CONTROLS: Type Tabs, Month, Status
            ======================================================== */}
        <div className="flex flex-col gap-4 rounded-2xl border border-[#E5DDCE] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Request Archetype Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-black uppercase tracking-wider text-[#5D6953]">
                Type:
              </span>
              {REQUEST_TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${focusRing} ${
                      active
                        ? 'bg-[#5D6953] text-white shadow-xs'
                        : 'border border-[#ECE3D3] bg-white text-stone-600 hover:border-[#707C65] hover:bg-[#F6F8F3]'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs font-black tabular-nums ${
                        active ? 'bg-white/20 text-white' : 'bg-[#F3EEE4] text-stone-600'
                      }`}
                    >
                      {getCategoryCount(tab.id)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Month Selector & Reset */}
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex items-center gap-2 rounded-xl border border-[#E5DDCE] bg-[#FCFAF7] px-3.5 py-2.5 text-sm text-stone-700">
                <CalendarIcon className="h-4 w-4 text-[#707C65]" />
                <span className="text-xs font-black uppercase tracking-wider text-[#5D6953]">
                  Month
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  aria-label="Filter requests by month"
                  className="w-[150px] bg-transparent font-bold text-stone-900 outline-none"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All');
                  setActiveTab('ALL');
                }}
                title="Reset Filters"
                className={`inline-flex items-center gap-2 rounded-xl border border-[#E5DDCE] bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-[#F6F8F3] hover:text-[#5D6953] ${focusRing}`}
              >
                <RefreshIcon className="h-4 w-4 text-[#707C65]" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 border-t border-[#ECE3D3] pt-4">
            <span className="mr-1 text-xs font-black uppercase tracking-wider text-[#5D6953]">
              Status:
            </span>
            {STATUS_FILTERS.map((option) => {
              const active = statusFilter === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setStatusFilter(option)}
                  aria-pressed={active}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${focusRing} ${
                    active
                      ? 'bg-[#C87961] text-white shadow-xs'
                      : 'border border-[#ECE3D3] bg-white text-stone-600 hover:border-[#707C65] hover:bg-[#F6F8F3]'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback Messages */}
        {requestFeedback && (
          <div
            role={requestFeedback.type === 'error' ? 'alert' : 'status'}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-5 py-4 text-sm font-bold ${
              requestFeedback.type === 'success'
                ? 'border-[#D9E2D2] bg-[#F6F8F3] text-[#5D6953]'
                : 'border-[#F3D7CB] bg-[#FAEEE5] text-[#C85D44]'
            }`}
          >
            <span className="flex items-center gap-2.5">
              {requestFeedback.type === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 shrink-0" />
              ) : (
                <AlertCircleIcon className="h-5 w-5 shrink-0" />
              )}
              <span>{requestFeedback.message}</span>
            </span>
            <button
              type="button"
              onClick={() => setRequestFeedback(null)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-black/5"
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          </div>
        )}

        {requestFetchError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] px-5 py-4 text-sm font-bold text-[#C85D44]"
          >
            <AlertCircleIcon className="h-5 w-5 shrink-0" />
            <span>{requestFetchError}</span>
          </div>
        )}

        {/* ========================================================
            REQUEST HISTORY (header bar + card grid + footer)
            ======================================================== */}
        <section
          aria-label="Request history"
          className="overflow-hidden rounded-3xl border border-[#E5DDCE] bg-[#FCFAF7] shadow-md"
        >
          {/* Section header bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DDCE] bg-gradient-to-r from-white to-[#FAF7F0] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm">
                <ClipboardCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-stone-900 sm:text-xl">Request history</h2>
                <p className="mt-0.5 text-sm text-stone-600">
                  Leave, permission and regularization requests for the selected period
                </p>
              </div>
            </div>

            <span className="rounded-xl border border-[#E5DDCE] bg-[#F7F3EB] px-4 py-2 text-sm font-bold text-[#46513F]">
              {selectedMonthLabel || 'Request period'}
            </span>
          </div>

          {/* Request cards */}
          <div className="grid grid-cols-1 items-stretch gap-4 p-4 sm:p-5 lg:grid-cols-2 2xl:grid-cols-3">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((row) => {
                const theme = REQUEST_THEME[row.type];

                return (
                  <article
                    key={row.id}
                    className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl border-2 border-[#ECE3D3] bg-white p-4 pt-5 shadow-sm transition hover:shadow-md sm:p-5 sm:pt-6 ${theme.hoverBorder}`}
                  >
                    {/* Type accent stripe */}
                    <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 ${theme.stripe}`} />

                    {/* Card header: type + status */}
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <TypeTile type={row.type} />
                        <p className="min-w-0 text-base font-black text-stone-900 sm:text-lg">{theme.title}</p>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>

                    {/* Request summary panel */}
                    <div className={`mt-4 rounded-xl border px-4 py-3.5 ${theme.panel}`}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-xs font-black uppercase tracking-wider ${theme.label}`}>
                            Request type
                          </p>
                          <p className="mt-1 break-words text-base font-black text-stone-900">
                            {row.categoryTag}
                          </p>
                        </div>
                        <span
                          className={`max-w-[200px] shrink-0 rounded-xl px-3.5 py-2 text-center text-sm font-black leading-tight shadow-xs ${theme.impact}`}
                        >
                          {row.ledgerImpact}
                        </span>
                      </div>

                      <div className="mt-3 flex items-start gap-3 border-t border-black/5 pt-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-white text-[#707C65] shadow-xs">
                          <CalendarIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="break-words text-base font-black text-stone-900">{row.targetDate}</p>
                          <p className="mt-0.5 break-words text-sm font-medium text-stone-600">{row.targetSub}</p>
                        </div>
                      </div>
                    </div>

                    {/* Reason + decision note */}
                    <div className="mt-4 flex-1">
                      <p className="text-xs font-black uppercase tracking-wider text-[#5D6953]">
                        Reason
                      </p>
                      <p className="mt-1.5 break-words border-l-2 border-[#707C65] pl-3 text-sm font-semibold leading-relaxed text-stone-800">
                        {row.details}
                      </p>

                      {row.decisionNote && (
                        <div className="mt-3 rounded-xl border border-[#E5DDCE] bg-[#F7F3EB] px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-wider text-[#5D6953]">
                            Decision
                          </p>
                          <p className="mt-1 break-words text-sm font-medium leading-relaxed text-stone-700">
                            {row.decidedBy} · {row.decisionNote}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer: applied date + action */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE3D3] pt-3.5">
                      <p className="text-sm font-medium text-stone-500">
                        Applied on <span className="font-semibold text-stone-700">{row.appliedOn}</span>
                      </p>

                      {row.status === 'PENDING' && row.type !== 'REGULARIZE' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelRequest(row);
                            setCancelReason('');
                            setCancelError(null);
                          }}
                          disabled={isCancellingRequest}
                          className="rounded-xl border border-[#F4C8B9] bg-white px-4 py-2 text-sm font-bold text-[#C85D44] shadow-xs transition hover:bg-[#FEF1EC] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C85D44]"
                        >
                          {isCancellingRequest && (row.type === 'LEAVE' || row.type === 'PERMISSION') ? 'Cancelling…' : 'Cancel request'}
                        </button>
                      ) : row.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-[#9B6A38]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#9B6A38]" aria-hidden="true" />
                          Awaiting review
                        </span>
                      ) : row.status === 'APPROVED' ? (
                        <button
                          type="button"
                          onClick={() => alert(`View receipt for ${row.id}`)}
                          className={`rounded-xl border border-[#D9E2D2] bg-[#F6F8F3] px-4 py-2 text-sm font-bold text-[#46513F] shadow-xs transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95 ${focusRing}`}
                        >
                          View receipt
                        </button>
                      ) : (
                        <span className="text-sm font-bold text-stone-400">Closed</span>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div
                role="status"
                className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#E5DDCE] bg-white px-4 py-14 text-center"
              >
                <span
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F3EB] text-[#707C65] ${
                    isLoadingRequests ? 'animate-pulse' : ''
                  }`}
                >
                  <InboxIcon className="h-7 w-7" />
                </span>
                <p className="text-sm font-bold text-stone-600">
                  {isLoadingRequests
                    ? 'Loading requests…'
                    : requestFetchError
                      ? 'Requests could not be loaded. Please try selecting the month again.'
                      : 'No requests found matching your selected filters.'}
                </p>
              </div>
            )}
          </div>

          {/* Request count footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DDCE] bg-[#FAF7F0] px-5 py-4 text-sm font-medium text-stone-600 sm:px-6">
            <span>
              Showing <strong className="text-stone-800">{filteredRequests.length}</strong> of{' '}
              <strong className="text-stone-800">{requestsList.length}</strong>{' '}
              {requestsList.length === 1 ? 'request' : 'requests'}
            </span>

            <div className="hidden items-center gap-4 text-xs font-bold text-stone-500 sm:flex" aria-hidden="true">
              {REQUEST_TYPES.map((type) => (
                <span key={type} className="inline-flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${REQUEST_THEME[type].tile}`} />
                  {REQUEST_THEME[type].legend}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Cancellation Portal Dialog */}
        {(cancelRequest?.type === 'LEAVE' || cancelRequest?.type === 'PERMISSION') && typeof document !== 'undefined' && createPortal((
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isCancellingRequest) {
                setCancelRequest(null);
                setCancelError(null);
              }
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="cancel-leave-title"
              className="w-full max-w-lg rounded-3xl border border-[#ECE3D3] bg-[#FCFAF7] p-6 shadow-2xl sm:p-7"
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#ECE3D3] pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#C85D44]">
                    CANCELLATION
                  </span>
                  <h2 id="cancel-leave-title" className="text-xl font-black text-stone-900">
                    Cancel {cancelRequest.type === 'LEAVE' ? 'leave' : 'permission'} request
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Tell us why you are withdrawing this request.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCancelRequest(null);
                    setCancelError(null);
                  }}
                  disabled={isCancellingRequest}
                  aria-label="Close cancellation dialog"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-[#EFE9DF] hover:text-stone-800 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              {/* Which request is being cancelled */}
              <div
                className={`mt-5 flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 ${REQUEST_THEME[cancelRequest.type].panel}`}
              >
                <TypeTile type={cancelRequest.type} />
                <div className="min-w-0">
                  <p className="text-sm font-black text-stone-900">{cancelRequest.categoryTag}</p>
                  <p className="mt-0.5 break-words text-sm font-semibold text-stone-700">
                    {cancelRequest.targetDate}
                  </p>
                  <p className="break-words text-xs font-medium text-stone-500">{cancelRequest.targetSub}</p>
                </div>
              </div>

              <form
                className="mt-5 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (cancelRequest.type === 'LEAVE' || cancelRequest.type === 'PERMISSION') {
                    void handleCancelRequest(cancelRequest, cancelReason);
                  }
                }}
              >
                <label className="block text-sm font-bold text-stone-700">
                  Reason for cancellation <span className="text-[#C85D44]">*</span>
                  <textarea
                    required
                    autoFocus
                    rows={4}
                    maxLength={500}
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    placeholder={`Please explain why you are cancelling this ${cancelRequest.type.toLowerCase()} request`}
                    className="mt-1.5 block w-full resize-y rounded-2xl border border-[#E5DDCE] bg-white p-3.5 text-sm font-medium text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#5D6953] focus:ring-2 focus:ring-[#5D6953]/20"
                  />
                  <span className="mt-1.5 block text-right text-xs font-medium tabular-nums text-stone-400">
                    {cancelReason.length}/500
                  </span>
                </label>

                {cancelError && (
                  <p role="alert" className="flex items-center gap-2 rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] p-3.5 text-sm font-bold text-[#C85D44]">
                    <AlertCircleIcon className="h-5 w-5 shrink-0" />
                    <span>{cancelError}</span>
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2.5 border-t border-[#ECE3D3] pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCancelRequest(null);
                      setCancelError(null);
                    }}
                    disabled={isCancellingRequest}
                    className="rounded-xl border border-[#E5DDCE] bg-white px-5 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-[#F6F8F3] disabled:opacity-50"
                  >
                    Keep request
                  </button>
                  <button
                    type="submit"
                    disabled={isCancellingRequest || !cancelReason.trim()}
                    className="rounded-xl bg-[#C87961] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCancellingRequest ? 'Cancelling…' : 'Submit cancellation'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        ), document.body)}

      </main>

    </div>
  );
}
