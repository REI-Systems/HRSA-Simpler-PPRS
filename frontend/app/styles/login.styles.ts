/**
 * Login page styles - HRSA EHBs inspired
 */
import type { CSSProperties } from 'react';

export const loginStyles: Record<string, CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#e8eef3',
  },
  mainContent: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    padding: '40px',
    maxWidth: '450px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #d4d7d9',
    borderBottom: '3px solid #193d58',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px',
  },
  lockIcon: {
    color: '#193d58',
    flexShrink: 0,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 600,
    color: '#193d58',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#666666',
    marginBottom: '32px',
    textAlign: 'left',
  },
  formGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '0.95rem',
    fontWeight: 500,
    color: '#333333',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '1rem',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  inputFocus: {
    outline: '3px solid #193d58',
    outlineOffset: '2px',
    borderColor: '#193d58',
  },
  buttonContainer: {
    marginTop: '32px',
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    backgroundColor: '#193d58',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  buttonHover: {
    backgroundColor: '#0f2838',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '12px 16px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '0.9rem',
    border: '1px solid #f5c6cb',
  },
  links: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '0.875rem',
  },
  link: {
    color: '#193d58',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    marginTop: '8px',
    minHeight: '44px', // Touch target size for 508 compliance
    padding: '8px 0',
  },
};

// Mobile responsive styles
export const loginStylesMobile = {
  '@media (max-width: 768px)': {
    pageContainer: {
      minHeight: '100vh',
    },
    mainContent: {
      padding: '20px 12px',
      alignItems: 'flex-start',
      paddingTop: '40px',
    },
    loginCard: {
      maxWidth: '100%',
      padding: '32px 24px',
    },
    title: {
      fontSize: '1.5rem',
    },
    input: {
      fontSize: '16px', // Prevents zoom on iOS
      minHeight: '44px', // Touch target size
    },
    button: {
      minHeight: '44px', // Touch target size
      fontSize: '16px',
    },
  },
  '@media (max-width: 480px)': {
    loginCard: {
      padding: '24px 16px',
      borderRadius: '0',
      borderLeft: 'none',
      borderRight: 'none',
    },
    title: {
      fontSize: '1.25rem',
    },
  },
};
