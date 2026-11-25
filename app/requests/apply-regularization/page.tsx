'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopNav from '../../components/topNavBar';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  applyForRegularization,
  type RegularizationRequestPayload,
  type RegularizationType,
} from '../../store/request/requestSlice';
import { useRequestQuery } from '../useRequestQuery';

/* ------------------------------------------------------------------ */
/*  PRESENTATION HELPERS (styling only — no business logic)           */
/*  Same Earthy Warm look as the Requests / Leave / Permission pages  */
/* ------------------------------------------------------------------ */

const fieldClassName =
  'mt-2 block w-full rounded-2xl border border-[#E5DDCE] bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-xs outline-none transition placeholder:font-medium placeholder:text-stone-400 hover:border-[#707C65]/60 focus:border-[#5D6953] focus:ring-2 focus:ring-[#5D6953]/20';

const labelClassName = 'block text-sm font-bold text-stone-800';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953]';

const TYPE_OPTIONS: { value: RegularizationType; label: string; hint: string }[] = [
  { value: 'MISSED_IN', label: 'Missed check-in', hint: 'Only the IN punch' },
  { value: 'MISSED_OUT', label: 'Missed check-out', hint: 'Only the OUT punch' },
  { value: 'BOTH', label: 'Both punches', hint: 'Check-in and check-out' },
];

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

