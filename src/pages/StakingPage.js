/* global BigInt */

import React, { useState, useEffect } from "react";
import { useWeb3ModalAccount, useWeb3Modal } from "@web3modal/ethers/react";
import Header from "../components/Header.js";
import "./StakingPage.css";
import Footer from "../components/Footer.js";
import { ethers, BrowserProvider } from "ethers";
import SimpleStakingJson from "../contracts/SimpleStaking.json";
import { firestore } from "../components/firebaseConfig.js";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  increment,
  gt,
} from "firebase/firestore";

const CHAIN_NAMES = {
  56: "BSC",
  42161: "Arbitrum",
  8453: "Base",
  11155111: "Sepolia",
  10: "Optimism",
  42220: "Celo",
};

const networkConfig = {
  //base
  8453: {
    stakingAddress: "0xAC4A1fD60e7a33c4cD89F7D08Dc2D61dB6B940C6",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://base.blockscout.com/",
  },

  //bsc
  56: {
    stakingAddress: "0x4301B64C8b4239EfBEb5818F968d1cccf4a640E0",
    WETH_address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", //WBNB
    explorerUrl: "https://bscscan.com/",
  },

  //sepolia
  11155111: {
    stakingAddress: "0x73d11D624f3cAf8D649CAE5712e00e72a98a0a61",
    WETH_address: "0xfff9976782d46cc05630d1f6ebab18b2324d6b14",
    explorerUrl: "https://sepolia.etherscan.io",
  },

  //arbitrum
  42161: {
    stakingAddress: "0x4301B64C8b4239EfBEb5818F968d1cccf4a640E0",
    WETH_address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    explorerUrl: "https://arbitrum.blockscout.com/",
  },

  //optimism
  10: {
    stakingAddress: "0x7AB122db3DD3f11bf0558caeFD9Bb2fA7CedEBee",
    WETH_address: "0x4200000000000000000000000000000000000006",
    explorerUrl: "https://optimism.blockscout.com/",
  },

  //celo
  42220: {
    stakingAddress: "0x7AB122db3DD3f11bf0558caeFD9Bb2fA7CedEBee",
    WETH_address: "0x471EcE3750Da237f93B8E339c536989b8978a438", //CELO
    explorerUrl: "https://explorer.celo.org/mainnet/",
  },
};

