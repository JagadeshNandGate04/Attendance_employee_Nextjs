'use client';

import { useState } from 'react';
import Link from 'next/link';
import TopNav from '../../components/topNavBar';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { applyForPermission } from '../../store/request/requestSlice';
import { useRequestQuery } from '../useRequestQuery';

const fieldClassName =
  'mt-1.5 block w-full rounded-2xl border border-[#ECE3D3] bg-white px-4 py-2.5 text-xs font-semibold text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#5D6953] focus:ring-2 focus:ring-[#5D6953]/20';

function getMinutesBetween(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  return endHour * 60 + endMinute - (startHour * 60 + startMinute);
}

export default function ApplyPermissionPage() {
  const dispatch = useAppDispatch();
  const isSubmitting = useAppSelector((state) => state.requests.applyingPermission);
  const dateParam = useRequestQuery().get('date') ?? '';
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : '';
  const [form, setForm] = useState({
    perm_date: null as string | null,
    session_type: 'IN',
    permission_count: '1',
    start_time: '',
    end_time: '',
    reason: '',
  });
  const [attachmentName, setAttachmentName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const permissionDate = form.perm_date ?? initialDate;

  // Real-time calculated duration helper
  const computedMinutes =
    form.start_time && form.end_time ? getMinutesBetween(form.start_time, form.end_time) : 0;

  const submitPermissionRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const reason = form.reason.trim();
    const minutes = getMinutesBetween(form.start_time, form.end_time);

    if (!reason) {
      setError('Please enter a reason for your permission request.');
      return;
    }

    if (minutes <= 0) {
      setError('End time must be later than start time.');
      return;
    }

    try {
      const { permission_request: permissionRequest } = await dispatch(
        applyForPermission({
          perm_date: permissionDate,
          start_time: form.start_time,
          minutes,
          reason,
        })
      ).unwrap();

      const formatDate = (date: string) =>
        new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
      const formatTime = (time: string) => time.slice(0, 5);
      const request = {
        id: `#PR-${permissionRequest.id}`,
        rawId: permissionRequest.id,
        type: 'PERMISSION' as const,
        appliedOn: new Intl.DateTimeFormat('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date()),
        targetDate: formatDate(permissionDate),
        targetSub: `${formatTime(form.start_time)} – ${formatTime(form.end_time)} · ${minutes} mins`,
        details: reason,
        categoryTag: `${form.session_type === 'IN' ? 'In' : 'Out'} permission`,
        ledgerImpact: `-${minutes} Mins`,
        ledgerImpactType: 'text' as const,
        status: 'PENDING' as const,
        decidedBy: 'Awaiting approval',
        decisionNote: 'Submitted for review',
      };

      if (typeof BroadcastChannel !== 'undefined') {
        const channel = new BroadcastChannel('employee-requests');
        channel.postMessage({ type: 'employee.permission.applied', request });
        channel.close();
      }

      setSubmitted(true);
    } catch (submitError: unknown) {
      setError(
        typeof submitError === 'string'
          ? submitError
          : submitError instanceof Error
            ? submitError.message
            : 'Unable to submit permission request.'
      );
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FBF7F0] font-sans text-stone-800 antialiased selection:bg-[#707C65] selection:text-white p-3 sm:p-5 md:p-7 lg:p-9">
      
      {/* 1. Organic Abstract Artwork Backdrop */}
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
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] sm:rounded-[42px] border border-[#ECE3D3]/90 bg-[#FCFAF7] p-4 shadow-[0_24px_70px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:p-6 lg:p-8">
        <TopNav active="request" />

        {/* Back Link & Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 rounded-xl border border-[#ECE3D3] bg-white px-4 py-2 text-xs font-bold text-stone-700 shadow-2xs transition hover:bg-[#F6F8F3] hover:text-[#5D6953] active:scale-95"
          >
            <span aria-hidden="true">←</span>
            Back to requests
          </Link>
          <span className="hidden text-xs font-semibold text-stone-400 sm:inline-block">
            Step 1 of 1 · Short Time Permission
          </span>
        </div>

        {/* Form Container Card */}
        <section className="rounded-3xl border border-[#ECE3D3] bg-[#FCFAF7] p-5 shadow-xs sm:p-8">
          {submitted ? (
            <div className="py-12 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] text-2xl font-black text-[#5D6953] shadow-xs">
                ✓
              </span>
              <span className="mt-5 inline-block text-[10px] font-black uppercase tracking-widest text-[#707C65]">
                PERMISSION REQUEST PROCESSED
              </span>
              <h1 className="mt-1 text-2xl font-black text-stone-900 sm:text-3xl">
                Request submitted
              </h1>
              <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-relaxed text-stone-500 sm:text-sm">
                Your short time permission request has been submitted successfully. Your reporting manager will review it shortly.
              </p>
              <Link
                href="/requests"
                className="mt-6 inline-flex rounded-xl bg-[#5D6953] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#4D5844] active:scale-95"
              >
                Return to requests
              </Link>
            </div>
          ) : (
            <>
              {/* Card Header */}
              <header className="border-b border-[#ECE3D3] pb-5">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9E2D2] bg-[#F6F8F3] px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#5D6953]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5D6953]" />
                  Short Leave / Permission
                </span>
                <h1 className="mt-2 text-2xl font-black text-stone-900 sm:text-3xl">
                  Request permission
                </h1>
                <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                  Specify the date, exact time duration, and reason for your scheduled out-of-office slot.
                </p>
              </header>

              {/* Permission Form */}
              <form className="mt-6 space-y-5" onSubmit={submitPermissionRequest}>
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                  
                  {/* Permission Date */}
                  <label className="block text-xs font-bold text-stone-700">
                    Permission date <span className="text-[#C85D44]">*</span>
                    <input
                      type="date"
                      required
                      value={permissionDate}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, perm_date: event.target.value }))
                      }
                      className={fieldClassName}
                    />
                  </label>

                  {/* Session Type */}
                  <label className="block text-xs font-bold text-stone-700">
                    Session type <span className="text-[#C85D44]">*</span>
                    <select
                      required
                      value={form.session_type}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, session_type: event.target.value }))
                      }
                      className={fieldClassName}
                    >
                      <option value="IN">In (Morning / Late Arrival)</option>
                      <option value="OUT">Out (Evening / Early Departure)</option>
                    </select>
                  </label>

                  {/* Permission Count */}
                  <label className="block text-xs font-bold text-stone-700">
                    Permission count <span className="text-[#C85D44]">*</span>
                    <select
                      required
                      value={form.permission_count}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, permission_count: event.target.value }))
                      }
                      className={fieldClassName}
                    >
                      {[1, 2, 3, 4].map((count) => (
                        <option key={count} value={count}>
                          {count} {count === 1 ? 'Slot' : 'Slots'}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Live Duration Indicator Pill */}
                  <div className="flex flex-col justify-end">
                    <span className="block text-xs font-bold text-stone-700">Calculated duration</span>
                    <div className="mt-1.5 flex h-[42px] items-center justify-between rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] px-4 py-2">
                      <span className="text-[11px] font-bold text-[#707C65]">Total Time</span>
                      <span className="text-xs font-black text-[#5D6953]">
                        {computedMinutes > 0 ? `${computedMinutes} mins (${(computedMinutes / 60).toFixed(1)} hrs)` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Start Time */}
                  <label className="block text-xs font-bold text-stone-700">
                    Start time <span className="text-[#C85D44]">*</span>
                    <input
                      type="time"
                      required
                      value={form.start_time}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, start_time: event.target.value }))
                      }
                      className={fieldClassName}
                    />
                  </label>

                  {/* End Time */}
                  <label className="block text-xs font-bold text-stone-700">
                    End time <span className="text-[#C85D44]">*</span>
                    <input
                      type="time"
                      required
                      min={form.start_time || undefined}
                      value={form.end_time}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, end_time: event.target.value }))
                      }
                      className={fieldClassName}
                    />
                  </label>

                  {/* Reason Textarea */}
                  <label className="block text-xs font-bold text-stone-700 sm:col-span-2 xl:col-span-2">
                    Reason <span className="text-[#C85D44]">*</span>
                    <textarea
                      required
                      rows={4}
                      maxLength={1000}
                      value={form.reason}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, reason: event.target.value }))
                      }
                      placeholder="Enter the specific reason for requesting this permission slot..."
                      className={`${fieldClassName} resize-y leading-relaxed`}
                    />
                  </label>

                  {/* Attachment Box */}
                  <label className="block text-xs font-bold text-stone-700 sm:col-span-2 xl:col-span-4">
                    Attachment <span className="font-normal text-stone-400">(optional)</span>
                    <div className="mt-1.5 flex flex-col justify-center rounded-2xl border border-dashed border-[#ECE3D3] bg-white p-3.5 transition hover:border-[#5D6953]/50">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(event) => setAttachmentName(event.target.files?.[0]?.name || '')}
                        className="block w-full cursor-pointer text-xs text-stone-600 file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-[#5D6953] file:px-4 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-wider file:text-white hover:file:bg-[#4D5844] transition"
                      />
                      <span className="mt-2 text-[11px] font-semibold text-stone-500">
                        {attachmentName ? `Selected: ${attachmentName}` : 'No file chosen (PDF, PNG, JPG up to 10MB)'}
                      </span>
                    </div>
                    <span className="mt-1.5 block text-[10px] font-medium text-stone-400">
                      Session type, permission count, and attachments are processed locally alongside the payload. Duration is computed directly from start &amp; end times.
                    </span>
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <p role="alert" className="rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] px-4 py-3 text-xs font-bold text-[#C85D44]">
                    {error}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col-reverse gap-2.5 border-t border-[#ECE3D3] pt-5 sm:flex-row sm:justify-end">
                  <Link
                    href="/requests"
                    className="rounded-xl border border-[#ECE3D3] bg-white px-5 py-2.5 text-center text-xs font-bold text-stone-600 transition hover:bg-[#F6F8F3] hover:text-[#5D6953]"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-xl bg-[#5D6953] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#4D5844] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit request'}
                  </button>
                </div>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
