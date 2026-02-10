'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLayout } from '../../../contexts/LayoutContext';
import styles from './WelcomePageContent.module.css';

const GETTING_STARTED_STEPS = [
  { id: '1', numClass: styles.stepNumS1, title: 'Initiate a Plan', desc: 'Select plan type, bureau/division, period, and assign a team.' },
  { id: '2', numClass: styles.stepNumS2, title: 'Complete the Coversheet', desc: 'Add plan description, upload supporting documents and attachments.' },
  { id: '3', numClass: styles.stepNumS3, title: 'Select Entities', desc: 'Choose the entities to include in your site visit plan.' },
  { id: '4', numClass: styles.stepNumS4, title: 'Identify Site Visits', desc: 'Finalize and schedule site visits for selected entities.' },
];

/**
 * Hook to animate a number from 0 to target value on mount.
 * @param {number} target - Target value to count up to
 * @param {number} duration - Animation duration in milliseconds (default: 1500)
 * @returns {number} Current animated value
 */
function useCountUp(target, duration = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;
    const endValue = target;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out: fast at beginning, slower towards the end)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (endValue - startValue) * easeOut);

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    const rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);

  return count;
}

function getTimeBasedGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatGreetingDate() {
  const d = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatGreetingTime() {
  const d = new Date();
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = d.getHours() < 12 ? 'A.M.' : 'P.M.';
  return `${h}:${m} ${ampm} ET`;
}

function getStatusBadgeClass(status) {
  const s = (status || '').toLowerCase();
  if (s === 'complete') return styles.statusBadgeComplete;
  if (s === 'canceled') return styles.statusBadgeCanceled;
  if (s === 'not started') return styles.statusBadgeNotStarted;
  return styles.statusBadgeProgress; // In Progress, Not Complete, etc.
}

export default function WelcomePageContent({ plans = [], welcomeMessage = null, loading = false, error = null }) {
  const router = useRouter();
  const { user, lastLogin } = useLayout();

  const greeting = getTimeBasedGreeting();
  const greetingTitle = `${greeting}, ${user || 'User'}`;
  const greetingBody = welcomeMessage?.message || 'Welcome to the HRSA Site Visit Plan Management System. Here\'s an overview of your current plans and activity.';

  const stats = useMemo(() => {
    const total = plans.length;
    let completed = 0;
    let inProgress = 0;
    let canceled = 0;
    let needsAttention = 0;
    plans.forEach((p) => {
      const s = (p.status || '').toLowerCase();
      if (s === 'complete') completed += 1;
      else if (s === 'canceled') canceled += 1;
      else if (s === 'not started') {}
      else inProgress += 1; // In Progress, Not Complete
      if (p.needs_attention && String(p.needs_attention).trim().toLowerCase() === 'yes') needsAttention += 1;
    });
    return { total, completed, inProgress, canceled, needsAttention };
  }, [plans]);

  // Animated counts for status cards
  const animatedTotal = useCountUp(stats.total);
  const animatedCompleted = useCountUp(stats.completed);
  const animatedInProgress = useCountUp(stats.inProgress);
  const animatedCanceled = useCountUp(stats.canceled);
  const animatedNeedsAttention = useCountUp(stats.needsAttention);

  const recentPlans = useMemo(() => {
    const copy = [...plans];
    copy.sort((a, b) => {
      const tA = a.last_accessed_at || '';
      const tB = b.last_accessed_at || '';
      if (tB !== tA) return tB.localeCompare(tA);
      const aId = parseInt(a.id, 10) || 0;
      const bId = parseInt(b.id, 10) || 0;
      return bId - aId;
    });
    return copy.slice(0, 10);
  }, [plans]);

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorWrap}>
        <p className={styles.error}>Error: {error}. Make sure the backend is running.</p>
      </div>
    );
  }

  return (
    <>
      <section className={styles.greetingSection}>
        <div className={styles.greetingLeft}>
          <h1>
            <i className="bi bi-hand-wave" style={{ color: '#e87722', marginRight: '4px' }} aria-hidden />
            {greetingTitle}
          </h1>
          <p>{greetingBody}</p>
        </div>
        <div className={styles.greetingRight}>
          <div className={styles.greetingDate} suppressHydrationWarning>{formatGreetingDate()}</div>
          <div className={styles.greetingTime} suppressHydrationWarning>{formatGreetingTime()}</div>
          <div className={styles.greetingLogin} suppressHydrationWarning>Last login: {lastLogin}</div>
        </div>
      </section>

      <div className={styles.statusRow}>
        <Link href="/svp" className={styles.statusCard} aria-label="View all plans">
          <div className={styles.statusNumber}>{animatedTotal}</div>
          <div className={styles.statusLabel}>Total Plans</div>
        </Link>
        <Link href="/svp?status=Complete" className={styles.statusCard} aria-label="View completed plans">
          <div className={styles.statusNumber}>{animatedCompleted}</div>
          <div className={styles.statusLabel}>Completed</div>
        </Link>
        <Link href="/svp?status=In Progress" className={styles.statusCard} aria-label="View in-progress plans">
          <div className={styles.statusNumber}>{animatedInProgress}</div>
          <div className={styles.statusLabel}>In Progress</div>
        </Link>
        <Link href="/svp?status=Canceled" className={styles.statusCard} aria-label="View canceled plans">
          <div className={styles.statusNumber}>{animatedCanceled}</div>
          <div className={styles.statusLabel}>Canceled</div>
        </Link>
        <Link href="/svp?needsAttention=true" className={styles.statusCard} aria-label="View plans needing attention">
          <div className={styles.statusNumber}>{animatedNeedsAttention}</div>
          <div className={styles.statusLabel}>Needs Attention</div>
        </Link>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.panel}>
          <div className={styles.panelTitle}>
            Recent Plans
            <Link href="/svp" className={styles.panelTitleLink}>View All Plans <i className="bi bi-arrow-right" aria-hidden /></Link>
          </div>
          <div className={styles.recentTableWrap}>
          <table className={styles.recentTable}>
            <thead>
              <tr>
                <th>Plan Code</th>
                <th>Plan Name</th>
                <th>Plan For</th>
                <th>Period</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPlans.length === 0 ? (
                <tr>
                  <td colSpan={5}>No plans yet.</td>
                </tr>
              ) : (
                recentPlans.map((plan) => (
                  <tr key={plan.id}>
                    <td>
                      <Link href={`/svp/status/${encodeURIComponent(plan.id)}`} className={styles.planCode}>
                        {plan.plan_code || `PSV-${String(plan.id).padStart(6, '0')}`}
                      </Link>
                    </td>
                    <td>{plan.plan_name || '—'}</td>
                    <td>{plan.plan_for || '—'}</td>
                    <td>{plan.plan_period || '—'}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${getStatusBadgeClass(plan.status)}`}>
                        {plan.status || 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        <div className={styles.panel}>
          <div className={styles.panelTitle}>Getting Started</div>
          <div className={styles.gettingStartedList}>
            {GETTING_STARTED_STEPS.map((step) => (
              <div key={step.id} className={styles.stepItem}>
                <div className={`${styles.stepNum} ${step.numClass}`}>{step.id}</div>
                <div className={styles.stepText}>
                  <h4>{step.title}</h4>
                  <p>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => router.push('/svp/initiate')}
        >
          <div className={`${styles.iconWrap} ${styles.iconWrapNavy}`}>
            <i className="bi bi-plus-lg" aria-hidden />
          </div>
          <div className={styles.actionBtnText}>
            <h4>Create New Plan</h4>
            <p>Initiate a new site visit plan</p>
          </div>
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={() => router.push('/svp')}
        >
          <div className={`${styles.iconWrap} ${styles.iconWrapOrange}`}>
            <i className="bi bi-search" aria-hidden />
          </div>
          <div className={styles.actionBtnText}>
            <h4>Search Plans</h4>
            <p>Find plans by code, name, or team</p>
          </div>
        </button>
        <a href="#help" className={styles.actionBtn}>
          <div className={`${styles.iconWrap} ${styles.iconWrapTeal}`}>
            <i className="bi bi-question-circle" aria-hidden />
          </div>
          <div className={styles.actionBtnText}>
            <h4>Help & Support</h4>
            <p>Documentation and contact info</p>
          </div>
        </a>
      </div>
    </>
  );
}
