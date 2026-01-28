'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // First fetch the config to get backend URL
    fetch('/api/config')
      .then(res => res.json())
      .then(config => {
        // Then fetch data from backend
        return fetch(`${config.backendUrl}/api/welcome`);
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
  }, []);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.errorTitle}>Error</h1>
          <p style={styles.error}>{error}</p>
          <p style={styles.hint}>Make sure the backend server is running on port 3001</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{content?.message}</h1>
        <p style={styles.description}>{content?.description}</p>
        
        {content?.features && (
          <div style={styles.featuresSection}>
            <h2 style={styles.featuresTitle}>Features:</h2>
            <ul style={styles.featuresList}>
              {content.features.map((feature, index) => (
                <li key={index} style={styles.featureItem}>{feature}</li>
              ))}
            </ul>
          </div>
        )}
        
        <p style={styles.timestamp}>Last updated: {content?.timestamp}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '48px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '16px',
    textAlign: 'center',
  },
  description: {
    fontSize: '1.125rem',
    color: '#4a5568',
    lineHeight: '1.75',
    marginBottom: '32px',
    textAlign: 'center',
  },
  featuresSection: {
    marginTop: '32px',
    marginBottom: '32px',
  },
  featuresTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '16px',
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  featureItem: {
    padding: '12px 16px',
    marginBottom: '8px',
    backgroundColor: '#f7fafc',
    borderRadius: '8px',
    borderLeft: '4px solid #667eea',
    color: '#2d3748',
  },
  timestamp: {
    fontSize: '0.875rem',
    color: '#a0aec0',
    textAlign: 'center',
    marginTop: '24px',
  },
  errorTitle: {
    fontSize: '2rem',
    color: '#e53e3e',
    marginBottom: '16px',
  },
  error: {
    color: '#e53e3e',
    marginBottom: '8px',
  },
  hint: {
    color: '#718096',
    fontSize: '0.875rem',
    fontStyle: 'italic',
  },
};
