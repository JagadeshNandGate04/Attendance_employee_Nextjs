'use client';

import ChangePasswordDialog from './ChangePasswordDialog';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  return open ? <ChangePasswordDialog onClose={onClose} /> : null;
}
