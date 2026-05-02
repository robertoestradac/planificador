'use client';
import { ConfirmDialog } from './confirm-dialog';
import { useConfirmStore } from '@/hooks/use-confirm';

export function ConfirmProvider() {
  const { isOpen, title, message, confirmText, cancelText, variant, onConfirm, onCancel, closeConfirm } = useConfirmStore();

  const handleConfirm = () => {
    onConfirm?.();
    closeConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    closeConfirm();
  };

  return (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleCancel();
      }}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      onConfirm={handleConfirm}
      onClose={handleCancel}
    />
  );
}
