'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopNav from '../../components/topNavBar';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { applyForLeave } from '../../store/request/requestSlice';
import { useRequestQuery } from '../useRequestQuery'

/* ------------------------------------------------------------------ */
/*  PRESENTATION HELPERS (styling only — no business logic)           */
/*  Same Earthy Warm look as the Requests page                        */
/* ------------------------------------------------------------------ */

const fieldClassName =
  'mt-2 block w-full rounded-2xl border border-[#E5DDCE] bg-white px-4 py-3 text-sm font-semibold text-stone-900 shadow-xs outline-none transition placeholder:font-medium placeholder:text-stone-400 hover:border-[#707C65]/60 focus:border-[#5D6953] focus:ring-2 focus:ring-[#5D6953]/20';

const labelClassName = 'block text-sm font-bold text-stone-800';

const focusRing =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5D6953]';

const SESSION_OPTIONS = [
  { value: 'FULL_DAY', label: 'Full day', hint: 'Whole working day' },
  { value: 'FIRST_HALF', label: 'First half', hint: 'Morning session' },
  { value: 'SECOND_HALF', label: 'Second half', hint: 'Afternoon session' },
] as const;

const ATTENDANCE_LABELS: Record<string, string> = {
  CASUAL_LEAVE: 'Casual leave',
  SICK_LEAVE: 'Sick leave',
  EARNED_LEAVE: 'Earned leave',
  OTHER: 'Other',
};

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

