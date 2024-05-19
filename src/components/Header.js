import React from 'react';
import './Header.css';
import { Link } from 'react-router-dom';

function Header({ connectWallet }) {
  return (
    <header>
         <div className="header-content">
         <Link to="/">
      <img src="path/to/logo.png" alt="Logo" />
      </Link>
      <button onClick={connectWallet}>Connect Wallet</button>
      </div></header>
  );
}

export default Header;
