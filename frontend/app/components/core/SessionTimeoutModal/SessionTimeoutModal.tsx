'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './SessionTimeoutModal.module.css';

export interface SessionTimeoutModalProps {
  open: boolean;
  secondsRemaining: number;
  onContinue: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutModal({
  open,
  secondsRemaining,
  onContinue,
  onLogout,
}: SessionTimeoutModalProps) {
  const [displaySeconds, setDisplaySeconds] = useState(secondsRemaining);

  useEffect(() => {
    setDisplaySeconds(secondsRemaining);
  }, [secondsRemaining]);

  useEffect(() => {
    if (!open) return;
    
    const interval = setInterval(() => {
      setDisplaySeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, onLogout]);

  if (!open || typeof document === 'undefined') return null;

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
    >
      <div className={styles.dialog}>
        <div id="session-timeout-title" className={styles.header}>
          <span className={styles.icon}>⏱️</span>
          Session Timeout Warning
        </div>
        <div id="session-timeout-desc" className={styles.body}>
          <p className={styles.message}>
            Your session will expire in <strong className={styles.timer}>{timeDisplay}</strong> due to inactivity.
          </p>
          <p className={styles.subMessage}>
            Would you like to continue your session?
          </p>
        </div>
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.continueBtn}
            onClick={onContinue}
          >
            Continue Session
          </button>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={onLogout}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