// Display-only date label ("12 Nov 2026"). Guarded so a partial value never throws while rendering.
const displayDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function ApplyRegularizationPage() {
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector((state) => state.requests.applyingRegularization);
  const query = useRequestQuery();
  const dateParam = query.get('date') ?? '';
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : '';
  const typeParam = query.get('type');
  const initialType: RegularizationType =
    typeParam === 'MISSED_IN' || typeParam === 'MISSED_OUT' || typeParam === 'BOTH'
      ? typeParam
      : 'MISSED_IN';
  const [editedWorkDate, setWorkDate] = useState<string | null>(null);
  const [editedType, setType] = useState<RegularizationType | null>(null);
  const workDate = editedWorkDate ?? initialDate;
  const type = editedType ?? initialType;
  const [claimedIn, setClaimedIn] = useState('');
  const [claimedOut, setClaimedOut] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmedReason = reason.trim();
    const needsIn = type === 'MISSED_IN' || type === 'BOTH';
    const needsOut = type === 'MISSED_OUT' || type === 'BOTH';

    if (!workDate || !trimmedReason || (needsIn && !claimedIn) || (needsOut && !claimedOut)) {
      setError('Please complete the work date, required punch times, and reason.');
      return;
    }

    const payload: RegularizationRequestPayload = {
      work_date: workDate,
      type,
      reason: trimmedReason,
      ...(needsIn ? { claimed_in: `${workDate}T${claimedIn}:00+05:30` } : {}),
      ...(needsOut ? { claimed_out: `${workDate}T${claimedOut}:00+05:30` } : {}),
    };

    try {
      await dispatch(applyForRegularization(payload)).unwrap();
      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('employee-requests');
        channel.postMessage({
          type: 'employee.regularization.applied',
          requestMonth: workDate.slice(0, 7),
        });
        channel.close();
      }
      setSubmitted(true);
    } catch (submitError: unknown) {
      setError(
        typeof submitError === 'string'
          ? submitError
          : submitError instanceof Error
            ? submitError.message
            : 'Unable to submit regularization request.'
      );
    }
  };

  // Display-only values for the template and summary panel
  const showIn = type === 'MISSED_IN' || type === 'BOTH';
  const showOut = type === 'MISSED_OUT' || type === 'BOTH';
  const typeLabel = TYPE_OPTIONS.find((option) => option.value === type)?.label ?? '';

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white p-3 sm:p-5 md:p-7 lg:p-9">

      {/* 1. Organic Abstract Canvas Artwork Backdrop */}
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

      {/* 2. Main Elevated Container Board */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] sm:rounded-[42px] border border-[#ECE3D3]/80 bg-[#FCFAF7] p-4 shadow-[0_24px_64px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:p-6 lg:p-8">
        <TopNav active="request" />

        {/* Header bar: back link + step note */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-b border-[#ECE3D3] pb-4">
          <Link
            href="/requests"
            className={`inline-flex items-center gap-2 rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] px-5 py-3 text-sm font-bold text-[#46513F] shadow-xs transition hover:border-[#5D6953] hover:bg-[#EAF0E6] active:scale-95 ${focusRing}`}
          >
            <span aria-hidden="true">←</span>
            Back to requests
          </Link>
          <span className="hidden rounded-xl border border-[#E5DDCE] bg-[#F7F3EB] px-4 py-2 text-sm font-bold text-[#46513F] sm:inline-block">
            Step 1 of 1 · Attendance correction
          </span>
        </div>

        {submitted ? (
          /* ============ SUCCESS STATE ============ */
          <section
            role="status"
            className="overflow-hidden rounded-3xl border border-[#E5DDCE] bg-white shadow-md"
          >
            <span aria-hidden="true" className="block h-1.5 w-full bg-[#5D6953]" />
            <div className="px-6 py-14 text-center sm:py-20">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#5D6953] text-white shadow-md ring-1 ring-black/5">
                <CheckCircleIcon className="h-10 w-10" />
              </span>
              <span className="mt-6 inline-block text-xs font-black uppercase tracking-widest text-[#5D6953]">
                CORRECTION RECORD SUBMITTED
              </span>
              <h1 className="mt-1 text-3xl font-black text-stone-900 sm:text-4xl">
                Request submitted
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
                Your regularization request has been submitted for approval. You can close this tab or return to request history.
              </p>
              <Link
                href="/requests"
                className={`mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#C87961] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 ${focusRing}`}
              >
                Return to requests
              </Link>
            </div>
          </section>
        ) : (
          /* ============ FORM STATE ============ */
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            {/* ---------- Form card ---------- */}
            <section
              aria-label="Regularization request form"
              className="overflow-hidden rounded-3xl border border-[#E5DDCE] bg-[#FCFAF7] shadow-md"
            >
              {/* Section header bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DDCE] bg-gradient-to-r from-white to-[#FAF7F0] px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm ring-1 ring-black/5">
                    <FingerprintIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">
                      ATTENDANCE REGULARIZATION
                    </span>
                    <h1 className="text-xl font-black text-stone-900 sm:text-2xl">Regularize a punch</h1>
                  </div>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-stone-600">
                  Select the work date and missing punches. Timestamps will be formatted in India Standard Time (IST, UTC+05:30).
                </p>
              </div>

              <form className="space-y-6 p-4 sm:p-6" onSubmit={submitRequest}>
                {/* Group 1: Missing punch type */}
                <fieldset className="rounded-2xl border border-[#E5ECE0] bg-[#F6F8F3] p-4 sm:p-5">
                  <legend className="px-2 text-xs font-black uppercase tracking-wider text-[#5D6953]">
                    Missing punch type
                  </legend>
                  <div
                    role="radiogroup"
                    aria-label="Missing punch type"
                    className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                  >
                    {TYPE_OPTIONS.map((option) => {
                      const active = type === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setType(option.value)}
                          className={`flex flex-col items-start rounded-2xl px-4 py-3 text-left transition ${focusRing} ${
                            active
                              ? 'bg-[#5D6953] text-white shadow-sm'
                              : 'border border-[#D9E2D2] bg-white text-stone-700 hover:border-[#5D6953] hover:bg-[#EAF0E6]'
                          }`}
                        >
                          <span className="text-sm font-black">{option.label}</span>
                          <span
                            className={`mt-0.5 text-xs font-medium ${
                              active ? 'text-[#E8EEDF]' : 'text-stone-500'
                            }`}
                          >
                            {option.hint}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Group 2: Date & punch times */}
                <fieldset className="rounded-2xl border border-[#F2E7D3] bg-[#FDF9F0] p-4 sm:p-5">
                  <legend className="px-2 text-xs font-black uppercase tracking-wider text-[#9B6A38]">
                    Date &amp; punch times
                  </legend>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                    {/* Work Date */}
                    <label className={labelClassName}>
                      Work date <span className="text-[#C85D44]">*</span>
                      <input
                        type="date"
                        required
                        value={workDate}
                        onChange={(event) => setWorkDate(event.target.value)}
                        className={fieldClassName}
                      />
                    </label>

                    {/* Claimed Check-in Time */}
                    {showIn && (
                      <label className={labelClassName}>
                        Claimed check-in time <span className="text-[#C85D44]">*</span>
                        <input
                          type="time"
                          required
                          value={claimedIn}
                          onChange={(event) => setClaimedIn(event.target.value)}
                          className={fieldClassName}
                        />
                      </label>
                    )}

                    {/* Claimed Check-out Time */}
                    {showOut && (
                      <label className={labelClassName}>
                        Claimed check-out time <span className="text-[#C85D44]">*</span>
                        <input
                          type="time"
                          required
                          value={claimedOut}
                          onChange={(event) => setClaimedOut(event.target.value)}
                          className={fieldClassName}
                        />
                      </label>
                    )}
                  </div>
                </fieldset>

                {/* Group 3: Reason */}
                <fieldset className="rounded-2xl border border-[#E5DDCE] bg-[#F7F3EB] p-4 sm:p-5">
                  <legend className="px-2 text-xs font-black uppercase tracking-wider text-[#46513F]">
                    Details
                  </legend>
                  <label className={labelClassName}>
                    Reason for correction <span className="text-[#C85D44]">*</span>
                    <textarea
                      required
                      rows={6}
                      maxLength={1000}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Explain why the punch was missed (e.g. biometric reader failure, client location visit, badge lost)..."
                      className={`${fieldClassName} resize-y leading-relaxed`}
                    />
                    <span className="mt-1.5 block text-right text-xs font-medium tabular-nums text-stone-400">
                      {reason.length}/1000
                    </span>
                  </label>
                </fieldset>

                {/* Error Banner */}
                {error && (
                  <p
                    role="alert"
                    className="flex items-center gap-2.5 rounded-2xl border border-[#F3D7CB] bg-[#FAEEE5] px-5 py-4 text-sm font-bold text-[#C85D44]"
                  >
                    <AlertCircleIcon className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </p>
                )}

                {/* Form Actions */}
                <div className="flex flex-col-reverse gap-3 border-t border-[#ECE3D3] pt-5 sm:flex-row sm:justify-end">
                  <Link
                    href="/requests"
                    className={`rounded-2xl border border-[#E5DDCE] bg-white px-6 py-3 text-center text-sm font-bold text-stone-700 transition hover:bg-[#F6F8F3] hover:text-[#5D6953] active:scale-95 ${focusRing}`}
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-[#C87961] px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C87961]"
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </form>
            </section>

            {/* ---------- Live summary panel ---------- */}
            <aside
              aria-label="Request summary"
              className="flex flex-col gap-4 xl:sticky xl:top-6"
            >
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5D6953] to-[#414B3A] p-5 text-white shadow-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-black uppercase leading-tight tracking-wider text-[#E8EEDF]">
                    REQUEST SUMMARY
                  </span>
                  <CalendarIcon className="h-5 w-5 shrink-0 text-white/80" />
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-[#D8DEC7]">Work date</p>
                  <p className="mt-0.5 text-3xl font-black text-white">{displayDate(workDate)}</p>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-white/15 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#D8DEC7]">Correction</span>
                    <span className="font-black text-white">{typeLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#D8DEC7]">Check-in</span>
                    <span className="font-black text-white">
                      {showIn ? claimedIn || '—' : 'Not needed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#D8DEC7]">Check-out</span>
                    <span className="font-black text-white">
                      {showOut ? claimedOut || '—' : 'Not needed'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#D8DEC7]">Timezone</span>
                    <span className="font-black text-white">IST (UTC+05:30)</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}