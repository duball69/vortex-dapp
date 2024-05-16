import React, { useState } from 'react';
import { ethers,  BrowserProvider } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json";
import './FactoryPage.css';
import { createWeb3Modal, defaultConfig, useWeb3Modal, useWeb3ModalAccount } from '@web3modal/ethers/react';
import { Link } from 'react-router-dom';


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
    const [deployedContractAddress, setDeployedContractAddress] = useState("");


   
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
    
            // Get the signer from the provider
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            console.log("Account:", await signer.getAddress()); 
    
            // Prepare contract deployment data
            const factoryAddress = "0xEc920653009D228D044cEAF59563b2d41c07eA6F";
            const factoryAbi = MyFactoryJson.abi;
            const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, signer);
    
            // Create transaction data for deploying the contract
            const txResponse = await factoryContract.deployToken(tokenName, tokenSymbol, tokenSupply);
            console.log("Transaction sent: ", txResponse.hash);
    
            // Wait for the transaction to be mined
            const receipt = await txResponse.wait();
            console.log("Block number: ", receipt.blockNumber);
    
            // Accessing logs for emitted events
            const logs = receipt.logs;
            console.log("Logs found: ", logs.length);
           
            console.log("Complete Receipt: ", receipt); 
     
            if (receipt.logs && receipt.logs.length > 0) {
                const contractAddress = receipt.logs[0].address;
                console.log("Deployed Token Contract Address:", contractAddress);
                setDeployedContractAddress(contractAddress);  // Update state with the contract address
            } else {
                console.error("No logs found in the transaction receipt.");
            }
        } catch (error) {
    
            console.error("Error during transaction:", error);
        }
    }

    return (
        <div>
            <button type="button" className="connect-button" onClick={connectWallet}>Connect Wallet</button>
        <div className="center-container">
             
            <div className="factory-container">
                <h1>Create Your ERC20 Token</h1>
               
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
                {deployedContractAddress && (
                <>
                    <p>Your new token is deployed at: <a href={`https://sepolia.etherscan.io/address/${deployedContractAddress}`} target="_blank">{deployedContractAddress}</a></p>
                    <Link to={`/dashboard/${deployedContractAddress}`}>Go to Dashboard</Link>

                </>
            )}
                           </div>
                            </div></div>
    );
}

export default FactoryPage;