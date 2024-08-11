import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css"; // Import the CSS file for styling
import Header from "../components/Header.js";
import HowItWorks from "../components/HowItWorks";
import Features from "../components/Features";
import FAQ from "../components/Faqs.js";
import Contact from "../components/Contacts";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import TokensList from "../components/TokenList.js";
import Footer from "../components/Footer.js";

function RecentlyLaunched() {
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
      console.error("Error connecting:", error);
    }
  }

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />

      <TokensList limit={9} />
      <div className="container">
        <Link to="/tokens">
          <button>View All </button>
        </Link>
      </div>

      <Footer />
    </div>
  );
}

export default RecentlyLaunched;
