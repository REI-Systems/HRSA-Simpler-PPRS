'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from './components/Header';
import Footer from './components/Footer';
import { styles } from './styles/page.styles';

export default function Home() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/login');
      return;
    }

    // Fetch config to get backend URL based on environment
    fetch('/config.json')
      .then(res => res.json())
      .then(config => {
        const activeEnv = config.activeEnvironment;
        const backendUrl = config.environments[activeEnv].backendUrl;
        
        // Fetch data from backend
        return fetch(`${backendUrl}/api/welcome`);
      })
      .then(res => res.json())
      .then(data => {
        setContent(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div style={styles.pageContainer}>
        <Header />
        <div style={styles.container}>
          <div style={styles.card}>
            <p>Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.pageContainer}>
        <Header />
        <div style={styles.container}>
          <div style={styles.card}>
            <h1 style={styles.errorTitle}>Error</h1>
            <p style={styles.error}>{error}</p>
            <p style={styles.hint}>Make sure the backend server is running on port 3001</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <Header />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>{content?.title}</h1>
          <p style={styles.message}>{content?.message}</p>
          <p style={styles.timestamp}>Last updated: {content?.timestamp}</p>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
