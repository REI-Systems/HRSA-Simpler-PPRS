/**
 * Header styles - HRSA EHBs inspired
 */
import type { CSSProperties } from 'react';

export const headerStyles: Record<string, CSSProperties> = {
  header: {
    backgroundColor: '#193d58',
    color: '#ffffff',
    padding: '0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '12px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  divider: {
    width: '1px',
    height: '30px',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  appTitle: {
    fontSize: '1.1rem',
    fontWeight: 500,
    color: '#ffffff',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  helpLink: {
    color: '#ffffff',
    textDecoration: 'none',
    fontSize: '0.95rem',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
  },
};
