import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";  // Assuming you have a separate JSON file for the deployed 
import MyTokenJson from "../contracts/MyToken.json";
import PositionManagerJson from "../contracts/PositionManager.json";
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount, open } from '@web3modal/ethers/react';
import { Link, useParams } from 'react-router-dom';
import './Dashboard.css';
import Header from '../components/Header.js';
import Footer from '../components/Footer.js';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../components/firebaseConfig.js';
/* global BigInt */

function DashboardPage() {
    const { contractAddress } = useParams(); // Get the contract address from the URL
    const [tokenDetails, setTokenDetails] = useState({ name: '', symbol: '', supply: ''});
    const { address: connectedWallet, chainId, isConnected } = useWeb3ModalAccount();
    const { open, close } = useWeb3Modal();
    const [deployedPoolAddress, setDeployedPoolAddress] = useState("");
    const [isCreatingPair, setIsCreatingPair] = useState(false);



    function sqrtBigInt(value) {
        if (value < 0n) {
            throw new Error("Square root of negative numbers is not supported");
        }
        if (value === 0n) return 0n;
        let z = value;
        let x = (value / 2n) + 1n;
        while (x < z) {
            z = x;
            x = (value / x + x) / 2n;
        }
        return z;
    }
    
    function calculateSqrtPriceX96(token1Amount, token0Amount) {
        // Convert the token amounts to BigInt to ensure precision in calculations
        const token1AmountBigInt = BigInt(token1Amount);
        const token0AmountBigInt = BigInt(token0Amount);
    
        // Calculate the price ratio as token1 / token0, scaled up by 10^18 to maintain precision
        const priceRatio = (token1AmountBigInt * BigInt(10 ** 18)) / token0AmountBigInt;
    
        // Calculate the square root of the price ratio
        const sqrtPriceRatio = sqrtBigInt(priceRatio);
    
        // Scale the square root to the sqrtPriceX96 format required by Uniswap V3
        // This requires scaling to a fixed-point representation with 96 bits to the right of the binary point.
        const sqrtPriceX96 = (sqrtPriceRatio * BigInt(2 ** 96)) / BigInt(10 ** 18);
    
        return sqrtPriceX96;
    }
    



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
        const tokenContract = new ethers.Contract(contractAddress, MyTokenJson.abi, provider);
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const supply = await tokenContract.totalSupply();
    
        // Fetch token image URL from Firestore
        const tokensCollection = collection(firestore, 'tokens');
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
            supply: (supply.toString() / 10**18).toString(),
            imageUrl  // Add image URL to state
        });
    }


    async function createPair() {
        if (!contractAddress || !isConnected) {
            console.error("Attempted to create pair without a contract address or disconnected wallet.");
            return;
        }
    
        setIsCreatingPair(true);
    
        try {
            const provider = new ethers.BrowserProvider(window.ethereum); // Correct provider type for web browsers
            const signer = await provider.getSigner();
    
            const factoryAddress = "0xc292736de88D445e6931EF8CFc564aBef7bA037d";
            const WETH_address = "0xc778417E063141139Fce010982780140Aa0cD5Ab";
    
            const factoryContract = new ethers.Contract(factoryAddress, MyFactoryJson.abi, signer);
            
            let token0, token1;
            if (contractAddress.toLowerCase() < WETH_address.toLowerCase()) {
                token0 = contractAddress;
                token1 = WETH_address;
            } else {
                token0 = WETH_address;
                token1 = contractAddress;
            }
    
            const txResponse = await factoryContract.createPoolForToken(token0, token1);
            console.log("Transaction sent. Waiting for confirmation...", txResponse.hash);
    
            const receipt = await txResponse.wait();
            console.log("Transaction confirmed in block", receipt.blockNumber);
    
            // Log all logs in the transaction receipt
            console.log("Logging all transaction logs:");
            receipt.logs.forEach((log, index) => {
                console.log(`Log #${index + 1}:`, log);
            });
    
            const poolCreatedEvent = receipt.events?.find(e => e.event === "PoolCreated");
            if (poolCreatedEvent) {
                const poolAddress = poolCreatedEvent.args[1]; // Access the pool address assuming it's the second argument
                setDeployedPoolAddress(poolAddress);
                console.log("Deployed Pool Address:", poolAddress);
            } else {
                console.error("PoolCreated event not found in the transaction receipt.");
            }
    
            setIsCreatingPair(false);
        } catch (error) {
            console.error("Error creating pair:", error);
            setIsCreatingPair(false);
        }
    }
    

    const initializePool = async (token1Amount, token0Amount) => {
        if (!deployedPoolAddress || !isConnected) return;
    
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factoryAddress = "0xc292736de88D445e6931EF8CFc564aBef7bA037d"; // Replace with your actual factory contract address
            const factoryContract = new ethers.Contract(factoryAddress, MyFactoryJson.abi, signer);
            console.log(deployedPoolAddress);

            
            const token1Amount = ethers.parseUnits(String(tokenDetails.supply)); // Assuming this is a string of total supply in wei
            console.log("Token Supply to add:", token1Amount); //working
            const token0Amount = ethers.parseUnits("0.01", 18); 
            console.log("WETH to add to LP:",token0Amount);
            
            if (!token1Amount || !token0Amount) {
                console.error("Token amounts must be provided");
                return;
            }
    
            const sqrtPriceX96 = calculateSqrtPriceX96(token1Amount, token0Amount); // Ensure these are passed correctly
            console.log(sqrtPriceX96);
            const initializeResponse = await factoryContract.initializePool(deployedPoolAddress, sqrtPriceX96);
            await initializeResponse.wait();
            console.log("Pool initialized successfully!");
        } catch (error) {
            console.error("Error initializing pool:", error);
        }
    };
    
    const addLiquidity = async () => {
        if (!deployedPoolAddress || !isConnected) {
            alert("Deployed pool address not set or wallet not connected");
            return;
        }
    
        const signer = provider.getSigner();
        const factoryAddress = "0xc292736de88D445e6931EF8CFc564aBef7bA037d"; // Ensure this is correct
        const factoryContract = new ethers.Contract(factoryAddress, MyFactoryJson.abi, signer);
    
        const token0Address = "0xc778417E063141139Fce010982780140Aa0cD5Ab"; // WETH
        const token1Address = contractAddress; // Your token
        const token0Amount = ethers.utils.parseUnits("10", 18); // Example amount for WETH
        const token1Amount = ethers.utils.parseUnits("10", 18); // Example amount for your token
    
        try {
            // Check for sufficient approvals here, if necessary
            await factoryContract.addInitialLiquidity(
                token0Address, token1Address, deployedPoolAddress, token0Amount, token1Amount, {
                gasLimit: 5000000
            }).then((tx) => {
                console.log("Transaction sent. Waiting for confirmation...");
                return tx.wait();
            }).then((result) => {
                console.log("Liquidity added successfully!", result);
            });
        } catch (error) {
            console.error("Error adding liquidity:", error);
            alert("Error adding liquidity: " + (error.data?.message || error.message));
        }
    };
    

    useEffect(() => {
        fetchTokenDetails();
    }, [contractAddress, isConnected]); // Re-fetch if contractAddress or connection status changes

    return (
        <div>
            <Header connectWallet={connectWallet}   isConnected={isConnected} chainId={chainId} />
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
        {tokenDetails.imageUrl && <img src={tokenDetails.imageUrl} alt={tokenDetails.name} className="token-image" />}
            <p>Token Name: {tokenDetails.name}</p>
            <p>Token Symbol: {tokenDetails.symbol}</p>
            <p>Total Supply: {tokenDetails.supply}</p>
            <p>Your Deployed Token Contract Address: <a href={`https://sepolia.etherscan.io/address/${contractAddress}`} target="_blank" rel="noopener noreferrer">{contractAddress}</a></p>
        </div>
        <div className="create-pair-button">
            {isConnected && (
                <button onClick={createPair} className="deploy-button">
                    {isCreatingPair? (
                            "Loading..." // Display "Loading..." if isLoading is true
                        ) : (
                            "Create Pool" // Otherwise, display the button text
                        )}
                </button>
            )}
        </div>

        <button onClick={initializePool} className="deploy-button">
            Initialize Pool
            </button>

            <button onClick={addLiquidity} className="deploy-button">
            Get LP
            </button>
        {deployedPoolAddress && (
            <p>Your new deployed pool address is: <a href={`https://sepolia.etherscan.io/address/${deployedPoolAddress}`} target="_blank">{deployedPoolAddress}</a></p>
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