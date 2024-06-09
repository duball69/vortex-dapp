import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json"; // Assuming you have a separate JSON file for the deployed
import MyTokenJson from "../contracts/MyToken.json";
import PositionManagerJson from "../contracts/PositionManager.json";
import {
  createWeb3Modal,
  defaultConfig,
  useWeb3Modal,
  useWeb3ModalAccount,
  open,
} from "@web3modal/ethers/react";
import { Link, useParams } from "react-router-dom";
import "./Dashboard.css";
import Header from "../components/Header.js";
import Footer from "../components/Footer.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore } from "../components/firebaseConfig.js";
import { typeImplementation } from "@testing-library/user-event/dist/type/typeImplementation.js";
/* global BigInt */

const networkConfig = {
  // Example Chain IDs for Base and Sepolia
  8453: {
    // Mainnet (as an example; replace with the correct ID for "base")
    factoryAddress: "0x4301B64C8b4239EfBEb5818F968d1cccf4a640E0",
    WETH_address: "0x4200000000000000000000000000000000000006",
  },
  11155111: {
    // Sepolia Testnet Chain ID
    factoryAddress: "0x13679f5B2b553d95e41549279841258be3Fb1830",
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
  },
};

function DashboardPage() {
  const { contractAddress } = useParams(); // Get the contract address from the URL
  const [tokenDetails, setTokenDetails] = useState({
    name: "",
    symbol: "",
    supply: "",
  });
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount();
  const { open, close } = useWeb3Modal();
  const [deployedPoolAddress, setDeployedPoolAddress] = useState("");
  const [isCreatingPair, setIsCreatingPair] = useState(false);
  const [isPoolInitializing, setIsPoolInitializing] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const WETH_ChainAddress =
    networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";

  // Effect to log and set factory address only when chainId changes
  useEffect(() => {
    if (!isInitialized && chainId) {
      console.log("Factory Address initialized:", factoryChainAddress);
      console.log("WETH Address initialized:", WETH_ChainAddress);
      setIsInitialized(true); // Prevent further initialization logs
    }
  }, [chainId, isInitialized]);

  useEffect(() => {
    const savedPoolAddress = localStorage.getItem("deployedPoolAddress");
    if (savedPoolAddress) {
      setDeployedPoolAddress(savedPoolAddress);
    }
    fetchTokenDetails();
  }, [contractAddress, isConnected]); // Dependencies adjusted as per usage

  async function connectWallet() {
    try {
      await open();
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  async function fetchTokenDetails() {
    if (!contractAddress || !isConnected) return;

    // Fetch token information from the blockchain
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tokenContract = new ethers.Contract(
      contractAddress,
      MyTokenJson.abi,
      provider
    );
    const name = await tokenContract.name();
    const symbol = await tokenContract.symbol();
    const supply = await tokenContract.totalSupply();

    // Fetch token image URL from Firestore
    const tokensCollection = collection(firestore, "tokens");
    const q = query(tokensCollection, where("address", "==", contractAddress));
    const querySnapshot = await getDocs(q);

    let imageUrl = "";
    querySnapshot.forEach((doc) => {
      // Assuming there's one document matching the contract address
      imageUrl = doc.data().imageUrl;
    });

    setTokenDetails({
      name,
      symbol,
      supply: (supply.toString() / 10 ** 18).toString(),
      imageUrl, // Add image URL to state
    });
  }

  function calculateSqrtPriceX96(token1Amount, token0Amount) {
    console.log("Token0amount:", token0Amount);
    console.log("Token1amount:", token1Amount);

    // Calculate the price ratio as token1 / token0, scaled up by 10^18 to maintain precision
    const priceRatio =
      (BigInt(token1Amount) * BigInt(10 ** 18)) / BigInt(token0Amount);

    console.log("Price ratio:", priceRatio);

    // Calculate the square root of the price ratio, convert it to a number to handle floating-point operations
    const sqrtPriceRatio = Math.sqrt(Number(priceRatio));
    console.log(sqrtPriceRatio);
    console.log("sqrtpricerati:", sqrtPriceRatio);
    // Adjust the floating point result before converting it back to BigInt
    const adjustedSqrtPriceRatio = Math.floor(sqrtPriceRatio * 10 ** 9); // Adjust by scaling up to preserve precision

    // Convert the adjusted result to BigInt and then scale it to sqrtPriceX96 format
    const sqrtPriceX96 =
      (BigInt(adjustedSqrtPriceRatio) * BigInt(2 ** 96)) / BigInt(10 ** 18);
    console.log("sqrtpriceratio96:", sqrtPriceX96);
    return sqrtPriceX96.toString(); // Return as string to avoid further BigInt conversion issues in ethers.js
  }

  async function handleMulticall() {
    let token0, token1, token0amount, token1amount;

    const tokenAmount = ethers.parseUnits(String(tokenDetails.supply), 18); // Total supply for your token
    const wethAmount = ethers.parseUnits("0.001", 18); // 0.01 WETH

    if (contractAddress.toLowerCase() < WETH_ChainAddress.toLowerCase()) {
      token0 = contractAddress;
      token1 = WETH_ChainAddress;
      token0amount = tokenAmount;
      token1amount = wethAmount;
    } else {
      token0 = WETH_ChainAddress;
      token1 = contractAddress;
      token0amount = wethAmount;
      token1amount = tokenAmount;
    }

    // Calculate sqrtPriceX96
    const priceRatio =
      (BigInt(token1amount) * BigInt(10 ** 18)) / BigInt(token0amount);
    const sqrtPriceRatio = sqrt(priceRatio);
    const sqrtPriceX96 = (sqrtPriceRatio * BigInt(2 ** 96)) / BigInt(10 ** 9);

    const iface = new ethers.Interface([
      "function createAndInitializePoolIfNecessary(address,address,uint160) external returns (address pool)",
      "function addInitialLiquidity(address,address,address,uint256,uint256) external",
    ]);

    const createPoolData = iface.encodeFunctionData(
      "createAndInitializePoolIfNecessary",
      [token0, token1, sqrtPriceX96]
    );
    const addLiquidityData = iface.encodeFunctionData("addInitialLiquidity", [
      token0,
      token1,
      factoryChainAddress,
      token0amount,
      token1amount,
    ]);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      const tx = await factoryContract.multicall(
        [createPoolData, addLiquidityData],
        { gasLimit: 9000000 }
      );
      await tx.wait();
      alert("Pool created and liquidity added successfully!");
    } catch (error) {
      console.error("Multicall transaction failed:", error);
      alert("Transaction failed: " + error.message);
    }
  }

  // Helper function to calculate square root
  const sqrt = (value) => {
    let z = value;
    let x = value / 2n + 1n;
    while (x < z) {
      z = x;
      x = (value / x + x) / 2n;
    }
    return z;
  };

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <div className="wallet-status">
          {isConnected ? (
            <p>Connected Wallet: {connectedWallet}</p>
          ) : (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}
        </div>
        <div className="token-info">
          {tokenDetails.imageUrl && (
            <img
              src={tokenDetails.imageUrl}
              alt={tokenDetails.name}
              className="token-image"
            />
          )}
          <p>Token Name: {tokenDetails.name}</p>
          <p>Token Symbol: {tokenDetails.symbol}</p>
          <p>Total Supply: {tokenDetails.supply}</p>
          <p>
            Your Deployed Token Contract Address:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {contractAddress}
            </a>
          </p>
        </div>

        <button onClick={handleMulticall} className="deploy-button">
          Create Pool and Add Liquidity
        </button>
        {deployedPoolAddress && (
          <p>
            Your new deployed pool address is:{" "}
            <a
              href={`https://sepolia.etherscan.io/address/${deployedPoolAddress}`}
              target="_blank"
            >
              {deployedPoolAddress}
            </a>
          </p>
        )}
        <div className="navigation-links">
          <Link to="/factory">Back to Factory</Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default DashboardPage;
