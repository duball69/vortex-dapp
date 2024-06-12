import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css"; // Import the CSS file for styling
import Header from "../components/Header.js";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import TokensList from "../components/TokenList.js";
import Footer from "../components/Footer.js";

function HomePage() {
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount();
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
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />

      <div className="centered-content">
        <img src="logo512.png" alt="Logo" className="logo2" />

        <h1 className="titlehome">
          Create a token with 1000$ of initial liquidity
        </h1>
        <h5 className="subtitlehome">
          We help you create tokens and loan you initial liquidity for free!
        </h5>
        <h6 className="texthome">Currently only on Sepolia Testnet.</h6>
        <div>
          <Link to="/factory">
            <button className="home-button">Launch</button>
          </Link>

          <Link to="/staking">
            <button className="home-button">Stake</button>
          </Link>
        </div>
      </div>

      <TokensList />
      <Footer />
    </div>
  );
}

export default HomePage;
