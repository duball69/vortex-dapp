import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
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
import supabase from "../supabaseClient";

const networkConfig = {
  // Example Chain IDs for Base and Sepolia
  8453: {
    // BASE (as an example; replace with the correct ID for "base")
    factoryAddress: "0xF686e6CAF7d823E4130339E6f2b02C37836fE90F",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://base.blockscout.com/",
  },
  11155111: {
    // Sepolia Testnet Chain ID
    factoryAddress: process.env.REACT_APP_FACTORY_SEPOLIA_CA,
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://eth-sepolia.blockscout.com/",
  },

  10: {
    // OP Chain ID
    factoryAddress: "0xE955ceFC8cddD38a8Ee1ed3247948cd054e49a74",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://optimism.blockscout.com/",
  },

  4710: {
    // CELO Chain ID
    factoryAddress: "0xE955ceFC8cddD38a8Ee1ed3247948cd054e49a74", //change
    WETH_address: "0x471EcE3750Da237f93B8E339c536989b8978a438",
    explorerUrl: "https://explorer.celo.org/mainnet/",
  },
};

const CHAIN_NAMES = {
  56: "BSC",
  42161: "Arbitrum",
  8453: "Base",
  11155111: "Sepolia",
  10: "Optimism",
  42220: "Celo",
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
  enableCoinbase: false,
  rpcUrl: process.env.BASE_RPC_URL,
  defaultChainId: 8453,
  auth: {
    email: true, // Enable email login
    socials: ["google", "x", "github", "discord", "apple", "facebook"], // List of supported social platforms
    showWallets: true, // Show wallet options alongside email and social logins
    walletFeatures: true, // Enable wallet features like balance viewing and transactions
  },
});

const projectId = process.env.REACT_APP_WALLETCONNECT_PROJECT_ID;

const web3Modal = createWeb3Modal({
  ethersConfig,
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
});

const IMGUR_API_URL = "https://api.imgur.com/3/image";
const CLIENT_ID = "7bd162baabe49a2";

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
  const explorerUrl =
    networkConfig[chainId]?.explorerUrl || "https://eth.blockscout.com/";
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";

  // Effect to log and set factory address only when chainId changes
  useEffect(() => {
    if (!isInitialized && chainId) {
      console.log("Factory Address initialized:", factoryChainAddress);
      setIsInitialized(true); // Prevent further initialization logs
    }
  }, [chainId, isInitialized, factoryChainAddress]);

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
      setError("Please connect your wallet before trying to deploy a token.");
      return;
    }

    setIsLoading(true);

    let imageUrl = null;
    if (tokenImage) {
      imageUrl = await uploadImageToImgur(tokenImage);
      if (!imageUrl) {
        setError("Failed to upload image, proceeding without it.");
      } else {
        setTokenImageUrl(imageUrl);
      }
    }

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
      const receipt = await txResponse.wait();

      const logs = receipt.logs;
      if (logs.length > 0) {
        // Assuming the first log contains the deployed address
        const deployedAddress = logs[0].address;
        setDeployedContractAddress(deployedAddress);

        // Save to Supabase
        const { data, error } = await supabase.from("tokens").insert([
          {
            name: tokenName,
            symbol: tokenSymbol,
            supply: tokenSupply,
            address: deployedAddress,
            imageUrl: imageUrl,
            deployer: connectedWallet,
            timestamp: new Date().toISOString(),
            chain: CHAIN_NAMES[chainId],
          },
        ]);

        if (error) {
          throw error;
        }

        // Update Points
        const { data: upsertData, error: upsertError } = await supabase
          .from("userPoints")
          .upsert(
            {
              wallet: connectedWallet.toUpperCase(),
              points: 1, // Set the initial value to 1 if the wallet doesn't exist
            },
            { onConflict: "wallet" }
          );

        if (!upsertError) {
          // If upsert was successful, now increment the points
          const { data: incrementData, error: incrementError } = await supabase
            .from("userPoints")
            .update({ points: supabase.increment(1) }) // Increment points by 1
            .eq("wallet", connectedWallet.toUpperCase());

          if (incrementError) {
            throw incrementError;
          }
        } else {
          throw upsertError;
        }
      }
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
        <h1 className="titlefactory">Launch your new ERC20 token</h1>
        <h3 className="subtitlefactory">
          Vortex provides liquidity lending to launch tokens, directly on
          Uniswap.
        </h3>
      </div>
      <div className="center-container">
        <div className="factory-container">
          <h2 className="createerc">Create Your New Token</h2>
          {isConnected} {/* Display connected wallet address */}
          <form onSubmit={deployToken} className="token-form">
            <div className="custom-file-input">
              <span>Add image here</span>
              <input
                type="file"
                id="tokenImage"
                accept="image/*"
                onChange={(e) => setTokenImage(e.target.files[0])}
                className="input"
                placeholder="token image"
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
                {isLoading ? "Loading..." : "Create Token"}
              </button>
            )}
          </form>
          {error && <p className="error-message">{error}</p>}
          {deployedContractAddress && (
            <>
              <p className="token_address_message">
                Your new token address is:{" "}
                <a
                  href={`${explorerUrl}/address/${deployedContractAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="a"
                >
                  <span>Check CA on BlockScout</span>
                </a>
              </p>

              <Link to={`/dashboard/${deployedContractAddress}`}>
                <button className="deploy-button">Next Step</button>
              </Link>
            </>
          )}
        </div>
      </div>{" "}
      <div className="info-footer">
        <p>
          Select your token name, symbol, and total supply, and click "Create
          Token". Vortex smart contracts allow you to deploy your token with an
          initial liquidity of 0.5 ETH. You will be able to purchase tokens on
          the first block, in the next step.
        </p>
        <p>
          If you have questions, please check our
          <a
            href="https://docs.vortexdapp.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            {" "}
            Docs{" "}
          </a>
          or ask us on our
          <a
            href="https://t.me/vortexdapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            {" "}
            Telegram
          </a>
        </p>
      </div>
      <Footer />
    </div>
  );
}

export default FactoryPage;
