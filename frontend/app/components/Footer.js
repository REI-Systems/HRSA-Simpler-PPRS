'use client';

import { footerStyles } from '../styles/footer.styles';

export default function Footer() {
  return (
    <footer style={footerStyles.footer}>
      <div style={footerStyles.container}>
        <div style={footerStyles.sectionLeft}>
          <p style={footerStyles.text}>
            <strong>Contact Us:</strong> 877-464-4772
          </p>
          <p style={footerStyles.text}>
            Hours: 7:00 a.m. to 8:00 p.m. Eastern Time (ET)<br />
            Monday through Friday<br />
            Closed All Federal Holidays
          </p>
        </div>
        <div style={footerStyles.sectionRight}>
          <p style={footerStyles.textRight}>
            © 2026 REI Systems. All rights reserved.
          </p>
          <p style={footerStyles.textRight}>
            <a href="#" style={footerStyles.link}>Privacy Policy</a> | 
            <a href="#" style={footerStyles.link}> Terms of Use</a> | 
            <a href="#" style={footerStyles.link}> Accessibility</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
