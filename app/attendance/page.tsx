'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import TopNav, { NavId } from '../components/topNavBar';
import {
  fetchMyAttendanceDay,
  fetchMyAttendanceMonth,
} from '../store/attendance/attendanceSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

/* ------------------------------------------------------------------ */
/*  Helpers (unchanged logic)                                         */
/* ------------------------------------------------------------------ */

const getDateInIndia = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
};

const getDayName = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
  }).format(new Date(`${date}T12:00:00Z`));

const formatTime = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(new Date(date))
    : '-';

const getStatusLabel = (status: string | null) =>
  status ? status.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '-';

const formatMinutes = (minutes: number) =>
  `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const getMonthLabel = (monthValue: string) => {
  if (!monthValue) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthValue}-01T00:00:00Z`));
};

/* ------------------------------------------------------------------ */
/*  Small presentational pieces (restyled to Earthy Warm)              */
/* ------------------------------------------------------------------ */

function StatusBadge({ label }: { label: string }) {
  const ok = label === 'Present';
  const isDash = label === '-';
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-bold tracking-wide ${
        isDash
          ? 'border-[#E8E1D5] bg-[#F7F3EB] text-stone-500'
          : ok
          ? 'border-[#D9E2D2] bg-[#F6F8F3] text-[#5D6953]'
          : 'border-[#F4C8B9] bg-[#FEF1EC] text-[#C85D44]'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isDash ? 'bg-stone-400' : ok ? 'bg-[#5D6953]' : 'bg-[#C85D44]'
        }`}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}

function FlagChips({ remarks }: { remarks: string }) {
  if (remarks === '-') return <span className="text-stone-400">-</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {remarks.split(', ').map((flag) => {
        const isLate = flag.toLowerCase().includes('late');
        return (
          <span
            key={flag}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[13px] font-bold ring-1 ring-inset ${
              isLate
                ? 'bg-[#FEF1EC] text-[#C85D44] ring-[#F4C8B9]'
                : 'bg-[#FDF8F0] text-[#9B6A38] ring-[#EDD7BE]'
            }`}
          >
            {flag}
          </span>
        );
      })}
    </div>
  );
}

// "IN  09:02 AM" / "OUT  06:10 PM" line
function PunchTime({ kind, value }: { kind: 'IN' | 'OUT'; value: string }) {
  const isIn = kind === 'IN';
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={`w-[48px] rounded-md py-1 text-center text-xs font-black tracking-wider uppercase ${
          isIn
            ? 'bg-[#EAF0E6] text-[#5D6953] border border-[#D6E2CF]'
            : 'bg-[#FDF3E7] text-[#9B6A38] border border-[#F0DCBE]'
        }`}
      >
        {kind}
      </span>
      <span className="whitespace-nowrap text-[16px] font-bold tabular-nums text-stone-900">
        {value}
      </span>
    </div>
  );
}

// Calendar-style date badge
function DateBadge({ date, day }: { date: string; day: string }) {
  return (
    <div className="flex items-center gap-3.5" aria-label={`${day}, ${date}`}>
      <div className="flex h-[56px] w-[56px] shrink-0 flex-col items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm ring-1 ring-black/5">
        <span className="text-[20px] font-black leading-none tabular-nums">
          {date.slice(8, 10)}
        </span>
        <span className="mt-1 text-[11px] font-extrabold uppercase leading-none tracking-widest text-[#D8DEC7]">
          {day.slice(0, 3)}
        </span>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-base font-bold tabular-nums text-stone-900">
          {getMonthLabel(date.slice(0, 7))}
        </span>
        <span className="text-sm font-medium text-stone-600">
          {day}
        </span>
      </div>
    </div>
  );
}

const actionBtn =
  'rounded-xl border border-[#C87961] bg-[#C87961] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:border-[#B86A54] hover:bg-[#B86A54] active:scale-95';

interface DurationDetails {
  date: string;
  work: string;
  breakTime: string;
  permission: string;
}

