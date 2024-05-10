import React, { useState } from 'react';
import { ethers,  BrowserProvider } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";
import './FactoryPage.css';
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';


const projectId = '9513bcef54af049b9471faff11d5a16a';

const sepoliaMainnet = {
    chainId: 11155111,
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io/',
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/M87svOeOrOhMsnQWJXB8iQECjn8MJNW0'
};

const metadata = {
  name: 'LP Provider Labs',
  description: 'Description of your DApp',
  url: 'https://your-dapp-url.com',
  icons: ['https://your-dapp-url.com/favicon.ico']
};

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
  rpcUrl: '...',
  defaultChainId: 1
});

const web3Modal = createWeb3Modal({ ethersConfig, chains: [sepoliaMainnet], projectId, enableAnalytics: true });


function FactoryPage() {
    const [contractAddress, setContractAddress] = useState(null);
    const [tokenName, setTokenName] = useState("");
    const [tokenSymbol, setTokenSymbol] = useState("");
    const [tokenSupply, setTokenSupply] = useState("");
    const { address: connectedWallet, chainId, isConnected } = useWeb3ModalAccount(); // Retrieve client's information
    const { open, close } = useWeb3Modal();

   
    async function connectWallet() {
        try {
            open(); // Open the Web3Modal modal
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    }
    
    async function deployToken(e) {
        e.preventDefault();
    
        try {
            // Check if wallet is connected
            if (!isConnected) {
                console.error("Wallet is not connected");
                return;
            }
    

            // Get the signer from the 
            const provider = new ethers.BrowserProvider(window.ethereum);
            // It will prompt user for account connections if it isnt connected
            const signer = await provider.getSigner();
            console.log("Account:", await signer.getAddress()); 
    
            // Prepare contract deployment data
            const factoryAddress = "0x8073bef1728a47dA7C370842A1D2a41af7761a0c";
            const factoryAbi = MyFactoryJson.abi;
            const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, signer);
    
            // Create transaction data for deploying the contract
            const tx = await factoryContract.deployToken(tokenName, tokenSymbol, tokenSupply);
            
            // Send the transaction to the Ethereum network
            const txResponse = await signer.sendTransaction(tx);
            await txResponse.wait(); // Wait for transaction confirmation
    
            // Retrieve contract address from transaction receipt
            const { contractAddress } = txResponse;
            console.log('Your new contract address is:', contractAddress);
            setContractAddress(contractAddress);
        } catch (error) {
            console.error("Error during deployment:", error);
        }
    }
    

    return (
        <div className="center-container">
            <div className="factory-container">
                <h1>Create Your ERC20 Token</h1>
                <button type="button" className="connect-button" onClick={connectWallet}>Connect Wallet</button>
                {isConnected && <p>Connected Wallet: {connectedWallet}</p>} {/* Display connected wallet address */}
                <form onSubmit={deployToken} className="token-form">
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
                        onChange={(e) => setTokenSupply(e.target.value)}
                        placeholder="Total Supply"
                        className="input"
                    />
                    <br />

                    <button type="submit" className="deploy-button">Deploy Token</button>
                </form>
                {contractAddress && <p className="contract-address">Contract Address: {contractAddress}</p>}
            </div>
        </div>
    );
}

export default FactoryPage;