function PaperclipIcon({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
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

// Display-only calendar-day span for the summary panel (not sent to the API).
const displaySpan = (from: string, to: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) return null;
  const diff = Math.round(
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000
  );
  return diff >= 0 ? diff + 1 : null;
};

export default function ApplyLeavePage() {
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector((state) => state.requests.applying);
  const dateParam = useRequestQuery().get('date') ?? '';
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : '';
  const [form, setForm] = useState<{ from_date: string | null; to_date: string | null; reason: string }>({
    from_date: null,
    to_date: null,
    reason: '',
  });
  const fromDate = form.from_date ?? initialDate;
  const toDate = form.to_date ?? initialDate;
  const [sessionType, setSessionType] = useState('FULL_DAY');
  const [attendanceType, setAttendanceType] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const submitLeaveRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const payload = { from_date: fromDate, to_date: toDate, reason: form.reason.trim() };

    if (!payload.reason) {
      setError('Please enter a reason for your leave request.');
      return;
    }

    if (payload.to_date < payload.from_date) {
      setError('The end date must be on or after the start date.');
      return;
    }

    try {
      const { leave_request: leaveRequest } = await dispatch(applyForLeave(payload)).unwrap();
      const formatDate = (date: string) =>
        new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      const request = {
        id: `#LR-${leaveRequest.id}`,
        rawId: leaveRequest.id,
        type: 'LEAVE' as const,
        appliedOn: new Intl.DateTimeFormat('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date()),
        targetDate: `${formatDate(payload.from_date)} – ${formatDate(payload.to_date)}`,
        targetSub: `${leaveRequest.days} day${leaveRequest.days === '1' ? '' : 's'} requested`,
        details: payload.reason,
        categoryTag: 'Leave Request',
        ledgerImpact: `-${leaveRequest.days} Days`,
        ledgerImpactType: 'text' as const,
        status: 'PENDING' as const,
        decidedBy: 'Awaiting approval',
        decisionNote: 'Submitted for review',
      };

      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('employee-requests');
        channel.postMessage({
          type: 'employee.leave.applied',
          request,
          requestMonth: payload.from_date.slice(0, 7),
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
            : 'Unable to submit leave request.'
      );
    }
  };

  // Display-only values for the summary panel
  const span = displaySpan(fromDate, toDate);
  const sessionLabel = SESSION_OPTIONS.find((option) => option.value === sessionType)?.label ?? '';
  const attendanceLabel = ATTENDANCE_LABELS[attendanceType] ?? 'Not selected';

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white p-3 sm:p-5 md:p-7 lg:p-9">
      {/* 1. Organic Abstract Backdrop Shapes */}
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
            Step 1 of 1 · Leave application
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
                APPLICATION PROCESSED
              </span>
              <h1 className="mt-1 text-3xl font-black text-stone-900 sm:text-4xl">
                Request submitted
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
                Your leave request has been submitted successfully to your manager for approval. You can track its live status in your request history.
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
              aria-label="Leave application form"
              className="overflow-hidden rounded-3xl border border-[#E5DDCE] bg-[#FCFAF7] shadow-md"
            >
              {/* Section header bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5DDCE] bg-gradient-to-r from-white to-[#FAF7F0] px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm ring-1 ring-black/5">
                    <CalendarIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">
                      LEAVE APPLICATION
                    </span>
                    <h1 className="text-xl font-black text-stone-900 sm:text-2xl">Apply for leave</h1>
                  </div>
                </div>
                <p className="max-w-sm text-sm leading-relaxed text-stone-600">
                  Schedule planned time off or submit a medical absence.
                </p>
              </div>

              <form className="space-y-6 p-4 sm:p-6" onSubmit={submitLeaveRequest}>
                {/* Group 1: Session */}
                <fieldset className="rounded-2xl border border-[#E5ECE0] bg-[#F6F8F3] p-4 sm:p-5">
                  <legend className="px-2 text-xs font-black uppercase tracking-wider text-[#5D6953]">
                    Session
                  </legend>
                  <div
                    role="radiogroup"
                    aria-label="Session type"
                    className="grid grid-cols-1 gap-2.5 sm:grid-cols-3"
                  >
                    {SESSION_OPTIONS.map((option) => {
                      const active = sessionType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => setSessionType(option.value)}
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

                {/* Group 2: Dates + attendance type */}
                <fieldset className="rounded-2xl border border-[#F2E7D3] bg-[#FDF9F0] p-4 sm:p-5">
                  <legend className="px-2 text-xs font-black uppercase tracking-wider text-[#9B6A38]">
                    Dates &amp; type
                  </legend>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
                    {/* From Date */}
                    <label className={labelClassName}>
                      From date <span className="text-[#C85D44]">*</span>
                      <input
                        type="date"
                        required
                        value={fromDate}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, from_date: event.target.value }))
                        }
                        className={fieldClassName}
                      />
                    </label>

                    {/* To Date */}
                    <label className={labelClassName}>
                      To date <span className="text-[#C85D44]">*</span>
                      <input
                        type="date"
                        required
                        min={fromDate || undefined}
                        value={toDate}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, to_date: event.target.value }))
                        }
                        className={fieldClassName}
                      />
                    </label>

                    {/* Attendance Type */}
                    <label className={`${labelClassName} sm:col-span-2 xl:col-span-1`}>
                      Attendance type <span className="text-[#C85D44]">*</span>
                      <select
                        required
                        value={attendanceType}
                        onChange={(event) => setAttendanceType(event.target.value)}
                        className={fieldClassName}
                      >
                        <option value="">Select an attendance type</option>
                        <option value="CASUAL_LEAVE">Casual leave</option>
                        <option value="SICK_LEAVE">Sick leave</option>
                        <option value="EARNED_LEAVE">Earned leave</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </label>
                  </div>
                </fieldset>

                {/* Group 3: Reason + attachment */}
                <fieldset className="rounded-2xl border border-[#E5DDCE] bg-[#F7F3EB] p-4 sm:p-5">
                  <legend className="px-2 text-xs font-black uppercase tracking-wider text-[#46513F]">
                    Details
                  </legend>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-4 lg:grid-cols-2">
                    {/* Reason Textarea */}
                    <label className={labelClassName}>
                      Reason <span className="text-[#C85D44]">*</span>
                      <textarea
                        required
                        rows={6}
                        maxLength={1000}
                        value={form.reason}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, reason: event.target.value }))
                        }
                        placeholder="Enter the reason for your leave request..."
                        className={`${fieldClassName} resize-y leading-relaxed`}
                      />
                      <span className="mt-1.5 block text-right text-xs font-medium tabular-nums text-stone-400">
                        {form.reason.length}/1000
                      </span>
                    </label>

                    {/* Attachment Box */}
                    <div>
                      <label className={labelClassName} htmlFor="leave-attachment">
                        Attachment <span className="font-medium text-stone-400">(optional)</span>
                      </label>
                      <label
                        htmlFor="leave-attachment"
                        className="mt-2 flex min-h-[148px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E5DDCE] bg-white p-4 text-center transition hover:border-[#5D6953] hover:bg-[#F6F8F3] focus-within:border-[#5D6953] focus-within:ring-2 focus-within:ring-[#5D6953]/20"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F3EB] text-[#5D6953]">
                          <PaperclipIcon className="h-5 w-5" />
                        </span>
                        <span className="text-sm font-bold text-stone-800">
                          {attachmentName ? 'Change file' : 'Choose a file to attach'}
                        </span>
                        <span className="max-w-full break-all text-xs font-semibold text-stone-500">
                          {attachmentName
                            ? `Selected file: ${attachmentName}`
                            : 'No file chosen (PDF, PNG, JPG up to 10MB)'}
                        </span>
                        <input
                          id="leave-attachment"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || '')}
                          className="sr-only"
                        />
                      </label>
                      <p className="mt-1.5 text-xs font-medium text-stone-500">
                        Session type, attendance type, and attachments are processed locally alongside the leave payload.
                      </p>
                    </div>
                  </div>
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
                  <p className="text-sm font-semibold text-[#D8DEC7]">Duration</p>
                  <p className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{span ?? '—'}</span>
                    <span className="text-sm font-bold text-[#D8DEC7]">
                      {span === 1 ? 'Calendar day' : 'Calendar days'}
                    </span>
                  </p>
                </div>

                <div className="mt-5 space-y-2.5 border-t border-white/15 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#D8DEC7]">From</span>
                    <span className="font-black text-white">{displayDate(fromDate)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#D8DEC7]">To</span>
                    <span className="font-black text-white">{displayDate(toDate)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#D8DEC7]">Session</span>
                    <span className="font-black text-white">{sessionLabel}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-[#D8DEC7]">Type</span>
                    <span className="font-black text-white">{attendanceLabel}</span>
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