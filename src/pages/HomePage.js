import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./HomePage.css"; // Import the CSS file for styling
import Header from "../components/Header.js";
import HowItWorks from "../components/HowItWorks";
import TokenListTable from "../components/TokenListTable.js";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import TokensList from "../components/TokenList.js";
import Footer from "../components/Footer.js";

function HomePage() {
  const [web3Modal, setWeb3Modal] = useState(null);
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount(web3Modal);
  const { open, close } = useWeb3Modal();
  const [error, setError] = useState("");

  useEffect(() => {
    const sepoliaMainnet = {
      chainId: 11155111,
      name: "Sepolia",
      currency: "ETH",
      explorerUrl: "https://sepolia.etherscan.io/",
    };

    const projectId = process.env.WALLETCONNECT_PROJECT_ID;

    const initWeb3Modal = createWeb3Modal({
      ethersConfig: defaultConfig({
        metadata: {
          name: "Vortex Dapp",
          description: "An EVM liquidity lender and token launcher",
          url: "https://vortexdapp.com",
          icons: ["https://vortexdapp.com/favicon.ico"],
        },
        enableEIP6963: true, // Enable MetaMask
        enableInjected: true, // Enable MetaMask
        enableCoinbase: true, // Enable Coinbase Wallet
        rpcUrl:
          "https://eth-sepolia.g.alchemy.com/v2/M87svOeOrOhMsnQWJXB8iQECjn8MJNW0", // Replace with your RPC URL
        defaultChainId: 11155111, // Sepolia Testnet Chain ID
        auth: {
          email: true, // Enable email login
          socials: [
            "google",
            "x",
            "github",
            "discord",
            "telegram",
            "apple",
            "facebook",
          ], // List of supported social platforms
          showWallets: true, // Show wallet options alongside email and social logins
          walletFeatures: true, // Enable wallet features like balance viewing and transactions
        },
      }),
      chains: [sepoliaMainnet],
      projectId,
      enableAnalytics: true,
      explorerExcludedWalletIds: [
        "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa",
      ],
    });

    setWeb3Modal(initWeb3Modal);
  }, []); // Ensure this useEffect runs only once

  async function connectWallet() {
    try {
      if (!web3Modal) return;
      open(); // Open the Web3Modal modal
      setError("");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setError("Failed to connect wallet");
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
          Launch ERC20 tokens and get initial liquidity
          <br />
        </h1>
        <h4 className="subtitlehome">Currently only on Sepolia Testnet</h4>

        <div>
          <Link to="/factory">
            <button className="home-button">Launch</button>
          </Link>

          <Link to="/staking">
            <button className="home-button">Stake</button>
          </Link>
        </div>
      </div>

      <div className="container">
        <Link to="/tokens">
          <button>View All </button>
        </Link>
      </div>

      <HowItWorks />

      <Footer />
    </div>
  );
}

export default HomePage;
