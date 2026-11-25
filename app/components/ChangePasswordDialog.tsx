'use client';

import React, { useEffect, useRef, useState } from 'react';
import { changePassword } from '../store/auth/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

export default function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.passwordLoading);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    if (newPassword !== confirmation) {
      setError('New passwords do not match.');
      return;
    }

    setError(null);
    const result = await dispatch(changePassword({
      old_password: currentPassword,
      new_password: newPassword,
    }));
    if (!result.success) {
      setError(result.message);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmation('');
    setSuccess(result.message);
  };

  const labelClass = 'block text-sm font-bold text-stone-800 sm:text-base';
  const inputClass =
    'mt-2 block w-full rounded-2xl border-2 border-[#E5DDCE] bg-white px-4 py-3.5 text-base font-semibold text-stone-900 outline-none transition placeholder:font-medium placeholder:text-stone-400 hover:border-[#BCC7B4] focus:border-[#5D6953] focus:ring-4 focus:ring-[#5D6953]/15';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="change-password-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(560px,calc(100vw-2rem))] overflow-y-auto rounded-[32px] border border-[#ECE3D3] bg-[#FCFAF7] p-0 font-sans text-stone-800 antialiased shadow-[0_28px_80px_rgba(72,60,45,0.22)] backdrop:bg-stone-900/45 backdrop:backdrop-blur-xs"
    >
      {/* Top Accent Strip */}
      <div className="h-2 w-full bg-gradient-to-r from-[#4E5A45] via-[#68775C] to-[#C87961]" />

      {/* Dialog Header */}
      <div className="border-b border-[#E5DDCE] bg-gradient-to-r from-[#F7F3EB] to-[#F2EEE5] px-6 py-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#5D6953] text-white shadow-sm ring-1 ring-black/5">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" />
              </svg>
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#5D6953]">
                SECURITY &amp; CREDENTIALS
              </span>
              <h2 id="change-password-title" className="mt-0.5 text-2xl font-black text-stone-900 sm:text-3xl">
                Change password
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-stone-600 sm:text-base">
                Update your account password with a strong, secure passphrase.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close change password"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-stone-400 transition hover:bg-[#EFE9DF] hover:text-stone-800 disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </div>

      {success ? (
        <div className="space-y-6 p-6 sm:p-8">
          <div role="status" className="flex items-center gap-4 rounded-2xl border-2 border-[#D9E2D2] bg-[#F6F8F3] p-5 text-base font-bold text-[#46513F]">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5D6953] text-lg text-white">
              ✓
            </span>
            <span>{success}</span>
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#C87961] px-7 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5 p-6 sm:p-8">
          <label className={labelClass}>
            Current password <span className="text-[#C85D44]">*</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              autoFocus
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Enter current password"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            New password <span className="text-[#C85D44]">*</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Enter new password"
              className={inputClass}
            />
          </label>

          <label className={labelClass}>
            Confirm new password <span className="text-[#C85D44]">*</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Re-enter new password"
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="flex items-start gap-3 rounded-2xl border-2 border-[#F3D7CB] bg-[#FAEEE5] px-4 py-3.5 text-sm font-bold text-[#B24832] sm:text-base">
              <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C85D44] text-sm text-white">!</span>
              <span>{error}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#E5DDCE] pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#E5DDCE] bg-white px-6 py-3 text-sm font-bold text-stone-700 transition hover:border-[#707C65] hover:bg-[#F6F8F3] hover:text-[#5D6953] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#C87961] px-7 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#B86A54] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}