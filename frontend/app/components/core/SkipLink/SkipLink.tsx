'use client';

import { useState } from 'react';

export default function SkipLink() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: isVisible ? 'fixed' : 'absolute',
        left: isVisible ? '0' : '-9999px',
        top: '0',
        zIndex: 9999,
        padding: '8px 16px',
        backgroundColor: '#0a4462',
        color: '#fff',
        textDecoration: 'none',
        fontWeight: 'bold',
      }}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      Skip to main content
    </a>
  );
}
