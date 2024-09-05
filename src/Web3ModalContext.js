import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";

const Web3ModalContext = createContext();

export const Web3ModalProvider = ({ children }) => {
  const [web3Modal, setWeb3Modal] = useState(null);
  const { address, chainId, isConnected, connect, disconnect } =
    useWeb3ModalAccount(web3Modal);

  useEffect(() => {
    const metadata = {
      name: "Vortex Dapp",
      description: "An EVM liquidity lender and token launcher",
      url: "https://vortexdapp.com",
      icons: ["https://vortexdapp.com/favicon.ico"],
    };

    const sepoliaMainnet = {
      chainId: 11155111,
      name: "Sepolia",
      currency: "ETH",
      explorerUrl: "https://sepolia.etherscan.io/",
    };

    const projectId = process.env.WALLETCONNECT_PROJECT_ID;

    const initWeb3Modal = createWeb3Modal({
      ethersConfig: defaultConfig({
        metadata,
        enableEIP6963: true, // Enable MetaMask
        enableInjected: true, // Enable MetaMask
        enableCoinbase: true, // Enable Coinbase Wallet
        rpcUrl:
          "https://eth-sepolia.g.alchemy.com/v2/M87svOeOrOhMsnQWJXB8iQECjn8MJNW0", // Replace with your RPC URL
        defaultChainId: 11155111, // Sepolia Testnet Chain ID

        defaultChainId: 11155111,
        auth: {
          email: true, // Enable email login
          socials: [
            "google",
            "x",
            "github",
            "discord",
            "apple",
            "facebook",
            "farcaster",
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
