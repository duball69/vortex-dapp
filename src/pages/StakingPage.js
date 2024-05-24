


import React, { useState, useEffect } from 'react';
import { useWeb3ModalAccount, useWeb3Modal } from '@web3modal/ethers/react';
import Header from '../components/Header.js';
import './StakingPage.css';
import Footer from '../components/Footer.js';
import { ethers, BrowserProvider } from "ethers";
import SimpleStakingJson from "../contracts/SimpleStaking.json";

const STAKING_POOL_ADDRESS = "0xb4b34C9413Bf4d63D5589454114a354ac637e35E";

const CHAIN_NAMES = {
    "56": "BSC",
    "42161": "Arbitrum",
    "8453": "Base",
    "11155111": "Sepolia"
};

const StakingPage = () => {
    const [stakeAmount, setStakeAmount] = useState('');
    const [unstakeAmount, setUnstakeAmount] = useState('');
    const [stakedMessage, setStakedMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isStaked, setIsStaked] = useState(false);
    const [loading, setLoading] = useState(false);

    const { address: connectedWallet, chainId, isConnected } = useWeb3ModalAccount();
    const { open } = useWeb3Modal();

    useEffect(() => {
        const checkStakingStatus = async () => {
            if (!connectedWallet) return;

            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();

                const stakingPoolContract = new ethers.Contract(
                    STAKING_POOL_ADDRESS,
                    SimpleStakingJson.abi,
                    signer
                );

                const stakedAmount = await stakingPoolContract.balanceOf(connectedWallet); // Replace with your contract's method to get staked balance
                if (stakedAmount.gt(0)) {
                    setIsStaked(true);
                    setStakedMessage(`You have ${ethers.formatEther(stakedAmount)} ETH staked in the Vortex Pool.`);
                }
            } catch (error) {
                console.error("Error checking staking status:", error);
                setErrorMessage("An error occurred while checking staking status. Please try again.");
            }
        };

        checkStakingStatus();
    }, [connectedWallet]);

    const connectWallet = async () => {
        try {
            await open();
        } catch (error) {
            console.error("Error connecting wallet:", error);
            setErrorMessage("Error connecting wallet. Please try again.");
        }
    };

    const handleStake = async () => {
        if (!stakeAmount) {
            setErrorMessage("Please enter an amount to stake.");
            return;
        }

        if (!ethers.isAddress(STAKING_POOL_ADDRESS)) {
            setErrorMessage("Invalid staking pool address.");
            return;
        }

        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const stakingPoolContract = new ethers.Contract(
                STAKING_POOL_ADDRESS,
                SimpleStakingJson.abi,
                signer
            );

            const tx = await stakingPoolContract.stake({
                value: ethers.parseEther(stakeAmount)
            });
            await tx.wait();

            setStakedMessage(`You staked ${stakeAmount} ETH in the Vortex Pool.`);
            setIsStaked(true);
            setErrorMessage(''); // Clear any previous error messages
        } catch (error) {
            console.error("Error staking ETH:", error);
            setErrorMessage("An error occurred while staking. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUnstake = async () => {
        if (!unstakeAmount) {
            setErrorMessage("Please enter an amount to unstake.");
            return;
        }

        if (!ethers.isAddress(STAKING_POOL_ADDRESS)) {
            setErrorMessage("Invalid staking pool address.");
            return;
        }

        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            const stakingPoolContract = new ethers.Contract(
                STAKING_POOL_ADDRESS,
                SimpleStakingJson.abi,
                signer
            );

            const tx = await stakingPoolContract.unstake(ethers.parseEther(unstakeAmount));
            await tx.wait();

            setStakedMessage(`You unstaked ${unstakeAmount} ETH from the Vortex Pool.`);
            setIsStaked(false);
            setErrorMessage(''); // Clear any previous error messages
        } catch (error) {
            console.error("Error unstaking ETH:", error);
            setErrorMessage("An error occurred while unstaking. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Header connectWallet={connectWallet} isConnected={isConnected} chainId={chainId} />
            <div>
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
                                {!isStaked ? (
                                    <>
                                        <input
                                            type="text"
                                            value={stakeAmount}
                                            onChange={e => setStakeAmount(e.target.value)}
                                            placeholder="Enter amount to stake (ETH)"
                                        />
                                        <button
                                            className="stake-button"
                                            onClick={handleStake}
                                            disabled={loading}
                                        >
                                            {loading ? 'Staking...' : 'Stake'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            value={unstakeAmount}
                                            onChange={e => setUnstakeAmount(e.target.value)}
                                            placeholder="Enter amount to unstake (ETH)"
                                        />
                                        <button
                                            className="unstake-button"
                                            onClick={handleUnstake}
                                            disabled={loading}
                                        >
                                            {loading ? 'Unstaking...' : 'Unstake'}
                                        </button>
                                    </>
                                )}
                                {stakedMessage && (
                                    <p>{stakedMessage}</p>
                                )}
                                {errorMessage && (
                                    <p className="error-message">{errorMessage}</p>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default StakingPage;
