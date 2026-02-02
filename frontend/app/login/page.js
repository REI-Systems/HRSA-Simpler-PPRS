'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutProvider } from '../contexts/LayoutContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { loginStyles } from '../styles/login.styles';

const DEFAULT_BACKEND_URL = 'http://localhost:3001';

/**
 * Resolve backend URL for login. Ensures we never point at the frontend (same origin).
 * - Empty or missing env → use default (localhost:3001)
 * - In browser: if env URL is same as window origin → use default so request goes to backend, not Next.js
 */
function getLoginBackendUrl() {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simple validation
    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      const loginUrl = `${backendUrl.replace(/\/$/, '')}/api/auth/login`;
      if (process.env.NODE_ENV === 'development') {
        console.info('[Login] POST', loginUrl);
      }

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        // Server returned non-JSON (e.g. HTML error page when backend is down)
        setError('Server is not responding. Please ensure the backend is running.');
        setLoading(false);
        return;
      }

      if (response.ok && data.success) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect to home page
        router.push('/');
      } else if (response.status === 401 || response.status === 400) {
        // Only show "invalid credentials" for actual auth/validation responses
        setError(data.message || 'Invalid username or password');
      } else {
        // 503, 502, 500, etc. = server/database issue, not wrong password
        setError(data.message || 'Server error. Please try again later.');
      }
    } catch (err) {
      // Network error: backend unreachable, CORS, etc.
      setError('Unable to connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutProvider initialUser="">
      <div style={loginStyles.pageContainer}>
        <Header />

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
