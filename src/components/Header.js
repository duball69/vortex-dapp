import React from 'react';
import './Header.css';

function Header({ connectWallet }) {
  return (
    <header>
         <div className="header-content">
      <img src="path/to/logo.png" alt="Logo" />
      <button onClick={connectWallet}>Connect Wallet</button>
      </div></header>
  );
}

export default Header;
