import React, { useState } from 'react';
import './Header.css';
import { Link } from 'react-router-dom';

function Header({ connectWallet }) {

    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);



  return (
    <header>
      <div className="header-content">
        
                <Link to="/">
                    <img src="logo512.png" alt="VortexLogo png" className="logo" />
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

                <button onClick={connectWallet}>Connect</button>
            </div></header>
  );
}

export default Header;
