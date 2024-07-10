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
import { typeImplementation } from "@testing-library/user-event/dist/type/typeImplementation.js";
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
    factoryAddress: "0xcda23d39464b4c687c9A44cEbebB40660efa8ACd",
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://sepolia.etherscan.io",
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const factoryChainAddress =
    networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
  const WETH_ChainAddress =
    networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";
  const explorerUrl =
    networkConfig[chainId]?.explorerUrl || "https://etherscan.io";

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
      const swapAmount = ethers.parseUnits(tokenAmountToBuy, 18);

      // Setup for adding liquidity
      const tokenAmount = ethers.parseUnits(tokenDetails.supply, 18);
      const wethAmount = ethers.parseUnits("0.0001", 18); // Example amount of WETH
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

      setSuccessMessage(
        "Token deployed, liquidity added, and initial swap done!"
      );
    } catch (error) {
      console.error(error);
      setErrorMessage(`Operation failed: ${error.message}`);
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
        Click to launch your token with initial liquidity for free. It will be
        locked.
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
            <p>Token Name: {tokenDetails.name}</p>
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

            <div>
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
                  // Format the input to two decimal places on blur, assume '0.00' if the input is invalid or empty
                  let value = e.target.value
                    ? parseFloat(e.target.value).toFixed(2)
                    : "0.00";
                  setTokenAmountToBuy(value);
                }}
                placeholder="Token amount"
                min="0.00" // Set minimum to "0.00" to allow zero as a valid input
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
      <Footer />
    </div>
  );
}

export default DashboardPage;
