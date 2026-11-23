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

const fieldClassName =
  'mt-1.5 block w-full rounded-2xl border border-[#ECE3D3] bg-white px-4 py-2.5 text-xs font-semibold text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#5D6953] focus:ring-2 focus:ring-[#5D6953]/20';

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
          2. MAIN ELEVATED CONTAINER BOARD
          ======================================================== */}
      <main className="relative z-10 mx-auto flex w-full max-w-[1580px] flex-col gap-5 rounded-[36px] sm:rounded-[42px] border border-[#ECE3D3]/90 bg-[#FCFAF7] p-4 shadow-[0_24px_70px_rgba(72,60,45,0.08)] backdrop-blur-sm sm:p-6 lg:p-8">
        
        {/* Top App Bar Navigation */}
        <TopNav active="request" />

        {/* Navigation Breadcrumb and Back Action */}
        <div className="flex items-center justify-between">
          <Link
            href="/requests"
            className="inline-flex items-center gap-2 rounded-xl border border-[#ECE3D3] bg-white px-4 py-2 text-xs font-bold text-stone-700 shadow-2xs transition hover:bg-[#F6F8F3] hover:text-[#5D6953] active:scale-95"
          >
            <span aria-hidden="true">←</span>
            Back to requests
          </Link>
          <span className="hidden text-xs font-semibold text-stone-400 sm:inline-block">
            Step 1 of 1 · Attendance Correction
          </span>
        </div>

        {/* Section Container Card */}
        <section className="rounded-3xl border border-[#ECE3D3] bg-[#FCFAF7] p-5 shadow-xs sm:p-8">
          {submitted ? (
            /* Success Feedback State */
            <div className="py-12 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] text-2xl font-black text-[#5D6953] shadow-xs">
                ✓
              </span>
              <span className="mt-5 inline-block text-[10px] font-black uppercase tracking-widest text-[#707C65]">
                CORRECTION RECORD SUBMITTED
              </span>
              <h1 className="mt-1 text-2xl font-black text-stone-900 sm:text-3xl">
                Request submitted
              </h1>
              <p className="mx-auto mt-2 max-w-md text-xs font-medium leading-relaxed text-stone-500 sm:text-sm">
                Your regularization request has been submitted for approval. You can close this tab or return to request history.
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
                  Attendance Regularization
                </span>
                <h1 className="mt-2 text-2xl font-black text-stone-900 sm:text-3xl">
                  Regularize a punch
                </h1>
                <p className="mt-1 text-xs text-stone-500 sm:text-sm">
                  Select the work date and missing punches. Timestamps will be formatted in India Standard Time (IST, UTC+05:30).
                </p>
              </header>

              {/* Form Grid */}
              <form className="mt-6 space-y-5" onSubmit={submitRequest}>
                <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
                  
                  {/* Work Date */}
                  <label className="block text-xs font-bold text-stone-700">
                    Work date <span className="text-[#C85D44]">*</span>
                    <input
                      type="date"
                      required
                      value={workDate}
                      onChange={(event) => setWorkDate(event.target.value)}
                      className={fieldClassName}
                    />
                  </label>

                  {/* Missing Punch Selector */}
                  <label className="block text-xs font-bold text-stone-700">
                    Missing punch type <span className="text-[#C85D44]">*</span>
                    <select
                      value={type}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value === 'MISSED_IN' || value === 'MISSED_OUT' || value === 'BOTH') {
                          setType(value);
                        }
                      }}
                      className={fieldClassName}
                    >
                      <option value="MISSED_IN">Missed check-in only</option>
                      <option value="MISSED_OUT">Missed check-out only</option>
                      <option value="BOTH">Both check-in and check-out</option>
                    </select>
                  </label>

                  {/* Claimed Check-in Time */}
                  {(type === 'MISSED_IN' || type === 'BOTH') && (
                    <label className="block text-xs font-bold text-stone-700">
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
                  {(type === 'MISSED_OUT' || type === 'BOTH') && (
                    <label className="block text-xs font-bold text-stone-700">
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

                  {/* Reason Textarea */}
                  <label className="block text-xs font-bold text-stone-700 sm:col-span-2">
                    Reason for correction <span className="text-[#C85D44]">*</span>
                    <textarea
                      required
                      rows={4}
                      maxLength={1000}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      placeholder="Explain why the punch was missed (e.g. biometric reader failure, client location visit, badge lost)..."
                      className={`${fieldClassName} resize-y leading-relaxed`}
                    />
                  </label>
                </div>

                {/* Error Banner */}
                {error && (
                  <p role="alert" className="rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] px-4 py-3 text-xs font-bold text-[#C85D44]">
                    {error}
                  </p>
                )}

                {/* Form Actions */}
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