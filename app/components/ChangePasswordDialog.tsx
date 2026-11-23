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

  const inputClass =
    'mt-1.5 block w-full rounded-2xl border border-[#ECE3D3] bg-white px-4 py-2.5 text-xs font-semibold text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-[#5D6953] focus:ring-2 focus:ring-[#5D6953]/20';

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="change-password-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(480px,calc(100vw-2rem))] overflow-y-auto rounded-[32px] border border-[#ECE3D3] bg-[#FCFAF7] p-0 font-sans text-stone-800 antialiased shadow-[0_28px_80px_rgba(72,60,45,0.22)] backdrop:bg-stone-900/45 backdrop:backdrop-blur-xs"
    >
      {/* Top Accent Strip in Deep Forest Olive */}
      <div className="h-2 w-full bg-[#5D6953]" />

      {/* Dialog Header */}
      <div className="border-b border-[#ECE3D3] bg-[#F7F3EB] px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#707C65]">
              SECURITY &amp; CREDENTIALS
            </span>
            <h2 id="change-password-title" className="mt-0.5 text-xl font-black text-stone-900 sm:text-2xl">
              Change password
            </h2>
            <p className="text-xs font-medium text-stone-500">
              Update your account password with a strong, secure passphrase.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close change password"
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-[#EFE9DF] hover:text-stone-800 transition disabled:opacity-50"
          >
            ✕
          </button>
        </div>
      </div>

      {success ? (
        <div className="space-y-5 p-6 sm:p-7">
          <div role="status" className="flex items-center gap-3 rounded-2xl border border-[#D9E2D2] bg-[#F6F8F3] p-4 text-xs font-bold text-[#5D6953]">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5D6953] text-white text-xs">
              ✓
            </span>
            <span>{success}</span>
          </div>
          <div className="text-right">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#5D6953] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#4D5844] active:scale-95"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 p-6 sm:p-7">
          <label className="block text-xs font-bold text-stone-700">
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

          <label className="block text-xs font-bold text-stone-700">
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

          <label className="block text-xs font-bold text-stone-700">
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
            <p role="alert" className="rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] px-3.5 py-2.5 text-xs font-bold text-[#C85D44]">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#ECE3D3] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[#ECE3D3] bg-white px-4 py-2 text-xs font-bold text-stone-600 transition hover:bg-[#F6F8F3] hover:text-[#5D6953] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#5D6953] px-5 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#4D5844] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}