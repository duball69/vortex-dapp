import React, { useState } from 'react';
import { ethers } from "ethers";
import MyFactoryJson from "../contracts/MyFactory.json"; // Import JSON 
import { JsonRpcProvider } from "ethers/providers";

function FactoryPage() {
    const [contractAddress, setContractAddress] = useState(null);

    async function deployToken() {
        try {
            const providerUrl = "https://eth-sepolia.g.alchemy.com/v2/M87svOeOrOhMsnQWJXB8iQECjn8MJNW0"; // Ensure quotes around URL
            const privateKey = "0x7388479fffd177a96efa0ca7e9596f0ea1478e090c9082a427052129c3d53df6"; // Ensure quotes and correct format
            
            const provider = new JsonRpcProvider(providerUrl); // Initialize JsonRpcProvider with Alchemy URL
            const wallet = new ethers.Wallet(privateKey, provider); // Create a wallet using the private key and provider

            const tokenName = "Etnica";
            const tokenSymbol = "ET";
            const tokenSupply = 30000;

            const factoryAddress = "0x8073bef1728a47dA7C370842A1D2a41af7761a0c";
            const factoryAbi = MyFactoryJson.abi; // Use imported JSON ABI
            
            const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, wallet);

            const tx = await factoryContract.deployToken(tokenName, tokenSymbol, tokenSupply);
            const receipt = await tx.wait();

            if (receipt.logs && receipt.logs.length > 0) {
                const tokenDeployedEvent = receipt.logs.find(
                    (log) => log.address.toLowerCase() === factoryAddress.toLowerCase() &&
                              log.topics[0] === '0x91d24864a084ab70b268a1f865e757ca12006cf298d763b6be697302ef86498c'
                );

                if (tokenDeployedEvent) {
                    const tokenAddress = tokenDeployedEvent.args[0];
                    console.log('Your new contract address is:', tokenAddress);
                    setContractAddress(tokenAddress); // Update contract address state
                } else {
                    console.error('Token deployment event not found in transaction receipt');
                }
            } else {
                console.error('No logs found in transaction receipt');
            }
        } catch (error) {
            console.error("Error during deployment:", error);
        }
    }

    return (
        <div>
            <h1>Create Your Token</h1>
            <button onClick={deployToken}>Deploy Token</button>
            {contractAddress && <p>Contract Address: {contractAddress}</p>}
        </div>
    );
}

export default FactoryPage;
