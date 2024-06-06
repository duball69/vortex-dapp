import React, { useState, useEffect } from "react";
import { ethers, BrowserProvider } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";
import "./FactoryPage.css";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
} from "@web3modal/ethers/react";
import { Link } from "react-router-dom";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { firestore } from "../components/firebaseConfig.js";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  updateDoc,
} from "firebase/firestore";
const projectId = "9513bcef54af049b9471faff11d5a16a";

const networkConfig = {
  // Example Chain IDs for Base and Sepolia
  8453: {
    // Mainnet (as an example; replace with the correct ID for "base")
    factoryAddress: "0x4301B64C8b4239EfBEb5818F968d1cccf4a640E0",
    WETH_address: "0x4200000000000000000000000000000000000006",
  },
  11155111: {
    // Sepolia Testnet Chain ID
    factoryAddress: "0x6b2e54664164b146217c3cddeb1737da9c91409a",
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
  },
};

const CHAIN_NAMES = {
  56: "BSC",
  42161: "Arbitrum",
  8453: "Base",
  11155111: "Sepolia",
};

const sepoliaMainnet = {
  chainId: 11155111,
  name: "Sepolia",
  currency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io/",
  rpcUrl: process.env.SEPOLIA_RPC_URL,
};

const baseMainnet = {
  chainId: 8453,
  name: "Base",
  currency: "ETH",
  explorerUrl: "https://basescan.org/",
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
  explorerUrl: "https://arbiscan.io",
  rpcUrl: process.env.ARBITRUM_RPC_URL,
};

const metadata = {
  name: "Vortex Dapp",
  description:
    "A dapp to create ERC20 tokens on any EVM chain, and get intiial LP without costs. ",
  url: "https://vortexdapp.com",
  icons: ["https://vortexdapp.com/favicon.ico"],
};

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  rpcUrl: "...",
  defaultChainId: 1,
});

const web3Modal = createWeb3Modal({
  ethersConfig,
  chains: [sepoliaMainnet, arbitrumMainnet, baseMainnet, bscMainnet],
  projectId,
  enableAnalytics: true,
});

const IMGUR_API_URL = "https://api.imgur.com/3/image";
const CLIENT_ID = "7bd162baabe49a2"; // Your Imgur Client ID

const uploadImageToImgur = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(IMGUR_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${CLIENT_ID}`,
        Accept: "application/json",
      },
      body: formData,
    });

    const data = await response.json();
    if (data.success) {
      console.log("Image uploaded to Imgur:", data.data.link);
      return data.data.link; // Returns the URL of the uploaded image
    } else {
      throw new Error("Failed to upload image to Imgur");
    }
  } catch (error) {
    console.error("Error uploading image to Imgur:", error);
    return null;
  }
};

function FactoryPage() {
  const [contractAddress, setContractAddress] = useState(null);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [tokenImage, setTokenImage] = useState(null);
  const [tokenImageUrl, setTokenImageUrl] = useState(null);
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount(); // Retrieve client's information
  const { open, close } = useWeb3Modal();
  const [deployedContractAddress, setDeployedContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";

  // Effect to log and set factory address only when chainId changes
  useEffect(() => {
    if (!isInitialized && chainId) {
      console.log("Factory Address initialized:", factoryChainAddress);
      setIsInitialized(true); // Prevent further initialization logs
    }
  }, [chainId, isInitialized]);

  async function connectWallet() {
    try {
      open(); // Open the Web3Modal modal
      console.log("Connected to chain:", chainId);
      setError("");
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  const chainName = CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;

  async function deployToken(e) {
    e.preventDefault();
    if (!isConnected) {
      setError(
        "Please connect your wallet before attempting to deploy a token."
      );
      return;
    }

    setIsLoading(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      const txResponse = await factoryContract.deployToken(
        tokenName,
        tokenSymbol,
        tokenSupply
      );

      // Wait for the transaction to be mined
      const receipt = await txResponse.wait();
      console.log("Transaction successful with receipt:", receipt);
    } catch (error) {
      console.error("Error during transaction:", error);
      setError("There was an error with the transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />
      <div>
        <h1 className="titlefactory">
          Launch your new token without costs. We lend you the liquidity.
        </h1>
        <h3 className="subtitlefactory">
          Vortex provides liquidity lending to launch tokens, directly on
          Uniswap.
        </h3>
      </div>
      <div className="center-container">
        <div className="factory-container">
          <h2 className="createerc">Create Your ERC20 Token</h2>
          {isConnected && (
            <p className="connected-wallet">
              Connected Wallet: {connectedWallet}
            </p>
          )}{" "}
          {/* Display connected wallet address */}
          <form onSubmit={deployToken} className="token-form">
            <div className="custom-file-input">
              <span>Add your token image here</span>
              <input
                type="file"
                id="tokenImage"
                accept="image/*"
                onChange={(e) => setTokenImage(e.target.files[0])}
                className="input"
              />
              {tokenImage && (
                <div>
                  <img
                    src={URL.createObjectURL(tokenImage)}
                    alt="Token Preview"
                    style={{ maxWidth: "100px", maxHeight: "100px" }}
                  />
                </div>
              )}
            </div>

            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder="Token Name"
              className="input"
            />
            <br />
            <input
              type="text"
              value={tokenSymbol}
              onChange={(e) => setTokenSymbol(e.target.value)}
              placeholder="Token Symbol"
              className="input"
            />
            <br />
            <input
              type="number"
              value={tokenSupply}
              onChange={(e) => {
                const maxSupply = 10000000000000;
                const value = Math.min(maxSupply, Number(e.target.value));
                setTokenSupply(value);
              }}
              placeholder="Total Supply"
              max="10000000000000"
              className="input"
            />

            <br />

            {!deployedContractAddress && (
              <button type="submit" className="deploy-button">
                {isLoading ? "Loading..." : "Deploy Token"}
              </button>
            )}
          </form>
          {error && <p className="error-message">{error}</p>}
          {deployedContractAddress && (
            <>
              <p className="token_address_message">
                Your new token address is:{" "}
                <a
                  href={`https://sepolia.etherscan.io/address/${deployedContractAddress}`}
                  target="_blank"
                >
                  {deployedContractAddress}
                </a>
              </p>
              <Link
                className="start-button"
                to={`/dashboard/${deployedContractAddress}`}
              >
                Go to Dashboard
              </Link>
            </>
          )}
        </div>
      </div>{" "}
      <Footer />
    </div>
  );
}

export default FactoryPage;
