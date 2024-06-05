/* global BigInt */

import React, { useState, useEffect } from "react";
import { useWeb3ModalAccount, useWeb3Modal } from "@web3modal/ethers/react";
import Header from "../components/Header.js";
import "./StakingPage.css";
import Footer from "../components/Footer.js";
import { ethers, BrowserProvider } from "ethers";
import SimpleStakingJson from "../contracts/SimpleStaking.json";
import { firestore } from "../components/firebaseConfig.js";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";

const STAKING_POOL_ADDRESS = "0xBb182b3833b29089aE398c4d8Bf4458694Da3BEf";

const CHAIN_NAMES = {
  56: "BSC",
  42161: "Arbitrum",
  8453: "Base",
  11155111: "Sepolia",
};

const StakingPage = () => {
  const [amount, setAmount] = useState(""); // Use a single state for the input amount
  const [stakedMessage, setStakedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isStaked, setIsStaked] = useState(false);
  const [loadingStake, setLoadingStake] = useState(false);
  const [loadingUnstake, setLoadingUnstake] = useState(false);
  const [stakedAmount, setStakedAmount] = useState(0n); // Use BigInt for staked amount

  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount();
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

        const stakedAmount = await stakingPoolContract.getStake(
          connectedWallet
        );
        const stakedAmountBN = BigInt(stakedAmount.toString()); // Convert to BigInt
        if (stakedAmountBN > 0n) {
          setIsStaked(true);
          setStakedAmount(stakedAmountBN);
          setStakedMessage(
            `You have ${ethers.formatUnits(
              stakedAmountBN,
              18
            )} ETH staked in the Vortex Pool.`
          );
        } else {
          setIsStaked(false);
          setStakedMessage("You have no ETH staked in the Vortex Pool.");
        }
      } catch (error) {
        console.error("Error checking staking status:", error);
        setErrorMessage(
          "An error occurred while checking staking status. Please try again."
        );
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

  const logStakingEvent = async (action, amount) => {
    try {
      const stakingEventsCollection = collection(firestore, "stakingEvents");
      await setDoc(doc(stakingEventsCollection), {
        wallet: connectedWallet,
        action,
        amount,
        timestamp: new Date(),
        chain: CHAIN_NAMES[chainId] || `Unknown Chain (${chainId})`,
      });
      console.log("Staking event logged to Firestore");
    } catch (error) {
      console.error("Error logging staking event:", error);
    }
  };

  const handleStake = async () => {
    if (!amount) {
      setErrorMessage("Please enter an amount to stake.");
      return;
    }

    if (!ethers.isAddress(STAKING_POOL_ADDRESS)) {
      setErrorMessage("Invalid staking pool address.");
      return;
    }

    try {
      setLoadingStake(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const stakingPoolContract = new ethers.Contract(
        STAKING_POOL_ADDRESS,
        SimpleStakingJson.abi,
        signer
      );

      const tx = await stakingPoolContract.stake({
        value: ethers.parseUnits(amount, 18),
      });
      await tx.wait();

      setStakedMessage(`You staked ${amount} ETH in the Vortex Pool.`);
      setIsStaked(true);
      setErrorMessage(""); // Clear any previous error messages

      // Log staking event
      await logStakingEvent("stake", amount);

      // Update the staked amount
      const newStakedAmount = await stakingPoolContract.getStake(
        connectedWallet
      );
      setStakedAmount(BigInt(newStakedAmount.toString()));
    } catch (error) {
      console.error("Error staking ETH:", error);
      setErrorMessage("An error occurred while staking. Please try again.");
    } finally {
      setLoadingStake(false);
    }
  };

  const handleUnstake = async () => {
    if (!amount) {
      setErrorMessage("Please enter an amount to unstake.");
      return;
    }

    if (!ethers.isAddress(STAKING_POOL_ADDRESS)) {
      setErrorMessage("Invalid staking pool address.");
      return;
    }

    try {
      setLoadingUnstake(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const stakingPoolContract = new ethers.Contract(
        STAKING_POOL_ADDRESS,
        SimpleStakingJson.abi,
        signer
      );

      const tx = await stakingPoolContract.unstake(
        ethers.parseUnits(amount, 18)
      );
      await tx.wait();

      setStakedMessage(`You unstaked ${amount} ETH from the Vortex Pool.`);
      setIsStaked(false);
      setErrorMessage(""); // Clear any previous error messages

      // Log unstaking event
      await logStakingEvent("unstake", amount);

      // Update the staked amount
      const newStakedAmount = await stakingPoolContract.getStake(
        connectedWallet
      );
      setStakedAmount(BigInt(newStakedAmount.toString()));
    } catch (error) {
      console.error("Error unstaking ETH:", error);
      setErrorMessage("An error occurred while unstaking. Please try again.");
    } finally {
      setLoadingUnstake(false);
    }
  };

  return (
    <div>
      <Header
        connectWallet={connectWallet}
        isConnected={isConnected}
        chainId={chainId}
      />
      <div>
        <h1 className="titlestake">
          Earn from every token deployed through Vortex
        </h1>
        <h5 className="subtitlefactory">
          Lend your ETH and get a share of all revenues
        </h5>
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
                <p>{stakedMessage}</p>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (ETH)"
                />
                <button
                  className="stake-button"
                  onClick={handleStake}
                  disabled={loadingStake || loadingUnstake}
                >
                  {loadingStake ? "Staking..." : "Stake"}
                </button>
                {isStaked && (
                  <button
                    className="unstake-button"
                    onClick={handleUnstake}
                    disabled={loadingStake || loadingUnstake}
                  >
                    {loadingUnstake ? "Unstaking..." : "Unstake"}
                  </button>
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
