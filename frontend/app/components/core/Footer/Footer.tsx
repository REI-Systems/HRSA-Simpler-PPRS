'use client';

import { useLayout } from '../../../contexts/LayoutContext';
import styles from './Footer.module.css';

interface FooterLink {
  id: string;
  label: string;
  href: string;
}

interface VersionInfo {
  product: string;
  platform: string;
  build: string;
}

const DEFAULT_LINKS: FooterLink[] = [
  { id: 'acceptable-use', label: 'Acceptable Use Policy', href: '#acceptable-use' },
  { id: 'accessibility', label: 'Accessibility', href: '#accessibility' },
  { id: 'sitemap', label: 'Site Map (Coming Soon)', href: '#sitemap' },
  { id: 'viewers', label: 'Viewers And Players', href: '#viewers' },
  { id: 'contact', label: 'Contact Us', href: '#contact' },
];

const DEFAULT_SECONDARY_LINKS: FooterLink[] = [
  { id: 'vulnerability', label: 'Vulnerability Disclosure Policy', href: '#vulnerability' },
];

const DEFAULT_LOGO_URL = '/images/hrsa-logo.png';

export interface FooterProps {
  links?: FooterLink[];
  secondaryLinks?: FooterLink[];
  versionInfo?: VersionInfo;
  logoText?: string;
  logoUrl?: string;
}

export default function Footer({
  links = DEFAULT_LINKS,
  secondaryLinks = DEFAULT_SECONDARY_LINKS,
  versionInfo = {
    product: 'SV',
    platform: '4.19.40.0',
    build: '9.1.0.38',
  },
  logoText = 'HRSA',
  logoUrl = DEFAULT_LOGO_URL,
}: FooterProps) {
  const { lastLogin } = useLayout();

  return (
    <footer className={styles.footer} role="contentinfo">
      <div className={styles.footerInner}>
        <div className={styles.footerLeft}>
          <div className={styles.footerLinks}>
            {links.map((link, index) => (
              <span key={link.id}>
                <a href={link.href}>{link.label}</a>
                {index < links.length - 1 && <span className={styles.footerPipe}>|</span>}
              </span>
            ))}
          </div>
          {secondaryLinks.length > 0 && (
            <div className={styles.footerLinkRow2}>
              {secondaryLinks.map((link) => (
                <a key={link.id} href={link.href}>{link.label}</a>
              ))}
            </div>
          )}
          <div className={styles.footerLastLogin} suppressHydrationWarning>Last Login: {lastLogin}</div>
        </div>
        <div className={styles.footerRight}>
          <div className={styles.footerVersion}>
            Product: {versionInfo.product} | Platform #: {versionInfo.platform} | Build #: {versionInfo.build}
          </div>
          <div className={styles.footerLogo}>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={logoText}
                className={styles.footerLogoImg}
              />
            ) : (
              logoText
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
