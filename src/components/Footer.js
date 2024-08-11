import React from "react";
import "./Footer.css"; // Ensure this is correctly importing your styles
import { FaXTwitter, FaTelegram, FaEnvelope } from "react-icons/fa6"; // Ensure correct import statements

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>Vortex Labs © 2024. All rights reserved.</p>

        {/* Twitter Link */}
        <a
          href="https://x.com/vortexdapp"
          className="icon-link"
          aria-label="Twitter"
        >
          <FaXTwitter className="icon twitter" />
        </a>
        {/* Telegram Link */}
        <a
          href="https://t.me/vortexdapp"
          className="icon-link"
          aria-label="Telegram"
        >
          <FaTelegram className="icon telegram" />
        </a>
        {/* Email Link */}
        <a
          href="mailto:team@vortexdapp.com"
          className="icon-link"
          aria-label="Email"
        >
          <FaEnvelope className="icon mail" />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
