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
        // Use BigInt for price ratio calculations to ensure precision
        const token1AmountBigInt = BigInt(token1Amount);
        const token0AmountBigInt = BigInt(token0Amount);
    
        // Calculate the price ratio as token1 / token0, scaled up to maintain precision
        const priceRatio = (token1AmountBigInt * 10n**14n) / token0AmountBigInt;
    
        // Calculate the square root of the price ratio
        const sqrtPriceRatio = sqrtBigInt(priceRatio);
    
        // Now calculate sqrtPriceX96   
        const sqrtPriceX96 = (sqrtPriceRatio * 2n**96n) / 10n**9n;
    
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
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(contractAddress, MyTokenJson.abi, provider);
        const name = await tokenContract.name();
        const symbol = await tokenContract.symbol();
        const supply = await tokenContract.totalSupply();

        setTokenDetails({
            name,
            symbol,
            supply: supply.toString()/10**18,
            
        });
    }
    async function createPair() {
        if (!contractAddress || !isConnected) return;
    
        try {
            // Check if wallet is connected
            if (!isConnected) {
                console.error("Wallet is not connected");
                return;
            }

            setIsCreatingPair(true); 
    
            // Get the signer from the provider
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            console.log("Account:", await signer.getAddress()); 
    
            // Prepare contract interaction with factory contract
            const factoryAddress = "0x5f0Cc56D44596396E70F619e21CbB8F9eB1641D6"; // Replace with your actual factory contract address
            const factoryAbi = MyFactoryJson.abi;
            const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, signer);
    
            // Call the function to create the pair on the factory contract
            const txResponse = await factoryContract.createPoolForToken(contractAddress);
            console.log("Transaction sent: ", txResponse.hash);
    
            // Wait for the transaction to be mined
            const receipt = await txResponse.wait();
            console.log("Block number: ", receipt.blockNumber);
    
            // Accessing logs for emitted events
            const logs = receipt.logs;
            console.log("Logs found: ", logs.length);
            setIsCreatingPair(false); 
    
            if (logs && logs.length > 0) {
                // Process the logs if needed
                console.log("Logs:", logs);
                const poolAddress = receipt.logs[1].args[1];
                console.log("Deployed Pool Address:", poolAddress);
                setDeployedPoolAddress(poolAddress);
            } else {
                console.error("No logs found in the transaction receipt.");
            }
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
            const factoryAddress = "0x5f0Cc56D44596396E70F619e21CbB8F9eB1641D6"; // Replace with your actual factory contract address
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
    

    async function addLiquidity() {
        if (!deployedPoolAddress || !isConnected) {
            console.error("Deployed pool address not set or wallet not connected");
            return;
        }
    
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factoryAddress = "0x5f0Cc56D44596396E70F619e21CbB8F9eB1641D6"; 
            const factoryContract = new ethers.Contract(factoryAddress, MyFactoryJson.abi, signer);

            const positionManager_address = "0x1238536071E1c677A632429e3655c799b22cDA52";
            const WETH_address = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"; 
    
            // Assuming these amounts are defined or passed in from component state
            const tokenAmount = ethers.parseUnits(String(tokenDetails.supply)); // Assume tokenDetails.supply is available
            console.log(tokenAmount);
            const wethAmount = ethers.parseUnits("0.01", 18); // Fixed amount of WETH to be used
    
            // Approve the tokens for the factory contract
            await factoryContract.approveToken(contractAddress, positionManager_address, tokenAmount);
            await factoryContract.approveToken(WETH_address, positionManager_address, wethAmount);
    
            // Add liquidity using the simplified method similar to your script
            const tx = await factoryContract.addInitialLiquidity(contractAddress, deployedPoolAddress, factoryAddress, tokenAmount, wethAmount, {
                gasLimit: 5000000 // Higher gas limit
            });
            await tx.wait();
    
            console.log("Liquidity added successfully!");
    
        } catch (error) {
            console.error("Error adding liquidity:", error);
        }
    };
    
    

    useEffect(() => {
        fetchTokenDetails();
    }, [contractAddress, isConnected]); // Re-fetch if contractAddress or connection status changes

    return (
        <div>
            <Header connectWallet={connectWallet} />
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

