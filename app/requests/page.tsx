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
            <span className="text-[10px] font-black uppercase tracking-widest text-[#707C65]">
              WORKFLOW &amp; APPROVALS
            </span>
            <h1 className="mt-0.5 text-2xl font-black text-stone-900 sm:text-3xl">
              Requests Hub &amp; Applications
            </h1>
            <p className="text-xs text-stone-500 sm:text-sm">
              Submit and manage Leave requests, Short Permissions, and Attendance Punch Regularizations with automated calendar auditing.
            </p>
          </div>

          {/* 3 Action Triggers */}
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="/requests/apply-leave"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl bg-[#5D6953] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#4D5844] active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>+ Apply Leave</span>
            </a>

            <a
              href="/requests/apply-permission"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-[#ECE3D3] bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-xs transition hover:border-[#5D6953] hover:text-[#5D6953] active:scale-95"
            >
              <svg className="h-4 w-4 text-[#707C65]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>+ Request Permission</span>
            </a>

            <Link
              href="/requests/apply-regularization"
              className="flex items-center gap-2 rounded-2xl border border-[#ECE3D3] bg-white px-4 py-2.5 text-xs font-bold text-stone-700 shadow-xs transition hover:border-[#5D6953] hover:text-[#5D6953] active:scale-95"
            >
              <svg className="h-4 w-4 text-[#707C65]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0a8.003 8.003 0 0115.357-2m1.571 2.493a12.018 12.018 0 01-1.571 5.507" />
              </svg>
              <span>+ Regularize Punch</span>
            </Link>
          </div>
        </div>

        {/* ========================================================
            4 METRIC SUMMARY CARDS (HARMONIZED EARTHY WARM THEME)
            ======================================================== */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Leave Ledger / Balance (Olive Deep Brand) */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#5D6953] p-5 text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-white/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#DCE4D5]">
                LEAVE LEDGER / BALANCE
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold text-[#D8DEC7]">Annual Balance</p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-white">12</span>
                <span className="text-xs font-bold text-[#D8DEC7]">Days Avail.</span>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/15">
              <div className="flex flex-wrap justify-between gap-x-2 text-[11px] font-semibold text-[#D8DEC7]">
                <span>Monthly Cap: 2 Days</span>
                <span className="font-bold text-white">1 Day Remaining</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-[#E3BF96]" style={{ width: '50%' }} />
              </div>
            </div>
          </div>

          {/* Card 2: Short Permission (Warm Sand Card) */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#F0E3D2] bg-[#FDF8F0] p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#EDD7BE] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#9B6A38]">
                SHORT PERMISSION
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#EDD7BE] bg-white text-[#9B6A38]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold text-stone-500">Monthly Allowance</p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-stone-900">
                  {permissionBalanceLoading ? '…' : permissionBalance?.remaining_minutes ?? '—'}
                </span>
                <span className="text-xs font-bold text-[#9B6A38]">Mins Left</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EDD7BE] bg-white px-3 py-1.5 text-xs text-stone-700">
              <span className="font-bold text-stone-800">
                Quota: {permissionBalance?.monthly_limit ?? '—'} Mins / Mo
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-[#9B6A38]">
                {permissionBalance ? `${permissionBalance.remaining_minutes}m left` : 'Balance'}
              </span>
            </div>
          </div>

          {/* Card 3: Biometric Regularizations (Terracotta Accent Card) */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#F8D9CE] bg-[#FEF1EC] p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#F4C8B9] bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#C85D44]">
                BIOMETRIC LOG
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#F4C8B9] bg-white text-[#C85D44]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0a8.003 8.003 0 0115.357-2m1.571 2.493a12.018 12.018 0 01-1.571 5.507" />
                </svg>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold text-[#C85D44]">Regularizations</p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-[#C85D44]">02</span>
                <span className="text-xs font-bold text-[#C85D44]/80">Open Logs</span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#F4C8B9] bg-white px-3 py-1.5 text-xs text-stone-700">
              <span className="font-bold text-[#C85D44]">Manager Review</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#C85D44]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C85D44] animate-pulse" />
                Pending
              </span>
            </div>
          </div>

          {/* Card 4: Audit & Payroll Lock (Crisp White Card with Olive Tone) */}
          <div className="flex flex-col justify-between rounded-2xl border border-[#EBE4D6] bg-white p-5 shadow-xs transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#E2E9DC] bg-[#F6F9F3] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#5D6953]">
                COMPLIANCE STATUS
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E9DC] bg-[#F6F9F3] text-[#5D6953]">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs font-semibold text-stone-500">Audit &amp; Payroll Lock</p>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-stone-900">96%</span>
                <span className="text-xs font-bold text-[#5D6953]">Approval</span>
              </div>
              <p className="mt-0.5 text-[11px] font-medium text-stone-500">0 Rejected · 0 Policy Infractions</p>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F7F3EB] px-3 py-1.5 text-xs text-stone-700">
              <div className="flex items-center gap-1.5 text-stone-600">
                <svg className="h-3.5 w-3.5 text-[#707C65]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span className="text-[11px] font-medium">Lock: Dec 01, 2026</span>
              </div>
              <span className="text-[11px] font-black text-[#5D6953]">Active Cycle</span>
            </div>
          </div>

        </div>

        {/* ========================================================
            FILTER CONTROLS BAR: Category Tabs & Selectors
            ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ECE3D3] bg-white p-3 shadow-xs">
          
          {/* Request Archetype Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'ALL'
                  ? 'bg-[#5D6953] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#F6F8F3] hover:text-[#5D6953]'
              }`}
            >
              All Requests ({getCategoryCount('ALL')})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LEAVE')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'LEAVE'
                  ? 'bg-[#5D6953] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#F6F8F3] hover:text-[#5D6953]'
              }`}
            >
              Leave Requests ({getCategoryCount('LEAVE')})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('PERMISSION')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'PERMISSION'
                  ? 'bg-[#5D6953] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#F6F8F3] hover:text-[#5D6953]'
              }`}
            >
              Permissions ({getCategoryCount('PERMISSION')})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('REGULARIZE')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'REGULARIZE'
                  ? 'bg-[#5D6953] text-white shadow-xs'
                  : 'text-stone-600 hover:bg-[#F6F8F3] hover:text-[#5D6953]'
              }`}
            >
              Regularizations ({getCategoryCount('REGULARIZE')})
            </button>
          </div>

          {/* Month & Status Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Selector */}
            <div className="flex items-center gap-2 rounded-xl border border-[#ECE3D3] bg-[#FCFAF7] px-3 py-1.5 text-xs font-bold text-stone-700">
              <svg className="h-3.5 w-3.5 text-[#707C65]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                aria-label="Filter requests by month"
                className="w-[130px] bg-transparent font-bold text-stone-900 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#ECE3D3] bg-[#FCFAF7] px-3 py-1.5 text-xs font-bold text-stone-700">
              <span className="text-[10px] uppercase tracking-wider text-[#707C65]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-900 focus:outline-none"
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatusFilter('All');
                setActiveTab('ALL');
              }}
              title="Reset Filters"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#ECE3D3] bg-white text-stone-500 shadow-xs transition hover:bg-[#F6F8F3] hover:text-[#5D6953]"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {requestFeedback && (
          <div
            role={requestFeedback.type === 'error' ? 'alert' : 'status'}
            className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-bold ${
              requestFeedback.type === 'success'
                ? 'border-[#D9E2D2] bg-[#F6F8F3] text-[#5D6953]'
                : 'border-[#F3D7CB] bg-[#FAEEE5] text-[#C85D44]'
            }`}
          >
            <span>{requestFeedback.message}</span>
            <button
              type="button"
              onClick={() => setRequestFeedback(null)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold hover:bg-black/5"
              aria-label="Dismiss message"
            >
              Dismiss
            </button>
          </div>
        )}

        {requestFetchError && (
          <div role="alert" className="rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] px-4 py-3 text-xs font-bold text-[#C85D44]">
            {requestFetchError}
          </div>
        )}

        {/* ========================================================
            REQUEST CARDS GRID
            ======================================================== */}
        <div className="mt-1">
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((row) => (
                <article
                  key={row.id}
                  className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#ECE3D3] border-t-4 bg-white p-5 shadow-xs transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
                    row.type === 'LEAVE'
                      ? 'border-t-[#5D6953]'
                      : row.type === 'PERMISSION'
                        ? 'border-t-[#9B6A38]'
                        : 'border-t-[#C85D44]'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow-xs ${
                        row.type === 'LEAVE'
                          ? 'bg-[#F6F8F3] text-[#5D6953] ring-1 ring-[#5D6953]/20'
                          : row.type === 'PERMISSION'
                            ? 'bg-[#FDF8F0] text-[#9B6A38] ring-1 ring-[#9B6A38]/20'
                            : 'bg-[#FEF1EC] text-[#C85D44] ring-1 ring-[#C85D44]/20'
                      }`}>
                        {row.type === 'LEAVE' ? 'L' : row.type === 'PERMISSION' ? 'P' : 'R'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-base font-black text-stone-900">
                          {row.type === 'LEAVE' ? 'Leave Request' : row.type === 'PERMISSION' ? 'Permission Request' : 'Regularization Request'}
                        </p>
                        <p className="text-xs text-stone-400 font-medium">{row.id}</p>
                      </div>
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                        row.type === 'LEAVE'
                          ? 'bg-[#F6F8F3] text-[#5D6953]'
                          : row.type === 'PERMISSION'
                            ? 'bg-[#FDF8F0] text-[#9B6A38]'
                            : 'bg-[#FEF1EC] text-[#C85D44]'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          row.type === 'LEAVE' ? 'bg-[#5D6953]' : row.type === 'PERMISSION' ? 'bg-[#9B6A38]' : 'bg-[#C85D44]'
                        }`} />
                        {row.type === 'REGULARIZE' ? 'REGULARIZATION' : row.type}
                    </span>
                  </div>

                  <div className={`mt-4 rounded-xl border p-3.5 ${
                    row.type === 'LEAVE'
                      ? 'border-[#E5ECE0] bg-[#F6F8F3]'
                      : row.type === 'PERMISSION'
                        ? 'border-[#F2E7D3] bg-[#FDF9F0]'
                        : 'border-[#F7DDD4] bg-[#FDF2EE]'
                  }`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#707C65]">Request type</p>
                        <p className="mt-1 break-words text-sm font-black text-stone-900">
                          {row.categoryTag}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-full bg-[#5D6953] px-3 py-1 text-center text-xs font-black text-white shadow-xs">
                        <p className="max-w-[140px] leading-tight">
                          {row.ledgerImpact}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-black/5 pt-2.5">
                      <div className="flex items-start gap-2 text-xs">
                        <span className="mt-0.5 shrink-0 text-[#707C65]">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                        </span>
                        <div className="min-w-0">
                          <p className="break-words font-black text-stone-800">{row.targetDate}</p>
                          <p className="mt-0.5 text-xs text-stone-600 font-medium">{row.targetSub}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#707C65]">
                      Reason
                    </p>
                    <p className="mt-1 break-words border-l-2 border-[#707C65] pl-3 text-xs font-bold leading-relaxed text-stone-800">
                      {row.details}
                    </p>
                    <p className="mt-3 text-[11px] font-medium text-stone-400">
                      Applied on <span className="font-semibold text-stone-600">{row.appliedOn}</span>
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#ECE3D3] pt-3.5">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide ${
                        row.status === 'PENDING'
                          ? 'border-[#EDD7BE] bg-[#FDF8F0] text-[#9B6A38]'
                          : row.status === 'APPROVED'
                            ? 'border-[#D9E2D2] bg-[#F6F8F3] text-[#5D6953]'
                            : 'border-[#ECE3D3] bg-stone-100 text-stone-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          row.status === 'PENDING' ? 'bg-[#9B6A38]' : row.status === 'APPROVED' ? 'bg-[#5D6953]' : 'bg-stone-400'
                        }`} />
                        {row.status}
                      </span>
                      {row.decisionNote && (
                        <p className="mt-1 max-w-[220px] break-words text-[11px] leading-relaxed text-stone-500">
                          {row.decidedBy} · {row.decisionNote}
                        </p>
                      )}
                    </div>
                    {row.status === 'PENDING' && row.type !== 'REGULARIZE' ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCancelRequest(row);
                          setCancelReason('');
                          setCancelError(null);
                        }}
                        disabled={isCancellingRequest}
                        className="rounded-xl border border-[#F3D7CB] bg-white px-3.5 py-1.5 text-xs font-bold text-[#C85D44] shadow-xs transition hover:bg-[#FAEEE5] focus-visible:outline-2 focus-visible:outline-[#C85D44]"
                      >
                        {isCancellingRequest && (row.type === 'LEAVE' || row.type === 'PERMISSION') ? 'Cancelling…' : 'Cancel request'}
                      </button>
                    ) : row.status === 'PENDING' ? (
                      <span className="text-xs font-bold text-stone-400">Awaiting review</span>
                    ) : row.status === 'APPROVED' ? (
                      <button
                        type="button"
                        onClick={() => alert(`View receipt for ${row.id}`)}
                        className="rounded-xl border border-[#ECE3D3] bg-[#F7F3EB] px-3.5 py-1.5 text-xs font-bold text-[#5D6953] transition hover:bg-[#5D6953] hover:text-white"
                      >
                        View receipt
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-stone-400">Closed</span>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <p className="col-span-full rounded-2xl bg-white px-4 py-12 text-center text-xs font-bold text-stone-500 shadow-xs border border-[#ECE3D3]">
                {isLoadingRequests
                  ? 'Loading requests…'
                  : requestFetchError
                    ? 'Requests could not be loaded. Please try selecting the month again.'
                    : 'No requests found matching your selected filters.'}
              </p>
            )}
          </div>

          {/* Request count */}
          <div className="mt-3 text-xs font-bold text-stone-500">
            Showing <strong className="text-stone-800">{filteredRequests.length}</strong> {filteredRequests.length === 1 ? 'request' : 'requests'}
          </div>
        </div>

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
              <span className="inline-flex rounded-full bg-[#FEF1EC] border border-[#F4C8B9] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#C85D44]">
                Cancel {cancelRequest.type === 'LEAVE' ? 'leave' : 'permission'} request
              </span>
              <form
                className="mt-4 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (cancelRequest.type === 'LEAVE' || cancelRequest.type === 'PERMISSION') {
                    void handleCancelRequest(cancelRequest, cancelReason);
                  }
                }}
              >
                <label className="block text-xs font-bold text-stone-700">
                  Reason for cancellation <span className="text-[#C85D44]">*</span>
                  <textarea
                    required
                    autoFocus
                    rows={4}
                    maxLength={500}
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    placeholder={`Please explain why you are cancelling this ${cancelRequest.type.toLowerCase()} request`}
                    className="mt-1.5 block w-full resize-y rounded-2xl border border-[#ECE3D3] bg-white p-3 text-xs text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#5D6953] focus:ring-2 focus:ring-[#5D6953]/20"
                  />
                </label>

                {cancelError && (
                  <p role="alert" className="rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] p-3 text-xs font-bold text-[#C85D44]">
                    {cancelError}
                  </p>
                )}

                <div className="flex flex-col-reverse gap-2 border-t border-[#ECE3D3] pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setCancelRequest(null);
                      setCancelError(null);
                    }}
                    disabled={isCancellingRequest}
                    className="rounded-xl border border-[#ECE3D3] bg-white px-4 py-2 text-xs font-bold text-stone-600 transition hover:bg-[#F6F8F3] disabled:opacity-50"
                  >
                    Keep request
                  </button>
                  <button
                    type="submit"
                    disabled={isCancellingRequest || !cancelReason.trim()}
                    className="rounded-xl bg-[#C85D44] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#b04f38] disabled:cursor-not-allowed disabled:opacity-60"
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