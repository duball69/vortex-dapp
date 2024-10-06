// CombinedFactoryDashboard.js

import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";
import MyTokenJson from "../contracts/MyToken.json";
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
  getDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
/* global BigInt */

const networkConfig = {
  // Example Chain IDs for Base and Sepolia
  8453: {
    // BASE
    factoryAddress: "0xF686e6CAF7d823E4130339E6f2b02C37836fE90F",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://base.blockscout.com/",
  },
  11155111: {
    // Sepolia Testnet Chain ID
    factoryAddress: "0x0CeD474F344497dc917D285a00eEE0394c6F044c",
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://eth-sepolia.blockscout.com/",
  },
  10: {
    // Optimism Chain ID
    factoryAddress: "0xE955ceFC8cddD38a8Ee1ed3247948cd054e49a74",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://optimism.blockscout.com/",
  },
  42220: {
    // CELO Chain ID
    factoryAddress: "0xE955ceFC8cddD38a8Ee1ed3247948cd054e49a74", // Adjust if necessary
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

const metadata = {
  name: "Vortex Dapp",
  description:
    "A dapp to create ERC20 tokens on any EVM chain, and get initial LP without costs.",
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
    email: true,
    socials: ["google", "x", "github", "discord", "apple", "facebook"],
    showWallets: true,
    walletFeatures: true,
  },
});

const projectId = process.env.WALLETCONNECT_PROJECT_ID;

const web3Modal = createWeb3Modal({
  ethersConfig,
  chains: [
    {
      chainId: 11155111,
      name: "Sepolia",
      currency: "ETH",
      explorerUrl: "https://eth-sepolia.blockscout.com",
      rpcUrl: process.env.SEPOLIA_RPC_URL,
    },
    {
      chainId: 42161,
      name: "Arbitrum",
      currency: "ETH",
      explorerUrl: "https://arbitrum.blockscout.com/",
      rpcUrl: process.env.ARBITRUM_RPC_URL,
    },
    {
      chainId: 8453,
      name: "Base",
      currency: "ETH",
      explorerUrl: "https://base.blockscout.com/",
      rpcUrl: process.env.BASE_RPC_URL,
    },
    {
      chainId: 56,
      name: "BSC",
      currency: "BNB",
      explorerUrl: "https://bscscan.com",
      rpcUrl: process.env.BSC_RPC_URL,
    },
    {
      chainId: 10,
      name: "Optimism",
      currency: "ETH",
      explorerUrl: "https://optimism.blockscout.com/",
      rpcUrl: process.env.OPTIMISM_RPC_URL,
    },
    {
      chainId: 42220,
      name: "Celo",
      currency: "CELO",
      explorerUrl: "https://explorer.celo.org/mainnet/",
      rpcUrl: process.env.CELO_RPC_URL,
    },
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
      return data.data.link;
    } else {
      throw new Error("Failed to upload image to Imgur");
    }
  } catch (error) {
    console.error("Error uploading image to Imgur:", error);
    return null;
  }
};

