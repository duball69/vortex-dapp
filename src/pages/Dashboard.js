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
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { firestore } from "../components/firebaseConfig.js";
/* global BigInt */

const networkConfig = {
  // Example Chain IDs for Base and Sepolia
  8453: {
    // Mainnet (as an example; replace with the correct ID for "base")
    factoryAddress: "0x4301B64C8b4239EfBEb5818F968d1cccf4a640E0", //deprecated - deploy new one one base
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://basescan.org",
  },
  11155111: {
    // Sepolia Testnet Chain ID
    factoryAddress: "0xD086861306DA949be5073c2fe20b195fc768AAC8",
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://eth-sepolia.blockscout.com",
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
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [tokenAmountToBuy, setTokenAmountToBuy] = useState("");
  const [maxBuyAmount, setMaxBuyAmount] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const WETH_ChainAddress =
    networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";
  const explorerUrl =
    networkConfig[chainId]?.explorerUrl || "https://etherscan.io";

  // Add new state for liquidity amount
  const [liquidityAmount, setLiquidityAmount] = useState("");

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
    const signer = await provider.getSigner();
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

  async function handleMulticall() {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const swapAmountValue = tokenAmountToBuy
        ? parseFloat(tokenAmountToBuy)
        : 0;
      const swapAmount = ethers.parseUnits(swapAmountValue.toString(), 18);

      // Setup for adding liquidity
      const tokenAmount = ethers.parseUnits(tokenDetails.supply, 18);
      const wethAmount = ethers.parseUnits("0.05", 18); // Example amount of WETH
      const maxBuyWei = (wethAmount * BigInt(5)) / BigInt(100);
      setMaxBuyAmount(ethers.formatEther(maxBuyWei));
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      let token0, token1, token0amount, token1amount;
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

      // Call the addLiquidityLockSwap function
      const txAddLiquidity = await factoryContract.addLiquidityLockSwap(
        contractAddress,
        swapAmount, // Adjust amount of ETH swapped accordingly
        { value: swapAmount, gasLimit: 9000000 }
      );
      await txAddLiquidity.wait();
      console.log("Liquidity added and locked!");

      // Optionally handle swap and any other interactions here
      const tokensSwappedEvent = await getLatestEvent(
        factoryContract,
        "TokensSwapped"
      );
      const tokensReceived = ethers.formatUnits(tokensSwappedEvent.args[0], 18);
      console.log("Tokens received: ", tokensReceived);

      const txHash = txAddLiquidity.hash;
      const txLink = `https://eth-sepolia.blockscout.com/tx/${txHash}`;

      setSuccessMessage(
        `Token deployed, liquidity added, and initial swap done! 
        <a href="${txLink}" target="_blank" rel="noopener noreferrer" className="a">
          <span>${txHash}</span>
        </a> 
        (Hash: ${txHash})`
      );
    } catch (error) {
      if (error.code === "ACTION_REJECTED") {
        setErrorMessage("Transaction failed: User rejected the transaction.");
      } else {
        console.error(error);
        setErrorMessage(`Transaction failed, please try again.`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddLiquidity() {
    setIsLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const liquidityAmountValue = liquidityAmount
        ? parseFloat(liquidityAmount)
        : 0;
      const liquidityAmountWei = ethers.parseUnits(
        liquidityAmountValue.toString(),
        18
      );

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const factoryContract = new ethers.Contract(
        factoryChainAddress,
        MyFactoryJson.abi,
        signer
      );

      // Call the addLiquidity function (assuming it exists in your factory contract)
      const txAddLiquidity = await factoryContract.addLiquidity(
        contractAddress,
        liquidityAmountWei,
        { value: liquidityAmountWei, gasLimit: 500000 }
      );
      await txAddLiquidity.wait();

      setSuccessMessage("Liquidity added successfully!");
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to add liquidity. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Helper function to get the latest event
  async function getLatestEvent(token, eventName) {
    const filter = token.filters[eventName]();
    const events = await token.queryFilter(filter);
    return events[events.length - 1];
  }

  // Babylonian method for square root calculation using BigInt
  function sqrt(value) {
    if (value < 0n)
      throw new Error("Square root of negative numbers is not supported");
    if (value === 0n) return 0n;
    let z = value;
    let x = value / 2n + 1n;
    while (x < z) {
      z = x;
      x = (value / x + x) / 2n;
    }
    return z;
  }

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />

      <h1 className="titlefactory">Get Initial LP for your token</h1>
      <h3 className="subtitlefactory">
        Click to launch your token with initial liquidity
      </h3>

      <div className="center-container">
        <div className="factory-container">
          <div></div>
          <div className="wallet-status">
            {isConnected ? (
              <p className="connected-wallet">
                Connected Wallet: {connectedWallet}
              </p>
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
            <h5 className="your-token">Your token:</h5>
            <p>Token Symbol: {tokenDetails.symbol}</p>
            <p>Total Supply: {tokenDetails.supply}</p>
            <p>
              Contract Address:{" "}
              <a
                href={`${explorerUrl}/address/${contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="a"
              >
                {contractAddress}
              </a>
            </p>

            <div className="swap-container">
              <label htmlFor="tokenAmount">Enter amount in ETH to buy:</label>
              <input
                id="tokenAmount"
                type="number"
                step="0.01"
                value={tokenAmountToBuy}
                onChange={(e) => {
                  let value = e.target.value.replace(/,/g, "."); // Standardize input by replacing commas with periods
                  if (value === "" || value.match(/^\d*\.?\d*$/)) {
                    setTokenAmountToBuy(value); // Only set the value if it matches the decimal pattern or is an empty string
                  }
                }}
                onBlur={(e) => {
                  // Format the input to four decimal places on blur, assume '0.0000' if the input is invalid or empty
                  let value = e.target.value
                    ? parseFloat(e.target.value).toFixed(4)
                    : "0.0000";
                  if (parseFloat(value) > 0.01) {
                    value = "0.0100"; // Set to max value if it exceeds the limit
                  }
                  setTokenAmountToBuy(value);
                }}
                placeholder="Token amount"
                min="0.00" // Set minimum to "0.00" to allow zero as a valid input
                max="0.01"
              />
            </div>
          </div>

          {!successMessage && (
            <button
              onClick={handleMulticall}
              className="deploy-button"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Launch Token"}
            </button>
          )}
          {successMessage && (
            <div className="success-message2">{successMessage}</div>
          )}
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          {successMessage && (
            <Link to={`/token/${contractAddress}`}>
              <button className="deploy-button">Next</button>
            </Link>
          )}
        </div>
      </div>

      <div className="liquidity-container">
        <h2>Add Liquidity</h2>
        <input
          type="number"
          value={liquidityAmount}
          onChange={(e) => setLiquidityAmount(e.target.value)}
          placeholder="Enter ETH amount for liquidity"
        />
        <button onClick={handleAddLiquidity} disabled={isLoading}>
          {isLoading ? "Adding Liquidity..." : "Add Liquidity"}
        </button>
      </div>

      <Footer />
    </div>
  );
}

export default DashboardPage;
