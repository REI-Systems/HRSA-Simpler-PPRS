'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ConfirmModal.module.css';

export default function ConfirmModal({
  open,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  confirmDisabled = false,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onCancel?.();
  };

  return createPortal(
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className={styles.dialog}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div id="confirm-modal-title" className={styles.header}>
          {title}
        </div>
        <div id="confirm-modal-desc" className={styles.body}>
          {message}
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${confirmVariant === 'danger' ? styles.confirmBtnDanger : ''}`}
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