function CombinedFactoryDashboard() {
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("");
  const [tokenImage, setTokenImage] = useState(null);
  const [tokenImageUrl, setTokenImageUrl] = useState(null);
  const [deployedContractAddress, setDeployedContractAddress] = useState("");
  const [tokenDetails, setTokenDetails] = useState({
    name: "",
    symbol: "",
    supply: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [txHash, setTxHash] = useState("");
  const [tokenAmountToBuy, setTokenAmountToBuy] = useState("0.000005");
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount();
  const { open, close } = useWeb3Modal();
  const explorerUrl =
    networkConfig[chainId]?.explorerUrl || "https://eth.blockscout.com/";
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const WETH_ChainAddress =
    networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect to log and set factory address only when chainId changes
  useEffect(() => {
    if (!isInitialized && chainId) {
      console.log("Factory Address initialized:", factoryChainAddress);
      setIsInitialized(true);
    }
  }, [chainId, isInitialized, factoryChainAddress]);

  async function connectWallet() {
    try {
      open();
      console.log("Connected to chain:", chainId);
      setError("");
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  const chainName = CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`;

  async function deployTokenAndAddLiquidity(e) {
    e.preventDefault();

    if (!isConnected) {
      setError("Please connect your wallet before trying to deploy a token.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Deploy the token
      const deployedAddress = await deployToken();

      if (deployedAddress) {
        // Fetch Token Details after Deployment
        await fetchTokenDetails(deployedAddress);

        // Add liquidity and swap
        await handleMulticall(deployedAddress);
      }
    } catch (error) {
      console.error(
        "Error during token deployment and liquidity addition:",
        error
      );
      setError("There was an error with the transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deployToken() {
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
        ethers.parseUnits(tokenSupply, 18)
      );
      const receipt = await txResponse.wait();

      const logs = receipt.logs;
      if (logs.length > 0) {
        const deployedAddress = logs[0].address;
        setDeployedContractAddress(deployedAddress);

        // Save to Firestore
        const tokensCollection = collection(firestore, "tokens");
        await setDoc(doc(tokensCollection, deployedAddress), {
          name: tokenName,
          symbol: tokenSymbol,
          supply: tokenSupply,
          address: deployedAddress,
          imageUrl: imageUrl,
          deployer: connectedWallet,
          timestamp: new Date(),
          chain: CHAIN_NAMES[chainId],
        });

        const uppercaseWallet = connectedWallet.toUpperCase();

        // Update Points
        const userPointsDoc = doc(firestore, "userPoints", uppercaseWallet);
        const userPointsSnapshot = await getDoc(userPointsDoc);

        if (userPointsSnapshot.exists()) {
          const currentPoints = userPointsSnapshot.data().points;
          await updateDoc(userPointsDoc, { points: currentPoints + 1 });
        } else {
          await setDoc(userPointsDoc, { points: 1 });
        }

        return deployedAddress;
      }
    } catch (error) {
      console.error("Error during token deployment:", error);
      setError(
        "There was an error with the token deployment. Please try again."
      );
      throw error;
    }
  }

  async function fetchTokenDetails(address) {
    if (!address || !isConnected) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const tokenContract = new ethers.Contract(
      address,
      MyTokenJson.abi,
      provider
    );
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const supply = await tokenContract.totalSupply();

    // Fetch token image URL from Firestore
    const tokensCollection = collection(firestore, "tokens");
    const q = query(tokensCollection, where("address", "==", address));
    const querySnapshot = await getDocs(q);

    let imageUrl = "";
    querySnapshot.forEach((doc) => {
      imageUrl = doc.data().imageUrl;
    });

    setTokenDetails({
      name,
      symbol,
      supply: ethers.formatUnits(supply, 18).toString(),
      imageUrl,
    });
  }

  async function handleMulticall(deployedAddress) {
    try {
      const swapAmountValue = tokenAmountToBuy
        ? parseFloat(tokenAmountToBuy)
        : 0;
      const swapAmount = ethers.parseUnits(swapAmountValue.toString(), 18);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      // Call the addLiquidityLockSwap function
      const txAddLiquidity = await factoryContract.addLiquidityLockSwap(
        deployedAddress,
        swapAmount,
        { value: swapAmount, gasLimit: 9000000 }
      );

      // Log the transaction hash
      console.log("Transaction Hash:", txAddLiquidity.hash);

      // Set success message with transaction link immediately
      const txHash = txAddLiquidity.hash;
      setTxHash(txHash);

      setSuccessMessage(
        `Your token is now live on the blockchain. Trade it anywhere.`
      );
    } catch (error) {
      if (error.code === "ACTION_REJECTED") {
        setError("Transaction failed: User rejected transaction.");
      } else {
        console.error(error);
        setError("Transaction failed, please try again.");
      }
      throw error;
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
          {!successMessage && (
            <>
              <h2 className="createerc">Create Your New Token</h2>
              <form
                onSubmit={deployTokenAndAddLiquidity}
                className="token-form"
              >
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
                    setTokenSupply(value.toString());
                  }}
                  placeholder="Total Supply"
                  max="10000000000000"
                  className="input"
                />
                <br />
                <div className="swap-container">
                  <label htmlFor="tokenAmount">
                    Enter amount in ETH to buy:
                  </label>
                  <input
                    id="tokenAmount"
                    type="number"
                    step="0.000001"
                    value={tokenAmountToBuy}
                    onChange={(e) => {
                      let value = e.target.value.replace(/,/g, ".");
                      if (value === "" || value.match(/^\d*\.?\d*$/)) {
                        setTokenAmountToBuy(value);
                      }
                    }}
                    onBlur={(e) => {
                      let value = e.target.value
                        ? parseFloat(e.target.value).toFixed(6)
                        : "0.000005";
                      if (parseFloat(value) > 0.000005) {
                        value = "0.000005";
                      }
                      setTokenAmountToBuy(value);
                    }}
                    placeholder="Enter amount in ETH to buy"
                    min="0.000001"
                    max="0.000005"
                    className="input"
                  />
                </div>
                <br />
                <button
                  type="submit"
                  className="deploy-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Create Token"}
                </button>
              </form>
              {error && <p className="error-message">{error}</p>}
            </>
          )}

          {successMessage && (
            <>
              <div className="success-message2">{successMessage}</div>
              <a
                href={`${explorerUrl}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="a"
              >
                <span>Check transaction</span>
              </a>
              <Link to={`/token/${deployedContractAddress}`}>
                <button className="deploy-button">Next</button>
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="info-footer">
        <p>
          Select your token name, symbol, total supply, and the amount in ETH
          you want to buy. Click "Create Token" to deploy your token and add
          initial liquidity in one step.
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
          .
        </p>
      </div>
      <Footer />
    </div>
  );
}

export default CombinedFactoryDashboard;
