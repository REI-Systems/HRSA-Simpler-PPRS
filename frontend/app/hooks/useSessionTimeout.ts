'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser, clearSession } from '../services/authService';
import { getBackendUrl } from '../services/api';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const WARNING_TIME_MS = 2 * 60 * 1000; // 2 minutes before timeout
const CHECK_INTERVAL_MS = 1000; // Check every second

export function useSessionTimeout() {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);
  const router = useRouter();
  const lastActivityRef = useRef<number>(Date.now());
  const warningShownRef = useRef<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (warningShownRef.current) {
      // If warning was shown, hide it when user becomes active
      setShowWarning(false);
      warningShownRef.current = false;
    }
  }, []);

  // Refresh session on backend
  const refreshSession = useCallback(async () => {
    try {
      const base = await getBackendUrl();
      const response = await fetch(`${base}/api/auth/keepalive`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        lastActivityRef.current = Date.now();
        setShowWarning(false);
        warningShownRef.current = false;
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Handle logout
  const handleLogout = useCallback(async () => {
    try {
      const base = await getBackendUrl();
      await fetch(`${base}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore errors
    }
    clearSession();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sessionExpiredMessage', 'Your session has expired due to inactivity.');
      window.location.href = '/login';
    }
  }, []);

  // Handle continue session
  const handleContinue = useCallback(async () => {
    const success = await refreshSession();
    if (!success) {
      // If refresh fails, logout
      handleLogout();
    }
  }, [refreshSession, handleLogout]);

  useEffect(() => {
    // Only track timeout if user is logged in
    const user = getStoredUser();
    if (!user) {
      return;
    }

    // Initialize activity timestamp on mount
    lastActivityRef.current = Date.now();

    // Set up activity listeners for DOM events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => updateActivity();

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Listen for API activity events (API calls also count as activity)
    const handleApiActivity = () => updateActivity();
    window.addEventListener('apiActivity', handleApiActivity);

    // Check session timeout periodically
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const timeUntilTimeout = SESSION_TIMEOUT_MS - timeSinceActivity;
      const timeUntilWarning = WARNING_TIME_MS - timeSinceActivity;

      if (timeSinceActivity >= SESSION_TIMEOUT_MS) {
        // Session expired - logout
        clearInterval(intervalRef.current!);
        handleLogout();
      } else if (timeUntilWarning <= 0 && !warningShownRef.current) {
        // Show warning 2 minutes before timeout
        setShowWarning(true);
        warningShownRef.current = true;
        const remainingSeconds = Math.ceil(timeUntilTimeout / 1000);
        setSecondsRemaining(Math.max(0, remainingSeconds));
      } else if (warningShownRef.current) {
        // Update countdown
        const remainingSeconds = Math.ceil(timeUntilTimeout / 1000);
        setSecondsRemaining(Math.max(0, remainingSeconds));
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      window.removeEventListener('apiActivity', handleApiActivity);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateActivity, handleLogout]);

  return {
    showWarning,
    secondsRemaining,
    handleContinue,
    handleLogout,
  };
}
