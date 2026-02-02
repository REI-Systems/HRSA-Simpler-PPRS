'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { loginStyles } from '../styles/login.styles';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      // Get backend URL from environment variable
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      // Call login API
      const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Redirect to home page
        router.push('/');
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
