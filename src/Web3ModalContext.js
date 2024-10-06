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
      explorerUrl: "https://eth-sepolia.blockscout.com",
      rpcUrl: process.env.SEPOLIA_RPC_URL,
    };

    const baseMainnet = {
      chainId: 8453,
      name: "Base",
      currency: "ETH",
      explorerUrl: "https://base.blockscout.com/",
      rpcUrl: process.env.BASE_RPC_URL,
    };

    const bscMainnet = {
      chainId: 56,
      name: "BSC",
      currency: "BNB",
      explorerUrl: "https://bscscan.com",
      rpcUrl: process.env.BSC_RPC_URL,
    };
    const arbitrumMainnet = {
      chainId: 42161,
      name: "Arbitrum",
      currency: "ETH",
      explorerUrl: "https://arbitrum.blockscout.com/",
      rpcUrl: process.env.ARBITRUM_RPC_URL,
    };

    const optimismMainnet = {
      chainId: 10,
      name: "Optimism",
      currency: "ETH",
      explorerUrl: "https://optimism.blockscout.com/",
      rpcUrl: process.env.OPTIMISM_RPC_URL,
    };

    const celoMainnet = {
      chainId: 42220,
      name: "Celo",
      currency: "CELO",
      explorerUrl: "https://explorer.celo.org/mainnet/",
      rpcUrl: process.env.CELO_RPC_URL,
    };

    const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

    const initWeb3Modal = createWeb3Modal({
      ethersConfig: defaultConfig({
        metadata,
        enableEIP6963: true, // Enable MetaMask
        enableInjected: true, // Enable MetaMask
        enableCoinbase: true, // Enable Coinbase Wallet
        rpcUrl: process.env.BASE_RPC_URL,
        defaultChainId: 8453,

        auth: {
          email: true, // Enable email login
          socials: ["google", "x", "github", "discord", "apple", "facebook"], // List of supported social platforms
          showWallets: true, // Show wallet options alongside email and social logins
          walletFeatures: true, // Enable wallet features like balance viewing and transactions
        },
      }),
      chains: [
        sepoliaMainnet,
        arbitrumMainnet,
        baseMainnet,
        bscMainnet,
        optimismMainnet,
        celoMainnet,
      ],
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
