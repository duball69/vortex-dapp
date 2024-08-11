import React, { createContext, useContext, useState, useEffect } from "react";
import { createWeb3Modal, useWeb3ModalAccount } from "@web3modal/ethers/react";

const Web3ModalContext = createContext();

export const Web3ModalProvider = ({ children }) => {
  const [web3Modal, setWeb3Modal] = useState(null);
  const { address, chainId, isConnected, connect, disconnect } =
    useWeb3ModalAccount(web3Modal);

  useEffect(() => {
    // Define network configurations
    const baseMainnet = {
      chainId: 8453,
      name: "Base",
      currency: "ETH",
      explorerUrl: "https://base.blockscout.com/",
      rpcUrl: process.env.BASE_RPC_URL || "https://base.blockscout.com/", // Replace with your actual RPC URL
    };

    const sepoliaMainnet = {
      chainId: 11155111,
      name: "Sepolia",
      currency: "ETH",
      explorerUrl: "https://sepolia.etherscan.io/",
      rpcUrl:
        process.env.SEPOLIA_RPC_URL ||
        "https://eth-sepolia.g.alchemy.com/v2/M87svOeOrOhMsnQWJXB8iQECjn8MJNW0",
    };

    // Web3Modal configuration
    const config = {
      metadata: {
        name: "Vortex Dapp",
        description: "An EVM liquidity lender and token launcher",
        url: "https://vortexdapp.com",
        icons: ["https://vortexdapp.com/favicon.ico"],
      },
      enableEIP6963: true, // Enable MetaMask (EIP6963)
      enableInjected: true, // Enable injected wallets (MetaMask, etc.)
      enableCoinbase: false, // Enable Coinbase Wallet
      defaultChainId: baseMainnet.chainId, // Set Base as the default chain
    };

    const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

    // Initialize Web3Modal
    const initWeb3Modal = createWeb3Modal({
      config,
      chains: [baseMainnet, sepoliaMainnet], // Include Base as the first chain
      projectId,
      enableAnalytics: true,
    });

    setWeb3Modal(initWeb3Modal);

    // Optional: Clear cached provider to avoid automatic reconnection to last used wallet
    initWeb3Modal.clearCachedProvider();
  }, []);

  return (
    <Web3ModalContext.Provider
      value={{ address, chainId, isConnected, connect, disconnect }}
    >
      {children}
    </Web3ModalContext.Provider>
  );
};

export const useCustomWeb3Modal = () => useContext(Web3ModalContext);
