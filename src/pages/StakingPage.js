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

const STAKING_POOL_ADDRESS = "0xf234A8d33CeE3D3e084a5C47D3f87f32501BadAC";

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
  const [pendingUnstake, setPendingUnstake] = useState(0n);
  const [canUnstake, setCanUnstake] = useState(true);

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

        // Fetch the staked amount
        const stakedAmount = await stakingPoolContract.getStake(
          connectedWallet
        );
        const stakedAmountBN = BigInt(stakedAmount.toString()); // Convert to BigInt

        // Fetch pending unstakes
        const pendingUnstakes = await fetchPendingUnstakes(connectedWallet);
        const pendingUnstakesBN = BigInt(pendingUnstakes.toString()); // Convert to BigInt

        // Set the pending unstakes state
        setPendingUnstake(pendingUnstakesBN);

        console.log(
          `Fetched staked amount: ${stakedAmount.toString()}, Fetched pending unstakes: ${pendingUnstakes.toString()}`
        );

        console.log(
          `Converted staked amount: ${stakedAmountBN}, Converted pending unstakes: ${pendingUnstakesBN}`
        );

        const availableForUnstake = stakedAmountBN - pendingUnstakesBN; // Calculate the available amount

        if (availableForUnstake > 0n) {
          setIsStaked(true);
          setStakedAmount(stakedAmountBN);
          setCanUnstake(true);
          setStakedMessage(
            `You have ${ethers.formatEther(
              availableForUnstake
            )} ETH available for unstaking in the Vortex Pool.`
          );
        } else {
          setIsStaked(stakedAmountBN > 0n); // Only set to false if no ETH is staked at all
          setCanUnstake(false);
          setStakedMessage(
            availableForUnstake < 0n
              ? "You have pending unstake requests that exceed or match your staked amount. You cannot unstake more ETH at this time."
              : "Stake your ETH to start earning."
          );
        }
      } catch (error) {
        console.error("Error checking staking status:", error);
        setErrorMessage(
          "An error occurred while checking staking status. Please try again."
        );
      }
    };

    checkStakingStatus();
  }, [connectedWallet]); // Removed `amount` from dependencies if it's not needed

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
      await tx.wait(); // Ensure you wait for the transaction to be mined

      // After successful staking, refetch the relevant data
      const newStakedAmount = await stakingPoolContract.getStake(
        connectedWallet
      );
      const newPendingUnstakes = await stakingPoolContract.pendingUnstakes(
        connectedWallet
      );

      const stakedAmountBN = BigInt(newStakedAmount.toString());
      const pendingUnstakesBN = BigInt(newPendingUnstakes.toString());

      setStakedAmount(stakedAmountBN);
      setPendingUnstake(pendingUnstakesBN);

      const availableForUnstake = stakedAmountBN - pendingUnstakesBN;
      setIsStaked(stakedAmountBN > 0n);
      setCanUnstake(availableForUnstake > 0n);

      setStakedMessage(`You staked ${amount} ETH in the Vortex Pool.`);
      setErrorMessage(""); // Clear any error messages

      setLoadingStake(false);
    } catch (error) {
      console.error("Error staking ETH:", error);
      setErrorMessage("An error occurred while staking. Please try again.");
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

      const txResponse = await stakingPoolContract.unstake(
        ethers.parseUnits(amount, 18)
      );
      const receipt = await txResponse.wait(); // Wait for transaction to be mined

      // Fetch the updated staked amount and pending unstakes
      const updatedStakedAmount = await stakingPoolContract.getStake(
        connectedWallet
      );
      const updatedPendingUnstakes = await stakingPoolContract.pendingUnstakes(
        connectedWallet
      );

      setStakedAmount(BigInt(updatedStakedAmount.toString()));
      setPendingUnstake(BigInt(updatedPendingUnstakes.toString()));

      const availableForUnstake =
        BigInt(updatedStakedAmount) - BigInt(updatedPendingUnstakes);

      // Check the logs to determine the correct event
      const unstakeQueuedEvent = receipt.events?.find(
        (e) => e.event === "UnstakeQueued"
      );
      const unstakeProcessedEvent = receipt.events?.find(
        (e) => e.event === "UnstakeProcessed"
      );

      if (unstakeProcessedEvent) {
        setStakedMessage(`You have successfully unstaked ${amount} ETH.`);
      } else if (unstakeQueuedEvent) {
        setStakedMessage(
          "Your unstake request is queued. It will be processed as funds become available."
        );
      } else {
        setStakedMessage(
          "You have pending unstake requests that exceed or match your staked amount. You cannot unstake more ETH at this time."
        );
      }

      setIsStaked(updatedStakedAmount > 0n);
      setLoadingUnstake(false);
      setErrorMessage(""); // Clear any previous error messages
    } catch (error) {
      console.error("Error unstaking ETH:", error);
      setErrorMessage("An error occurred while unstaking. Please try again.");
      setLoadingUnstake(false); // Ensure loading is set to false even on error
    }
  };

  async function fetchPendingUnstakes(userAddress) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const stakingContract = new ethers.Contract(
      STAKING_POOL_ADDRESS,
      SimpleStakingJson.abi,
      signer
    );

    let totalPendingUnstakes = BigInt(0);
    const queueLength = await stakingContract.getUnstakeQueueLength();
    for (let i = 0; i < queueLength; i++) {
      const request = await stakingContract.getUnstakeRequest(i);
      if (request.user.toLowerCase() === userAddress.toLowerCase()) {
        totalPendingUnstakes += BigInt(request.amount.toString());
      }
    }

    // Log the total pending unstakes to the console
    console.log(
      `Total pending unstakes for ${userAddress}: ${totalPendingUnstakes.toString()}`
    );

    return totalPendingUnstakes;
  }

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
                {pendingUnstake > 0n && ( // Only display if there are pending unstakes
                  <p>
                    Pending amount unstaking:{" "}
                    {ethers.formatEther(pendingUnstake.toString())} ETH
                  </p>
                )}
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

                {isStaked && canUnstake && (
                  <button
                    className="unstake-button"
                    onClick={handleUnstake}
                    disabled={loadingStake || loadingUnstake || !canUnstake}
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
