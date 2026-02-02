'use client';

import { headerStyles } from '../styles/header.styles';

export default function Header() {
  return (
    <header style={headerStyles.header}>
      <div style={headerStyles.container}>
        <div style={headerStyles.logoSection}>
          <div style={headerStyles.logo}>
            <span style={headerStyles.logoText}>HRSA</span>
          </div>
          <div style={headerStyles.divider}></div>
          <span style={headerStyles.appTitle}>Electronic Handbooks</span>
        </div>
        <div style={headerStyles.userSection}>
          <span style={headerStyles.helpLink}>Help</span>
        </div>
      </div>
    </header>
  );
}
