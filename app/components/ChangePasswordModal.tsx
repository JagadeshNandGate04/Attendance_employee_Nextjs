'use client';

import React, { useEffect, useState } from 'react';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  // Return { success, message }; wire this to the change-password API
  onSubmit?: (data: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; message?: string }>;
}

const inputBase =
  'w-full h-11 sm:h-12 rounded-full bg-white hover:bg-[#FAF7F0] border border-[#ECE3D3] focus:border-[#5D6953] focus:ring-2 focus:ring-[#5D6953]/20 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all shadow-xs pl-12 pr-12';

const LOCK_PATH =
  'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z';

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-stone-700" htmlFor={id}>
        {label}
      </label>
      <div className="relative flex items-center">
        <svg className="absolute left-4 w-5 h-5 text-[#707C65] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={LOCK_PATH} />
        </svg>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className={inputBase}
        />
        <button
          type="button"
          aria-label="Toggle password visibility"
          onClick={() => setShow((s) => !s)}
          className="absolute right-4 text-stone-400 hover:text-[#5D6953] transition-colors"
        >
          {show ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordModal(props: ChangePasswordModalProps) {
  // Inner form unmounts on close, which resets its state
  return props.open ? <ChangePasswordDialog {...props} /> : null;
}

function ChangePasswordDialog({ onClose, onSubmit }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from the current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }
    setStatus('loading');
    const result = onSubmit
      ? await onSubmit({ currentPassword, newPassword })
      : { success: true };
    if (result.success) {
      setStatus('success');
      setTimeout(onClose, 1500);
    } else {
      setStatus('idle');
      setError(result.message || 'Unable to change password.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/45 backdrop-blur-xs"
      style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        className="relative w-full max-w-md rounded-[2rem] bg-[#FCFAF7] text-stone-800 p-6 sm:p-8 space-y-6 shadow-[0_28px_80px_rgba(72,60,45,0.22)] border border-[#ECE3D3]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#F7F3EB] hover:bg-[#EFE9DF] text-stone-500 hover:text-stone-800 flex items-center justify-center transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div>
          <div className="w-12 h-12 rounded-2xl bg-[#F6F8F3] border border-[#D9E2D2] text-[#5D6953] flex items-center justify-center mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={LOCK_PATH} />
            </svg>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#707C65]">
            SECURITY &amp; CREDENTIALS
          </span>
          <h2 id="change-password-title" className="mt-0.5 text-2xl font-black tracking-tight text-stone-900">
            Change Password
          </h2>
          <p className="mt-1.5 text-xs font-medium text-stone-500 leading-relaxed">
            Enter your current password and choose a new one.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <PasswordField id="current-password" label="Current Password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PasswordField id="new-password" label="New Password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PasswordField id="confirm-password" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />

          {error && (
            <p role="alert" className="rounded-xl border border-[#F3D7CB] bg-[#FAEEE5] px-3.5 py-2.5 text-xs font-bold text-[#C85D44]">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-full bg-white hover:bg-[#F6F8F3] text-xs font-bold text-stone-600 hover:text-[#5D6953] transition border border-[#ECE3D3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status !== 'idle'}
              className={`h-12 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-xs transition-all active:scale-[0.99] ${
                status === 'success' ? 'bg-[#707C65]' : 'bg-[#5D6953] hover:bg-[#4D5844]'
              }`}
            >
              {status === 'loading' ? 'Updating...' : status === 'success' ? 'Password Updated!' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
