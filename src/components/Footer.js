// Footer.js
import React from 'react';
import './Footer.css'; // Assuming you create a separate CSS file for the footer styles

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>Vortex © 2024. All rights reserved.</p>
        <p>Contact us: <a href="mailto:team@vortexdapp.com">team@vortexdapp.com</a></p>
        <a href="https://x.com/vortexdapp" className="icon-link">
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/cc/X_icon.svg" alt="X icon" className="x-icon" />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
