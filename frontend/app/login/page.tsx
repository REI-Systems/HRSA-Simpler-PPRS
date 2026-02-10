'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutProvider } from '../contexts/LayoutContext';
import Header from '../components/core/Header/Header';
import Footer from '../components/core/Footer';
import { loginStyles } from '../styles/login.styles';

const DEFAULT_BACKEND_URL = 'http://localhost:3001';

function getLoginBackendUrl(): string {
  const raw = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL;
  const envUrl = (raw && String(raw).trim()) || '';
  if (!envUrl) return DEFAULT_BACKEND_URL;
  if (typeof window !== 'undefined') {
    try {
      const envOrigin = new URL(envUrl).origin;
      if (envOrigin === window.location.origin) return DEFAULT_BACKEND_URL;
    } catch {
      return DEFAULT_BACKEND_URL;
    }
  }
  return envUrl;
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const backendUrl = useMemo(getLoginBackendUrl, []);

  // Check for session expired message on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const expiredMessage = sessionStorage.getItem('sessionExpiredMessage');
        if (expiredMessage) {
          setError(expiredMessage);
          sessionStorage.removeItem('sessionExpiredMessage');
        }
      } catch {
        // Ignore sessionStorage errors
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const loginUrl = `${backendUrl.replace(/\/$/, '')}/api/auth/login`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      let data: { success?: boolean; user?: unknown; message?: string };
      try {
        data = await response.json();
      } catch {
        setError('Server is not responding. Please ensure the backend is running.');
        setLoading(false);
        return;
      }

      if (response.ok && data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/');
      } else if (response.status === 401 || response.status === 400) {
        setError(data.message || 'Invalid username or password');
      } else {
        setError(data.message || 'Server error. Please try again later.');
      }
    } catch {
      setError('Unable to connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutProvider initialUser="">
      <div style={loginStyles.pageContainer}>
        <Header
          userLinks={[{ id: 'support', label: 'Help', href: '#support', hasDropdown: true }]}
          navItems={[]}
          showDateTime={false}
        />

        <main style={loginStyles.mainContent}>
          <div style={loginStyles.loginCard}>
            <div style={loginStyles.titleContainer}>
              <svg
                style={loginStyles.lockIcon}
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <h1 style={loginStyles.title}>Log In</h1>
            </div>
            {error && (
              <div style={loginStyles.error}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={loginStyles.formGroup}>
                <label htmlFor="username" style={loginStyles.label}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={loginStyles.input}
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>

              <div style={loginStyles.formGroup}>
                <label htmlFor="password" style={loginStyles.label}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={loginStyles.input}
                  placeholder="Enter your password"
                  disabled={loading}
                />
              </div>

              <div style={loginStyles.buttonContainer}>
                <button
                  type="submit"
                  style={loginStyles.button}
                  disabled={loading}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </form>

            <div style={loginStyles.links}>
              <a href="#" style={loginStyles.link}>Forgot Password?</a>
              <a href="#" style={loginStyles.link}>Request New Account</a>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <p style={{ marginTop: 16, fontSize: 12, color: '#666' }} data-testid="login-backend-url">
                Backend: {backendUrl}
              </p>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </LayoutProvider>
  );
}
