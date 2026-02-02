'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const LayoutContext = createContext(null);

export function LayoutProvider({ children, initialUser = 'cabrahms' }) {
  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarPinned, setSidebarPinned] = useState(true);

  // User info
  const [user, setUser] = useState(initialUser);

  // Date/time display (client-side only to avoid hydration mismatch)
  const [displayDateTime, setDisplayDateTime] = useState('');
  const [lastLogin, setLastLogin] = useState('');

  useEffect(() => {
    let isMounted = true;
    const formatDate = () => {
      const d = new Date();
      const ord = (n) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const hours = d.getHours() % 12 || 12;
      const ampm = d.getHours() < 12 ? 'A.M.' : 'P.M.';
      const mins = d.getMinutes().toString().padStart(2, '0');
      const secs = d.getSeconds().toString().padStart(2, '0');
      return `${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()]} ${ord(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()} ${hours}:${mins}:${secs} ${ampm}`;
    };
    const update = () => {
      if (isMounted) setDisplayDateTime(formatDate());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const yy = String(d.getFullYear()).slice(-2);
    const h = d.getHours() % 12 || 12;
    const ampm = d.getHours() < 12 ? 'AM' : 'PM';
    setLastLogin(`${mm}/${dd}/${yy} ${h}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${ampm} ET`);
  }, []);

  const value = {
    // Sidebar
    sidebarOpen,
    setSidebarOpen,
    sidebarPinned,
    setSidebarPinned,
    toggleSidebar: () => setSidebarOpen((o) => !o),
    toggleSidebarPin: () => setSidebarPinned((p) => !p),

    // User
    user,
    setUser,

    // Date/time
    displayDateTime,
    lastLogin,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}

export default LayoutContext;
