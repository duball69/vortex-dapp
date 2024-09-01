import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Header.css";

function Header2({ connectWallet, isConnected, chainId }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  const CHAIN_NAMES = {
    56: "BSC",
    42161: "Arbitrum",
    8453: "Base",
    11155111: "Sepolia",
    81457: "Blast",
    10: "Optimism",
    42220: "Celo",
  };

  const chainName = CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;

  return (
    <header>
      <div className="header-content">
        <div className="div-logo">
          <Link to="https://vortexdapp.com">
            <img
              src="https://i.imgur.com/XDHnW0R.png"
              alt="VortexLogo png"
              className="logo"
            />
          </Link>
        </div>
        <div className="div-burger">
          {/* Burger Icon */}
          <button className="burger-menu" onClick={toggleMenu}>
            &#9776;
          </button>

          {/* Navigation Menu */}
          <nav className={`menu ${isOpen ? "open" : ""}`}>
            <a
              href="https://vortexdapp.com"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              Home
            </a>
            <Link to="/factory" onClick={() => setIsOpen(false)}>
              Launch
            </Link>
            <Link to="/staking" onClick={() => setIsOpen(false)}>
              Stake
            </Link>
            <Link to="/tokens" onClick={() => setIsOpen(false)}>
              Trade
            </Link>
            <a
              href="https://docs.vortexdapp.com"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
            >
              Docs
            </a>
          </nav>
        </div>
        <div className="div-button">
          <button className="Launch" onClick={() => navigate("/factory")}>
            Launch
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header2;
