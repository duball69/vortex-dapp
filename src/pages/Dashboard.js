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
import { typeImplementation } from '@testing-library/user-event/dist/type/typeImplementation.js';
/* global BigInt */



const networkConfig = {
    // Example Chain IDs for Base and Sepolia
    8453: { // Mainnet (as an example; replace with the correct ID for "base")
      factoryAddress: "0x4301B64C8b4239EfBEb5818F968d1cccf4a640E0",
      WETH_address: "0x4200000000000000000000000000000000000006"
    },
    11155111: { // Sepolia Testnet Chain ID
      factoryAddress: "0x6b2e54664164b146217c3cddeb1737da9c91409a",
      WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"
    }
  };


function DashboardPage() {
    const { contractAddress } = useParams(); // Get the contract address from the URL
    const [tokenDetails, setTokenDetails] = useState({ name: '', symbol: '', supply: ''});
    const { address: connectedWallet, chainId, isConnected } = useWeb3ModalAccount();
    const { open, close } = useWeb3Modal();
    const [deployedPoolAddress, setDeployedPoolAddress] = useState("");
    const [isCreatingPair, setIsCreatingPair] = useState(false);
    const [isPoolInitializing, setIsPoolInitializing] = useState(false);
    const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const factoryChainAddress = networkConfig[chainId]?.factoryAddress || "DefaultFactoryAddress";
    const WETH_ChainAddress = networkConfig[chainId]?.WETH_address || "DefaultWETHAddress";

   
    // Effect to log and set factory address only when chainId changes
    useEffect(() => {
        if (!isInitialized && chainId) {
         
          console.log("Factory Address initialized:", factoryChainAddress);
          console.log("WETH Address initialized:", WETH_ChainAddress);
          setIsInitialized(true); // Prevent further initialization logs
        }
      }, [chainId, isInitialized]); 
    

            
    useEffect(() => {
        const savedPoolAddress = localStorage.getItem('deployedPoolAddress');
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
            console.error("createPair called without a connected wallet or valid contract address.");
            return;
        }
    
        setIsCreatingPair(true);
    
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            console.log("Using account:", await signer.getAddress());
    
            const factoryContract = new ethers.Contract(factoryChainAddress, MyFactoryJson.abi, signer);
    
            let token0, token1;
            
    
            if (contractAddress.toLowerCase() < WETH_ChainAddress.toLowerCase()) {
                token0 = contractAddress;
                token1 = WETH_ChainAddress;
               
            } else {
                token0 = WETH_ChainAddress;
                token1 = contractAddress;
     }
    
    
            console.log(`Attempting to create pool with token0: ${token0} and token1: ${token1}`);
            const txResponse = await factoryContract.createPoolForToken(token0, token1);
            // Wait for the transaction to be mined
            const receipt = await txResponse.wait();
      
    
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


    
    function calculateSqrtPriceX96(token1Amount, token0Amount) {

        
        console.log("Token0amount:",token0Amount);
        console.log("Token1amount:",token1Amount);   
        
        
        // Calculate the price ratio as token1 / token0, scaled up by 10^18 to maintain precision
        const priceRatio = BigInt(token1Amount)* BigInt(10 ** 18) / BigInt(token0Amount);
   
        console.log("Price ratio:",priceRatio);
    
        // Calculate the square root of the price ratio, convert it to a number to handle floating-point operations
        const sqrtPriceRatio = Math.sqrt(Number(priceRatio));
    console.log(sqrtPriceRatio);
    console.log("sqrtpricerati:",sqrtPriceRatio)
        // Adjust the floating point result before converting it back to BigInt
        const adjustedSqrtPriceRatio = Math.floor(sqrtPriceRatio * 10 ** 9); // Adjust by scaling up to preserve precision
    
        // Convert the adjusted result to BigInt and then scale it to sqrtPriceX96 format
        const sqrtPriceX96 = BigInt(adjustedSqrtPriceRatio) * BigInt(2 ** 96) / BigInt(10 ** 18);
    console.log("sqrtpriceratio96:",sqrtPriceX96)
        return sqrtPriceX96.toString();  // Return as string to avoid further BigInt conversion issues in ethers.js


        
    }
    
    

    async function initializePool() {
        if (!deployedPoolAddress || !tokenDetails.supply) {
            console.error("Both pool address and token supply are required.");

            setIsPoolInitializing(false);
        
            return;
        }
    
        setIsPoolInitializing(true);
    
        
        let token0, token1, token0Amount, token1Amount;
           
            console.log(tokenDetails.supply);
           
            const tokenAmount = ethers.parseUnits(String(tokenDetails.supply), 18); // Total supply for your token
            const wethAmount = ethers.parseUnits("0.0001", 18); // 0.01 WETH
    

        if (contractAddress.toLowerCase() < WETH_ChainAddress.toLowerCase()) {
            token0 = contractAddress;
            token1 = WETH_ChainAddress;
            token0Amount = tokenAmount;
            token1Amount = wethAmount;
        } else {
            token0 = WETH_ChainAddress;
            token1 = contractAddress; 
            token0Amount = wethAmount;
            token1Amount = tokenAmount;
        }

        const sqrtPriceX96 = calculateSqrtPriceX96(token1Amount.toString(), token0Amount.toString());
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factoryContract = new ethers.Contract(factoryChainAddress, MyFactoryJson.abi, signer);
            const txResponse = await factoryContract.initializePool(deployedPoolAddress, sqrtPriceX96);
            await txResponse.wait();
            console.log("Pool initialized successfully!");
        } catch (error) {
            console.error("Failed to initialize pool:", error);
            setIsPoolInitializing(false);
        
            // Handle specific failure actions here if necessary
        } finally {
            // Always stop showing "Initializing..." regardless of success or failure
            setIsPoolInitializing(false);
        }
    }    


    async function addLiquidity() {
        if (!deployedPoolAddress || !isConnected) {
            console.error("Deployed pool address not set or wallet not connected");
            return;
        }
    
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factoryContract = new ethers.Contract(factoryChainAddress, MyFactoryJson.abi, signer);
            
            // Determine tokens and their amounts based on address comparison
            let token0, token1, token0Amount, token1Amount;
            
            const tokenAmount = ethers.parseUnits(String(tokenDetails.supply), 18); // Total supply for your token
            const wethAmount = ethers.parseUnits("0.0001", 18); // 0.01 WETH
    
            if (contractAddress.toLowerCase() < WETH_ChainAddress.toLowerCase()) {
                token0 = contractAddress;
                token1 = WETH_ChainAddress;
                token0Amount = tokenAmount;
                token1Amount = wethAmount;
            } else {
                token0 = WETH_ChainAddress;
                token1 = contractAddress;
                token0Amount = wethAmount;
                token1Amount = tokenAmount;
            }
    
            console.log(`Adding liquidity with token0: ${token0} (amount: ${token0Amount.toString()}) and token1: ${token1} (amount: ${token1Amount.toString()})`);
    
            // Approve the tokens for the factory contract
            await factoryContract.approveToken(token0, deployedPoolAddress, token0Amount);
            await factoryContract.approveToken(token1, deployedPoolAddress, token1Amount);
    
            // Add liquidity using the simplified method
            const tx = await factoryContract.addInitialLiquidity(
                token0,
                token1,
                deployedPoolAddress,
                token0Amount,
                token1Amount,
                {
                    gasLimit: 5000000 // Higher gas limit if necessary
                }
            );
            await tx.wait();
            console.log("Liquidity added successfully!");
        } catch (error) {
            console.error("Error adding liquidity:", error);
        }
    }
    
    
    

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

        <button disabled={isPoolInitializing} className="deploy-button" onClick={initializePool}>
    {isPoolInitializing ? 'Initializing...' : 'Initialize Pool'}
</button>

        
            <button disabled={isAddingLiquidity} className="deploy-button" onClick={addLiquidity}>
    {isAddingLiquidity ? 'Adding Liquidity...' : 'Add Liquidity'}
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