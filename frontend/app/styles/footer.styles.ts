/**
 * Footer styles - HRSA EHBs inspired
 */
import type { CSSProperties } from 'react';

export const footerStyles: Record<string, CSSProperties> = {
  footer: {
    backgroundColor: '#414141',
    borderTop: '3px solid #193d58',
    padding: '24px 0',
    marginTop: 'auto',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '32px',
  },
  sectionLeft: {
    flex: '1',
    minWidth: '300px',
    textAlign: 'left',
  },
  sectionRight: {
    flex: '1',
    minWidth: '300px',
    textAlign: 'right',
  },
  text: {
    fontSize: '0.875rem',
    color: '#ffffff',
    margin: '8px 0',
    lineHeight: 1.6,
    textAlign: 'left',
  },
  textRight: {
    fontSize: '0.875rem',
    color: '#ffffff',
    margin: '8px 0',
    lineHeight: 1.6,
    textAlign: 'right',
  },
  link: {
    color: '#ffffff',
    textDecoration: 'underline',
    marginLeft: '4px',
    marginRight: '4px',
  },
};
