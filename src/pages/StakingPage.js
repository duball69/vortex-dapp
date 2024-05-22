import React, { useState } from 'react';
import { useWeb3ModalAccount, useWeb3Modal } from '@web3modal/ethers/react'; 
import Header from '../components/Header.js';
import './StakingPage.css'; 
import Footer from '../components/Footer.js';


const CHAIN_NAMES = {
    "56": "BSC",
    "42161": "Arbitrum",
    "8453": "Base",
    "11155111": "Sepolia"
};

const StakingPage = () => {
    const [stakeAmount, setStakeAmount] = useState('');
    const { address: connectedWallet, chainId, isConnected } = useWeb3ModalAccount(); 
    const { open } = useWeb3Modal();

    const connectWallet = async () => {
        try {
            await open();
        } catch (error) {
            console.error("Error connecting wallet:", error);
        }
    };

    return (
        <div>
              <Header connectWallet={connectWallet}   isConnected={isConnected} chainId={chainId} />

             <div >
             <h1 className="titlestake">Earn from every token deployed through Vortex</h1>
      <h5 className="subtitlefactory">Lend your ETH and get a share of all revenues</h5>
      <h6 className="texthome2">Currently only on Sepolia Testnet</h6>   
            </div>
              <div className="center2-container">
            
 
             <div className="staking-container">
            <h2>Vortex ETH Pool</h2>
            {!isConnected && (
                <button onClick={connectWallet}>Connect Wallet</button>
            )}
            {isConnected && (
                <>
                    <div>
                        <p>Wallet Connected: {connectedWallet}</p>
                        <input
                            type="text"
                            value={stakeAmount}
                            onChange={e => setStakeAmount(e.target.value)}
                            placeholder="Enter amount to stake (ETH)"
                        />
                        <button className="stake-button" onClick={() => alert(`Stake amount: ${stakeAmount} ETH`)}>Stake</button>
                    </div>
                </>
            
            )}
        </div></div><Footer/></div>
    );
};

export default StakingPage;
