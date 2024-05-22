import React, { useState } from 'react';
import './Header.css';
import { Link } from 'react-router-dom';



function Header({ connectWallet, isConnected, chainId }) {

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    const CHAIN_NAMES = {
        "56": "BSC",
        "42161": "Arbitrum",
        "8453": "Base",
        "11155111": "Sepolia"
    };

    const chainName = CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;



  return (
    <header>
      <div className="header-content">
        
                <Link to="/">
                    <img src="https://i.imgur.com/aDk96bW.png" alt="VortexLogo png" className="logo" />
                </Link>

                {/* Burger Icon */}
                <button className="burger-menu" onClick={toggleMenu}>
                    &#9776;
                </button>

                {/* Navigation Menu */}
                <nav className={`menu ${isOpen ? "open" : ""}`}>
                    <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
                    <Link to="/factory" onClick={() => setIsOpen(false)}>Launch</Link>
                    <Link to="/staking" onClick={() => setIsOpen(false)}>Stake</Link>
                    <a href="https://www.gitbook.com" target="_blank" rel="noopener noreferrer" onClick={() => setIsOpen(false)}>Docs</a>

                    </nav>
<div>                <button onClick={connectWallet}>Connect</button>
                {isConnected && <p className="connected-chain">Chain: {chainName}</p>}
                </div>

            </div></header>
  );
}

export default Header;