function DurationDialog({ details, onClose }: { details: DurationDetails; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="duration-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-[#ECE3D3] bg-[#FCFAF7] p-0 text-stone-800 shadow-[0_24px_64px_rgba(72,60,45,0.2)] backdrop:bg-stone-900/40"
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#707C65]">
              BREAKDOWN
            </span>
            <h2 id="duration-dialog-title" className="text-xl font-black text-stone-900">
              Duration breakdown
            </h2>
            <p className="mt-0.5 text-xs text-stone-500">{details.date}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close duration breakdown"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-[#EFE9DF] hover:text-stone-800 transition"
          >
            ✕
          </button>
        </div>
        <dl className="mt-5 divide-y divide-[#ECE3D3] rounded-2xl border border-[#ECE3D3] bg-white px-4">
          {[
            { label: 'Work', value: details.work, color: 'text-stone-900' },
            { label: 'Break', value: details.breakTime, color: 'text-[#9B6A38]' },
            { label: 'Permission', value: details.permission, color: 'text-[#707C65]' },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between gap-4 py-3.5 text-sm">
              <dt className="font-semibold text-stone-600">{item.label}</dt>
              <dd className={`font-black tabular-nums ${item.color}`}>{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#C87961] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Employee Attendance Page Component                            */
/* ------------------------------------------------------------------ */

export default function EmployeeAttendancePage() {
  const dispatch = useAppDispatch();
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const {
    monthData,
    dayData,
    monthLoading,
    dayLoading,
    monthError,
    dayError,
  } = useAppSelector((state) => state.attendance);
  const [navTab, setNavTab] = useState<NavId>('attendance');
  const [filterStatus, setFilterStatus] = useState<string>('All Status');
  const [selectedDate, setSelectedDate] = useState('');
  const selectedMonth = selectedDate.slice(0, 7);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [durationDetails, setDurationDetails] = useState<DurationDetails | null>(null);

  const filterPills = ['All Status', 'Present', 'Late', 'Half Day', 'Needs Action'];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const today = getDateInIndia(new Date());
      setSelectedDate(today);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;
    const [year, month] = selectedMonth.split('-').map(Number);
    dispatch(fetchMyAttendanceMonth({ month, year }));
  }, [dispatch, selectedMonth]);

  useEffect(() => {
    if (!selectedDate) return;
    dispatch(fetchMyAttendanceDay({ date: selectedDate }));
  }, [dispatch, selectedDate]);

  const summaries = monthData?.day_summaries ?? [];
  const filteredSummaries = summaries.filter((summary) => {
    if (filterStatus === 'Present') return summary.status === 'PRESENT';
    if (filterStatus === 'Late') return summary.is_late;
    if (filterStatus === 'Half Day') return summary.status === 'HALF_DAY';
    if (filterStatus === 'Needs Action') return summary.needs_regularization;
    return true;
  });
  const totals = monthData?.totals;
  const totalDays = summaries.length;
  const attendanceProgress = totalDays
    ? Math.min(100, Math.round(((totals?.present ?? 0) / totalDays) * 100))
    : 0;
  const selectedMonthLabel = getMonthLabel(selectedMonth);
  const records = filteredSummaries.map((summary, index) => {
    const dateKey = getDateInIndia(new Date(summary.work_date));
    const dayPunches =
      dayData?.date === dateKey
        ? dayData.punches.filter((punch) => !punch.is_voided)
        : [];
    const flags = [
      summary.is_late && 'Late',
      summary.excess_break && 'Excess break',
    ].filter(Boolean);

    return {
      sNo: index + 1,
      dateKey,
      date: dateKey,
      day: getDayName(dateKey),
      firstInLastOut: `${formatTime(summary.first_in)} - ${formatTime(summary.last_out)}`,
      missingPunchType: !summary.first_in && !summary.last_out
        ? 'BOTH'
        : !summary.first_in
          ? 'MISSED_IN'
          : !summary.last_out
            ? 'MISSED_OUT'
            : null,
      punchLogs: dayPunches.map(
        (punch) => `${formatTime(punch.punched_at)} (${punch.direction})`
      ),
      attendanceType: getStatusLabel(summary.status),
      lop: Number(summary.lop_value),
      totalInDuration: formatMinutes(summary.work_min),
      totalOutDuration: formatMinutes(summary.break_min),
      particular: `Permission: ${formatMinutes(summary.permission_min)}`,
      remarks: flags.length ? flags.join(', ') : '-',
    };
  });

  const thBase =
    'border-y border-[#536149] bg-gradient-to-r from-[#4E5A45] to-[#68775C] px-4 py-4 text-[13px] font-black uppercase tracking-wider text-white whitespace-nowrap shadow-sm';

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white p-3 sm:p-5 md:p-7 lg:p-9">

      {/* 1. ORGANIC ABSTRACT CANVAS BACKDROP */}
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

      {/* 2. MAIN ELEVATED DASHBOARD CONTAINER BOARD */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] sm:rounded-[42px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:p-6 lg:p-8">

        {/* Dynamic Curved Notched Top Navigation Bar */}
        <TopNav
          active={navTab}
          onChange={(tab) => setNavTab(tab)}
        />

        {/* Header Bar */}
        <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-[#ECE3D3] pb-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">
              SHIFT OVERVIEW &amp; LOGS
            </span>
            <h1 className="mt-0.5 text-3xl font-black text-stone-900 sm:text-4xl">
              Attendance &amp; Work Logs
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-stone-600 sm:text-base">
              Track check-ins, verify working hours, and manage leave requests seamlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/requests/apply-regularization${selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : ''}`}
              className="flex items-center gap-2 rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] px-5 py-3 text-sm font-bold text-[#46513F] shadow-xs transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95"
            >
              <svg className="h-4 w-4 text-[#707C65]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Regularize Punch</span>
            </Link>

            <button
              type="button"
              onClick={() => setApplyModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#C87961] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Apply Leave / Permission</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5DDCE] bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Input / Today Selector */}
            <label className="flex items-center gap-2 rounded-xl border border-[#E5DDCE] bg-[#FCFAF7] px-3.5 py-2.5 text-sm text-stone-700">
              <span className="text-xs font-black uppercase tracking-wider text-[#5D6953]">
                Date
              </span>
              <input
                type="date"
                aria-label="Attendance date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                onClick={(event) => event.currentTarget.showPicker?.()}
                className="bg-transparent font-bold text-stone-900 outline-none"
              />
            </label>

            <button
              type="button"
              onClick={() => setSelectedDate(getDateInIndia(new Date()))}
              className="rounded-xl border border-[#E5DDCE] bg-white px-4 py-2.5 text-sm font-bold text-stone-700 transition hover:bg-[#F6F8F3] hover:text-[#5D6953]"
            >
              Today
            </button>
          </div>

          {/* Filter Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-black uppercase tracking-wider text-[#5D6953]">
              Filter:
            </span>
            {filterPills.map((pill) => {
              const active = filterStatus === pill;
              return (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setFilterStatus(pill)}
                  aria-pressed={active}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    active
                      ? 'bg-[#C87961] text-white shadow-xs'
                      : 'border border-[#ECE3D3] bg-white text-stone-600 hover:border-[#707C65] hover:bg-[#F6F8F3]'
                  }`}
                >
                  {pill}
                </button>
              );
            })}
          </div>
        </div>

        {(monthError || dayError) && (
          <div role="alert" className="rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] px-5 py-4 text-xs font-bold text-[#C85D44]">
            {monthError && <p>{monthError}</p>}
            {dayError && <p>{dayError}</p>}
          </div>
        )}

        {dayLoading && (
          <p role="status" className="text-xs font-bold text-[#5D6953] animate-pulse">
            Loading details for {selectedDate}…
          </p>
        )}

        {/* Selected Day Details Card */}
        {dayData?.date === selectedDate && (
          <section aria-label="Selected day attendance details" className="overflow-hidden rounded-2xl border border-[#ECE3D3] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DDCE] bg-gradient-to-r from-[#F7F3EB] to-[#F2EEE5] px-5 py-5">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#5D6953]">
                  DATE DETAIL
                </span>
                <h2 className="text-lg font-black text-stone-900 sm:text-xl">
                  Day details · {selectedDate}
                </h2>
                <p className="mt-1 text-sm font-medium text-stone-700">
                  {dayData.summary
                    ? `${getStatusLabel(dayData.summary.status)} · ${formatMinutes(dayData.summary.work_min)} worked · ${formatMinutes(dayData.summary.break_min)} break`
                    : 'No attendance summary for this date.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm font-bold">
                {dayData.flags.needs_regularization && (
                  <span className="rounded-full bg-[#FEF1EC] border border-[#F4C8B9] px-3 py-1 text-[#C85D44]">
                    Needs regularization
                  </span>
                )}
                {dayData.flags.is_late && (
                  <span className="rounded-full bg-[#FEF1EC] border border-[#F4C8B9] px-3 py-1 text-[#C85D44]">
                    Late
                  </span>
                )}
                {dayData.flags.excess_break && (
                  <span className="rounded-full bg-[#FDF8F0] border border-[#EDD7BE] px-3 py-1 text-[#9B6A38]">
                    Excess break
                  </span>
                )}
                {dayData.flags.is_locked && (
                  <span className="rounded-full border border-[#ECE3D3] bg-white px-3 py-1 text-[#5D6953]">
                    Locked
                  </span>
                )}
              </div>
            </div>
            <p className="px-5 py-4 text-sm font-medium text-stone-700">
              <span className="font-bold text-[#5D6953]">Punches:</span>{' '}
              {dayData.punches.length
                ? dayData.punches
                    .filter((punch) => !punch.is_voided)
                    .map((punch) => `${formatTime(punch.punched_at)} (${punch.direction})`)
                    .join(' · ')
                : 'No punch records'}
            </p>
          </section>
        )}

        {/* 4 Metric Summary Cards in Earthy Warm Theme */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Days Present (Olive Deep) */}
          <div className="flex min-h-44 flex-col justify-between rounded-2xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] p-5 text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="flex items-center justify-between">
              <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-black tracking-wider uppercase text-[#E8EEDF]">
                DAYS PRESENT
              </span>
              <svg className="h-5 w-5 text-white/80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-white">
                {monthData ? `${totals?.present ?? 0}` : '—'} <span className="text-base font-normal text-white/60">/ {totalDays}</span>
              </p>
              <p className="mt-1 text-sm text-[#DCE4D5]">
                This month · {monthData ? `${attendanceProgress}%` : '—'} complete
              </p>
            </div>
          </div>

          {/* Card 2: Hours Worked (Warm Sand) */}
          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#E8D4B9] bg-gradient-to-br from-[#FFFDF8] to-[#F8EBD9] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#EDD7BE] bg-white px-3 py-1.5 text-xs font-black tracking-wider uppercase text-[#815526]">
                HOURS WORKED
              </span>
              <svg className="h-5 w-5 text-[#9B6A38]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-stone-900">
                {totals ? formatMinutes(totals.work_minutes) : '—'}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                Across {totals?.present ?? '—'} working days
              </p>
            </div>
          </div>

          {/* Card 3: Leave Balance (Terracotta) */}
          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#F3C9BB] bg-gradient-to-br from-[#FFF8F5] to-[#FCE5DC] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#F4C8B9] bg-white px-3 py-1.5 text-xs font-black tracking-wider uppercase text-[#B24832]">
                LEAVE BALANCE
              </span>
              <svg className="h-5 w-5 text-[#C85D44]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-[#B24832]">
                12 <span className="text-base font-semibold text-[#C85D44]/80">days</span>
              </p>
              <p className="mt-1 text-sm text-stone-600">Available to take anytime</p>
            </div>
          </div>

          {/* Card 4: Next Payday (Soft White/Olive Border) */}
          <div className="flex min-h-44 flex-col justify-between rounded-2xl border border-[#D9E2D2] bg-gradient-to-br from-white to-[#F0F5EB] p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="rounded-lg border border-[#D9E2D2] bg-white px-3 py-1.5 text-xs font-black tracking-wider uppercase text-[#46513F]">
                NEXT PAYDAY
              </span>
              <span className="text-base font-black text-[#5D6953]">$</span>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-black text-stone-900">30 Nov</p>
              <p className="mt-1 text-sm text-stone-600">November payroll disbursement</p>
            </div>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="overflow-hidden rounded-3xl border border-[#E5DDCE] bg-[#FCFAF7] shadow-md">
          {/* Table Header Bar with Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DDCE] bg-gradient-to-r from-white to-[#FAF7F0] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-stone-900 sm:text-xl">Attendance history</h3>
                <p className="mt-0.5 text-sm text-stone-600">
                  Monthly attendance summaries and punch details for the selected period
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-xl border border-[#E5DDCE] bg-[#F7F3EB] px-4 py-2 text-sm font-bold text-[#46513F]">
                {selectedMonthLabel || 'Attendance period'}
              </span>
              <button
                type="button"
                onClick={() => alert('Exporting to Excel...')}
                className="flex items-center gap-2 rounded-xl border border-[#D9E2D2] bg-white px-4 py-2 text-sm font-bold text-[#46513F] shadow-xs transition hover:bg-[#F6F8F3] hover:text-[#5D6953]"
              >
                <svg className="h-4 w-4 text-[#707C65]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Mobile & Tablet Card List */}
          <div className="grid grid-cols-1 gap-4 p-4 sm:p-5 lg:grid-cols-2 2xl:hidden">
            {monthLoading && records.length === 0 && (
              <p role="status" className="col-span-full rounded-2xl bg-white px-4 py-10 text-center text-sm font-bold text-stone-600">
                Loading attendance…
              </p>
            )}
            {!monthLoading && !monthError && records.length === 0 && (
              <p className="col-span-full rounded-2xl bg-white px-4 py-10 text-center text-sm font-bold text-stone-600">
                No attendance records found for {selectedMonthLabel || 'this month'}.
              </p>
            )}
            {records.map((row) => {
              const [firstIn, lastOut] = row.firstInLastOut.split(' - ');
              const isWeekend = row.day === 'Sunday' || row.day === 'Saturday';
              const isWeekStart = row.day === 'Monday';
              return (
                <article
                  key={row.sNo}
                  className={`rounded-2xl border-2 p-5 shadow-sm transition hover:shadow-md ${
                    selectedDate === row.dateKey
                      ? 'border-[#707C65] bg-[#F6F8F3]'
                      : isWeekend
                        ? 'border-[#E7D8C5] bg-[#FDF9F2] hover:border-[#C87961]/50'
                        : isWeekStart
                          ? 'border-[#BCC7B4] bg-[#F9FBF7] hover:border-[#707C65]/50'
                          : 'border-[#ECE3D3] bg-white hover:border-[#707C65]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedDate(row.dateKey)}
                      className="text-left"
                      aria-label={`Show details for ${row.day}, ${row.date}`}
                    >
                      <DateBadge date={row.date} day={row.day} />
                    </button>
                    <StatusBadge label={row.attendanceType} />
                  </div>

                  <div className="mt-4 space-y-2.5 rounded-xl border border-[#E5DDCE] bg-[#F7F3EB] px-4 py-3.5">
                    <PunchTime kind="IN" value={firstIn} />
                    <PunchTime kind="OUT" value={lastOut} />
                    {row.missingPunchType && (
                      <Link
                        href={`/requests/apply-regularization?date=${encodeURIComponent(row.dateKey)}&type=${row.missingPunchType}`}
                        aria-label={`Apply regularization for ${row.date}`}
                        className={`mt-1 inline-block ${actionBtn}`}
                      >
                        Apply regularization
                      </Link>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[#E5DDCE] bg-white px-4 py-3">
                    <div>
                      <p className="text-xs font-bold text-stone-600">Total work duration</p>
                      <p className="mt-0.5 text-base font-black tabular-nums text-stone-900">{row.totalInDuration}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDurationDetails({
                        date: row.date,
                        work: row.totalInDuration,
                        breakTime: row.totalOutDuration,
                        permission: row.particular.replace('Permission: ', ''),
                      })}
                      aria-label={`View duration breakdown for ${row.date}`}
                      title="View duration breakdown"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5D6953] transition hover:bg-[#EAF0E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953]"
                    >
                      <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                        <circle cx="12" cy="12" r="2.5" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-black uppercase tracking-wider text-[#5D6953]">Punch log</p>
                    {row.punchLogs.length > 0 ? (
                      <div className="mt-1 space-y-1 text-sm tabular-nums text-stone-700">
                        {(expandedLog === String(row.sNo)
                          ? row.punchLogs
                          : row.punchLogs.slice(0, 2)
                        ).map((log) => <p key={`${row.sNo}-${log}`}>{log}</p>)}
                        {row.punchLogs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setExpandedLog(expandedLog === String(row.sNo) ? null : String(row.sNo))}
                            className="font-bold text-[#5D6953] hover:underline"
                          >
                            {expandedLog === String(row.sNo) ? 'Show less' : `Show ${row.punchLogs.length - 2} more`}
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-stone-500">No punch records</p>
                    )}
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#ECE3D3] pt-3">
                    <div>
                      <span className="text-xs font-medium text-stone-500">LOP </span>
                      <span className={`text-sm font-bold ${row.lop > 0 ? 'text-[#C85D44]' : 'text-stone-700'}`}>
                        {row.lop > 0 ? row.lop : '-'}
                      </span>
                    </div>
                    {(row.lop > 0 || row.missingPunchType === 'BOTH') && (
                      <div className="flex flex-wrap gap-1.5">
                        <Link
                          href={`/requests/apply-leave?date=${encodeURIComponent(row.dateKey)}`}
                          className={actionBtn}
                        >
                          Apply Leave
                        </Link>
                        <Link
                          href={`/requests/apply-permission?date=${encodeURIComponent(row.dateKey)}`}
                          className={actionBtn}
                        >
                          Apply Permission
                        </Link>
                      </div>
                    )}
                  </div>
                  {row.remarks !== '-' && (
                    <div className="mt-2.5">
                      <FlagChips remarks={row.remarks} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {/* Desktop Row-Card Table */}
          <div className="hidden w-full overflow-x-auto px-5 pb-5 pt-3 2xl:block">
            <table className="w-full min-w-[1480px] table-fixed border-separate border-spacing-y-2.5 text-left">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[15%]" />
                <col className="w-[16%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" className={`${thBase} rounded-l-xl border-l text-center`}>No</th>
                  <th scope="col" className={thBase}>Date</th>
                  <th scope="col" className={thBase}>First In / Last Out</th>
                  <th scope="col" className={thBase}>Punch Log</th>
                  <th scope="col" className={`${thBase} text-center`}>Status</th>
                  <th scope="col" className={thBase}>Work duration</th>
                  <th scope="col" className={`${thBase} text-center`}>LOP / Actions</th>
                  <th scope="col" className={`${thBase} rounded-r-xl border-r`}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {monthLoading && records.length === 0 && (
                  <tr>
                    <td colSpan={8} className="rounded-2xl bg-white px-4 py-12 text-center text-sm font-bold text-stone-500">
                      Loading attendance…
                    </td>
                  </tr>
                )}
                {!monthLoading && !monthError && records.length === 0 && (
                  <tr>
                    <td colSpan={8} className="rounded-2xl bg-white px-4 py-12 text-center text-sm font-bold text-stone-500">
                      No attendance records found for {selectedMonthLabel || 'this month'}.
                    </td>
                  </tr>
                )}
                {records.map((row) => {
                  const selected = selectedDate === row.dateKey;
                  const isWeekend = row.day === 'Sunday' || row.day === 'Saturday';
                  const isWeekStart = row.day === 'Monday';
                  const [firstIn, lastOut] = row.firstInLastOut.split(' - ');
                  const cell = `border-r border-[#E5DDCE] px-4 py-4 align-middle text-sm text-stone-800 transition-colors ${
                    selected
                      ? 'border-[#707C65] bg-[#F6F8F3]'
                      : isWeekend
                        ? 'border-[#E7D8C5] bg-[#FDF9F2] group-hover:bg-[#FAF1E7]'
                        : isWeekStart
                          ? 'border-[#BCC7B4] bg-[#F9FBF7] group-hover:bg-[#F2F6EE]'
                          : 'border-[#ECE3D3] bg-white group-hover:bg-[#FAF7F0]'
                  }`;
                  return (
                    <tr
                      key={row.sNo}
                      onClick={() => setSelectedDate(row.dateKey)}
                      className={`group cursor-pointer ${isWeekStart ? 'relative' : ''}`}
                    >
                      {/* No */}
                      <td
                        className={`${cell} rounded-l-2xl border-l text-center text-sm font-bold tabular-nums text-stone-500 ${
                          selected
                            ? 'border-l-[5px] border-l-[#5D6953]'
                            : isWeekend
                              ? 'border-l-[4px] border-l-[#C87961]'
                              : isWeekStart
                                ? 'border-l-[4px] border-l-[#A3AF98]'
                                : ''
                        }`}
                      >
                        {row.sNo}
                      </td>

                      {/* Date */}
                      <td className={cell}>
                        <DateBadge date={row.date} day={row.day} />
                      </td>

                      {/* First In / Last Out */}
                      <td className={cell}>
                        <div className="space-y-1">
                          <PunchTime kind="IN" value={firstIn} />
                          <PunchTime kind="OUT" value={lastOut} />
                        </div>
                        {row.missingPunchType && (
                          <Link
                            href={`/requests/apply-regularization?date=${encodeURIComponent(row.dateKey)}&type=${row.missingPunchType}`}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Apply regularization for ${row.date}`}
                            className={`mt-2 inline-block ${actionBtn}`}
                          >
                            Apply regularization
                          </Link>
                        )}
                      </td>

                      {/* Punch Log */}
                      <td className={`${cell} text-sm tabular-nums`}>
                        {row.punchLogs.length > 0 ? (
                          <div className="space-y-0.5">
                            {(expandedLog === String(row.sNo)
                              ? row.punchLogs
                              : row.punchLogs.slice(0, 2)
                            ).map((log, index) => (
                              <p
                                key={`${row.sNo}-${log}`}
                                className={`whitespace-nowrap ${index === 0 ? 'font-bold text-stone-800' : 'text-stone-500'}`}
                              >
                                {log}
                              </p>
                            ))}
                            {row.punchLogs.length > 2 && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setExpandedLog(expandedLog === String(row.sNo) ? null : String(row.sNo));
                                }}
                                className="mt-1 block text-xs font-bold text-[#46513F] hover:underline"
                              >
                                {expandedLog === String(row.sNo) ? 'Hide' : 'Show more'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className={`${cell} text-center`}>
                        <StatusBadge label={row.attendanceType} />
                      </td>

                      {/* Work duration */}
                      <td className={cell}>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="whitespace-nowrap text-sm font-black tabular-nums text-stone-900">
                            {row.totalInDuration}
                          </span>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setDurationDetails({
                                date: row.date,
                                work: row.totalInDuration,
                                breakTime: row.totalOutDuration,
                                permission: row.particular.replace('Permission: ', ''),
                              });
                            }}
                            aria-label={`View duration breakdown for ${row.date}`}
                            title="View duration breakdown"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#5D6953] transition hover:bg-[#EAF0E6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953]"
                          >
                            <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                              <circle cx="12" cy="12" r="2.5" />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* LOP */}
                      <td className={`${cell} text-center`}>
                        {typeof row.lop === 'number' &&
                        (row.lop > 0 || row.missingPunchType === 'BOTH') ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="text-base font-black tabular-nums text-[#C85D44]">{row.lop}</span>
                            <div className="flex gap-1">
                              <Link
                                href={`/requests/apply-leave?date=${encodeURIComponent(row.dateKey)}`}
                                onClick={(event) => event.stopPropagation()}
                                className={actionBtn}
                              >
                                Leave
                              </Link>
                              <Link
                                href={`/requests/apply-permission?date=${encodeURIComponent(row.dateKey)}`}
                                onClick={(event) => event.stopPropagation()}
                                className={actionBtn}
                              >
                                Perm
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-stone-400">-</span>
                        )}
                      </td>

                      {/* Flags */}
                      <td className={`${cell} rounded-r-2xl border-r`}>
                        <FlagChips remarks={row.remarks || '-'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Record Count Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E5DDCE] bg-[#FAF7F0] px-5 py-4 text-sm font-medium text-stone-600 sm:px-6">
            <span>
              Showing <strong className="text-stone-800">{records.length ? 1 : 0}–{records.length}</strong> of{' '}
              <strong className="text-stone-800">{records.length}</strong> records
            </span>
          </div>
        </div>
      </main>

      {/* Duration Dialog Breakdown Modal */}
      {durationDetails && (
        <DurationDialog details={durationDetails} onClose={() => setDurationDetails(null)} />
      )}

      {/* Apply Leave / Permission Modal */}
      {applyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
          onClick={() => setApplyModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-3xl border border-[#ECE3D3] bg-[#FCFAF7] p-6 shadow-2xl sm:p-7"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ECE3D3] pb-3.5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#707C65]">
                  QUICK ACTION
                </span>
                <h2 className="text-lg font-black text-stone-900">
                  Apply Leave / Permission
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setApplyModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-[#EFE9DF] hover:text-stone-800 transition"
              >
                ✕
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3.5">
              {[
                {
                  label: 'Apply Leave',
                  href: `/requests/apply-leave${selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : ''}`,
                },
                {
                  label: 'Apply Permission',
                  href: `/requests/apply-permission${selectedDate ? `?date=${encodeURIComponent(selectedDate)}` : ''}`,
                },
              ].map((option) => (
                <Link
                  key={option.href}
                  href={option.href}
                  onClick={() => {
                    setApplyModalOpen(false);
                  }}
                  className="rounded-2xl bg-[#C87961] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#B86A54] active:scale-95"
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}