const StakingPage = () => {
  const [amount, setAmount] = useState("");
  const [stakedMessage, setStakedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isStaked, setIsStaked] = useState(false);
  const [loadingStake, setLoadingStake] = useState(false);
  const [loadingUnstake, setLoadingUnstake] = useState(false);
  const [stakedAmount, setStakedAmount] = useState(0n);
  const [pendingUnstake, setPendingUnstake] = useState(0n);
  const [canUnstake, setCanUnstake] = useState(true);
  const {
    address: connectedWallet,
    chainId,
    isConnected,
  } = useWeb3ModalAccount();
  const { open } = useWeb3Modal();
  const [pendingRewards, setPendingRewards] = useState("0.0000");
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [apy, setApy] = useState("Calculating...");
  const explorerUrl =
    networkConfig[chainId]?.explorerUrl || "https://base.blockscout.com/";
  const StakingChainAddress =
    networkConfig[chainId]?.stakingAddress || "DefaultFactoryAddress";
  const [isInitialized, setIsInitialized] = useState(false);
  const [totalStaked, setTotalStaked] = useState("0.0000");
  const [totalRewards, setTotalRewards] = useState("0.0000");

  useEffect(() => {
    if (!isInitialized && chainId && networkConfig[chainId]) {
      console.log("Initialization with chainId:", chainId);
      setIsInitialized(true);
    }
  }, [chainId]);

  useEffect(() => {
    const calculateAPY = async () => {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const stakingPoolContract = new ethers.Contract(
          StakingChainAddress,
          SimpleStakingJson.abi,
          signer
        );

        const totalStaked = await stakingPoolContract.totalStaked();
        const totalRewards = await stakingPoolContract.totalRewards();
        const rewardIntervalSeconds =
          await stakingPoolContract.REWARD_INTERVAL();
        const rewardIntervalMinutes = Number(rewardIntervalSeconds) / 60;

        const intervalsPerYear = (365 * 24 * 60) / rewardIntervalMinutes;
        const rewardPerInterval =
          Number(ethers.formatEther(totalRewards)) / intervalsPerYear;
        const ratePerInterval =
          rewardPerInterval / Number(ethers.formatEther(totalStaked));
        const apy = (1 + ratePerInterval) ** intervalsPerYear - 1;

        setApy(`${(apy * 100).toFixed(2)}%`);
        console.log("APY:", (apy * 100).toFixed(2) + "%");
      } catch (error) {
        console.error("Error calculating APY:", error);
        setApy("Error calculating APY");
      }
    };

    const checkStakingStatus = async () => {
      if (!connectedWallet) return;

      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const stakingPoolContract = new ethers.Contract(
          StakingChainAddress,
          SimpleStakingJson.abi,
          signer
        );

        showPendingRewards(connectedWallet);

        const stakedAmount = await stakingPoolContract.getStake(
          connectedWallet
        );
        const stakedAmountBN = BigInt(stakedAmount.toString());

        const pendingUnstakes = await fetchPendingUnstakes(connectedWallet);
        const pendingUnstakesBN = BigInt(pendingUnstakes.toString());

        setPendingUnstake(pendingUnstakesBN);

        console.log(
          `Fetched staked amount: ${stakedAmount.toString()}, Fetched pending unstakes: ${pendingUnstakes.toString()}`
        );

        console.log(
          `Converted staked amount: ${stakedAmountBN}, Converted pending unstakes: ${pendingUnstakesBN}`
        );

        const availableForUnstake = stakedAmountBN - pendingUnstakesBN;

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
          setIsStaked(stakedAmountBN > 0n);
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

    const fetchStatistics = async () => {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingPoolContract = new ethers.Contract(
        StakingChainAddress,
        SimpleStakingJson.abi,
        signer
      );

      // Fetch total staked and total rewards
      const totalStaked = await stakingPoolContract.getTotalStaked();
      const totalRewards = await stakingPoolContract.getTotalRewards();

      // Set the state with the fetched values
      setTotalStaked(ethers.formatEther(totalStaked));
      setTotalRewards(ethers.formatEther(totalRewards));
    };

    if (isConnected) {
      checkStakingStatus();
      calculateAPY();
      fetchStatistics();
    }
  }, [connectedWallet, isConnected]);

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

    if (!ethers.isAddress(StakingChainAddress)) {
      setErrorMessage("Invalid staking pool address.");
      return;
    }

    try {
      setLoadingStake(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingPoolContract = new ethers.Contract(
        StakingChainAddress,
        SimpleStakingJson.abi,
        signer
      );

      const tx = await stakingPoolContract.stake({
        value: ethers.parseUnits(amount, 18),
      });
      await tx.wait();

      const uppercaseWallet = connectedWallet.toUpperCase();

      if (amount > 0.01) {
        const userPointsDoc = doc(firestore, "userPoints", uppercaseWallet);
        await updateDoc(userPointsDoc, { points: increment(1) });
      }

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
      setErrorMessage("");

      setLoadingStake(false);
    } catch (error) {
      console.error("Error staking ETH:", error);
      setErrorMessage("An error occurred while staking. Please try again.");
      setLoadingStake(false);
    }
  };

  const calculateMaxUnstakable = (stakedAmount, pendingUnstake) => {
    const maxUnstake = stakedAmount - pendingUnstake;
    return maxUnstake > 0n ? maxUnstake : 0n;
  };

  const handleUnstake = async () => {
    if (!amount) {
      setErrorMessage("Please enter an amount to unstake.");
      return;
    }

    const unstakeAmount = ethers.parseUnits(amount, 18);
    const availableForUnstake = stakedAmount - pendingUnstake;

    if (unstakeAmount > availableForUnstake) {
      setErrorMessage(
        `You can only unstake up to ${ethers.formatEther(
          availableForUnstake
        )} ETH.`
      );
      return;
    }

    if (!ethers.isAddress(StakingChainAddress)) {
      setErrorMessage("Invalid staking pool address.");
      return;
    }

    try {
      setLoadingUnstake(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingPoolContract = new ethers.Contract(
        StakingChainAddress,
        SimpleStakingJson.abi,
        signer
      );

      const txResponse = await stakingPoolContract.requestUnstake(
        unstakeAmount
      );
      await txResponse.wait();

      const updatedStakedAmount = await stakingPoolContract.getStake(
        connectedWallet
      );
      const updatedPendingUnstakes = await stakingPoolContract.pendingUnstakes(
        connectedWallet
      );

      const updatedStakedAmountBN = BigInt(updatedStakedAmount.toString());
      const updatedPendingUnstakesBN = BigInt(
        updatedPendingUnstakes.toString()
      );

      setStakedAmount(updatedStakedAmountBN);
      setPendingUnstake(updatedPendingUnstakesBN);

      const availableForUnstake =
        updatedStakedAmountBN - updatedPendingUnstakesBN;

      setIsStaked(updatedStakedAmountBN > 0n);
      setCanUnstake(availableForUnstake > 0n);

      setLoadingUnstake(false);
      setErrorMessage("");

      if (txResponse.events?.find((e) => e.event === "UnstakeProcessed")) {
        setStakedMessage(
          `You have successfully unstaked ${ethers.formatEther(amount)} ETH.`
        );
      } else if (txResponse.events?.find((e) => e.event === "UnstakeQueued")) {
        setStakedMessage(
          "Your unstake request is queued. It will be processed as funds become available."
        );
      } else {
        setStakedMessage(
          "Unstaking operation was performed, please check your wallet."
        );
      }
    } catch (error) {
      console.error("Error unstaking ETH:", error);
      setErrorMessage("An error occurred while unstaking. Please try again.");
      setLoadingUnstake(false);
    }
  };

  async function fetchPendingUnstakes(userAddress) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const stakingContract = new ethers.Contract(
      StakingChainAddress,
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

    console.log(
      `Total pending unstakes for ${userAddress}: ${totalPendingUnstakes.toString()}`
    );

    return totalPendingUnstakes;
  }

  const handleClaimRewards = async () => {
    if (!isConnected) {
      setErrorMessage("Please connect your wallet.");
      return;
    }

    try {
      setLoadingClaim(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingPoolContract = new ethers.Contract(
        StakingChainAddress,
        SimpleStakingJson.abi,
        signer
      );

      const tx = await stakingPoolContract.claimRewards({ gasLimit: 500000 });
      await tx.wait();

      setLoadingClaim(false);
      showPendingRewards(connectedWallet);
      setStakedMessage("Your rewards have been claimed!");
      setErrorMessage("");
    } catch (error) {
      console.error("Error claiming rewards:", error);
      setErrorMessage(
        "An error occurred while claiming rewards. Please try again."
      );
      setLoadingClaim(false);
    }
  };

  const showPendingRewards = async (userAddress) => {
    if (!userAddress) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = provider.getSigner();
    const stakingContract = new ethers.Contract(
      StakingChainAddress,
      SimpleStakingJson.abi,
      signer
    );

    try {
      const pendingRewards = await stakingContract.pendingReward(userAddress);
      console.log("Pending Rewards:", ethers.formatEther(pendingRewards));
      setPendingRewards(ethers.formatEther(pendingRewards));
    } catch (error) {
      console.error("Error getting pending rewards:", error);
    }
  };

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
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
          Lend your ETH and get a share of all revenues. Only live on Sepolia.
        </h5>
      </div>
      <div className="staking-container">
        {/* Staking container in the center */}
        <h2 className="vortex-title">Vortex ETH Pool</h2>
        {!isConnected && (
          <button onClick={connectWallet}>Connect Wallet</button>
        )}
        {isConnected && (
          <>
            <div>
              <div>
                <h4 className="apy-title">APY: {apy}</h4>
              </div>
              {pendingUnstake > 0n && (
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
              <div>
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
                    disabled={
                      loadingStake ||
                      loadingUnstake ||
                      !canUnstake ||
                      calculateMaxUnstakable(stakedAmount, pendingUnstake) <= 0n
                    }
                  >
                    {loadingUnstake ? "Unstaking..." : "Unstake"}
                  </button>
                )}
              </div>

              {isConnected && isStaked && (
                <button
                  className="unstake-button"
                  onClick={handleClaimRewards}
                  disabled={loadingClaim}
                >
                  {loadingClaim ? "Claiming..." : "Claim"}
                </button>
              )}

              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>
          </>
        )}
      </div>
      <div className="info-container">
        {/* Info container below the staking container */}
        <div className="stats-row">
          <div className="stat-item">
            <strong>Total Staked:</strong> {totalStaked} ETH
          </div>
          <div className="stat-item">
            <strong>Total Rewards:</strong> {totalRewards} ETH
          </div>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        .staking-container {
          max-width: 600px;

          padding: 20px; /* Reduced padding */
          margin: 50px auto; /* Center horizontally */
          border: 1px solid #cccccc81;
          border-radius: 30px;
          background-color: #0000006c;
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center; /* Vertically center */
          align-items: center; /* Horizontally center */
          text-align: center;
        }

        .vortex-title {
          margin-bottom: 5px; /* Reduced margin to decrease distance */
        }
        .apy-title {
          margin-top: 10; /* Remove top margin to decrease distance */
        }
        .info-container {
          max-width: 600px; /* Match the staking container */
          padding: 20px; /* Match the staking container padding */
          margin: 20px auto; /* Center horizontally */
          margin-top: -30px;
          border: 1px solid #cccccc81; /* Match the staking container border */
          border-radius: 30px; /* Match the staking container border radius */
          background-color: #000000; /* Match the staking container background color */
          color: white; /* Changed to white for better visibility */
          display: flex;
          flex-direction: column;
          justify-content: center; /* Vertically center */
          align-items: center; /* Horizontally center */
          text-align: center; /* Center text */
        }

        .info-container:hover {
          transform: translateY(-5px); /* Lift effect on hover */
        }
        .stats-row {
          display: flex; /* Use flexbox for horizontal layout */
          justify-content: space-between; /* Space between items */
          width: 100%; /* Full width */
        }
        .stat-item {
          flex: 1; /* Equal space for each item */
          text-align: center; /* Center text within each item */
        }
      `}</style>
    </div>
  );
};

export default StakingPage;
