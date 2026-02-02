/**
 * Styles for the home page
 */

export const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#e8eef3',
  },
  container: {
    flex: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '6px',
    padding: '48px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #d4d7d9',
    borderBottom: '3px solid #193d58',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: '24px',
    textAlign: 'center',
  },
  message: {
    fontSize: '1.5rem',
    color: '#4a5568',
    lineHeight: '1.75',
    marginBottom: '32px',
    textAlign: 'center',
    fontWeight: '500',
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
  logoutButton: {
    marginTop: '24px',
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    color: '#ffffff',
    backgroundColor: '#193d58',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
};
