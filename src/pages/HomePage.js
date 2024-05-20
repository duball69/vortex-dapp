import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // Import the CSS file for styling
import Header from '../components/Header.js';
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount} from '@web3modal/ethers/react';
import TokensList from "../components/TokenList.js";
import Footer from '../components/Footer.js';


function HomePage() {
  const { address: connectedWallet, chainId, isConnected } = useWeb3ModalAccount();
  const { open, close } = useWeb3Modal();
  const [error, setError] = useState(""); 

  async function connectWallet() {
    try {
        open(); // Open the Web3Modal modal
        setError("");
    } catch (error) {
        console.error("Error connecting wallet:", error);
        
    }
}

  return (
  
    
    <div> 
    <Header connectWallet={connectWallet} />
      
      <div className="centered-content">
    
      <h1 className="titlehome">Create your own token with 1 ETH of LP</h1>
      <h5>We help you create tokens with low costs and add 1 ETH to launch your coin!</h5>
  
      <Link to="/factory" className="start-button2">Let's Start</Link></div>
    
    <TokensList />
    <Footer/>
    </div>
 
  );
}

export default HomePage;
