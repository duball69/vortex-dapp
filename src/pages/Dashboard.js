import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import MyTokenJson from "../contracts/MyToken.json";  // Assuming you have a separate JSON file for the deployed token
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';
import { Link, useParams } from 'react-router-dom';

function DashboardPage() {
    const { contractAddress } = useParams(); // Get the contract address from the URL
    const [tokenDetails, setTokenDetails] = useState({ name: '', symbol: '', supply: '' });
    const { address: connectedWallet, chainId, isConnected, open } = useWeb3ModalAccount();

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
            supply: supply.toString()
        });
    }

    useEffect(() => {
        fetchTokenDetails();
    }, [contractAddress, isConnected]); // Re-fetch if contractAddress or connection status changes

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            {isConnected ? (
                <>
                    <p>Connected Wallet: {connectedWallet}</p>
                    <p>Token Name: {tokenDetails.name}</p>
                    <p>Token Symbol: {tokenDetails.symbol}</p>
                    <p>Total Supply: {tokenDetails.supply}</p>
                    <p>Your Deployed Token Contract Address: <a href={`https://sepolia.etherscan.io/address/${contractAddress}`} target="_blank" rel="noopener noreferrer">{contractAddress}</a></p>
                    <Link to="/factory">Back to Factory</Link>
                </>
            ) : (
                <button onClick={connectWallet}>Connect Wallet</button>
            )}
        </div>
    );
}

export default DashboardPage;
