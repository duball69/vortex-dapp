import React, { useState } from 'react';
import { useWeb3ModalAccount, useWeb3Modal } from '@web3modal/ethers/react'; 
import Header from '../components/Header.js';
import './StakingPage.css'; 
import Footer from '../components/Footer.js';

const StakingPage = () => {
    const [stakeAmount, setStakeAmount] = useState('');
    const { address: connectedWallet, isConnected } = useWeb3ModalAccount();
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
             <Header connectWallet={connectWallet} />
             <div className="center2-container">
             <div className="staking-container">
            <h1>Stake ETH</h1>
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
                        <button className="stake-button" onClick={() => alert(`Stake amount: ${stakeAmount} ETH`)}>Submit Stake</button>
                    </div>
                </>
            
            )}
        </div></div><Footer/></div>
    );
};

export default StakingPage;
