// Importing ethers from Hardhat environment
require("dotenv").config();
const { ethers } = require("hardhat");

async function addRewards() {
  const stakingContractAddress = process.env.REACT_APP_STAKING_SEPOLIA_CA;

  // Get the first signer for demonstration purposes
  const [signer] = await ethers.getSigners();

  // ABI that includes the addRewards function
  const contractABI = ["function addRewards() external payable"];

  // Attach to the existing contract
  const stakingContract = await ethers.getContractAt(
    "SimpleStaking",
    stakingContractAddress,
    signer
  );

  try {
    // Define the amount of ETH to send as rewards
    const rewardAmount = ethers.parseEther("0.02"); // e.g., 1 ETH

    // Sending a transaction to add rewards
    const tx = await stakingContract.addRewards({
      value: rewardAmount,
      gasLimit: 300000,
    });

    console.log("Adding rewards, transaction hash:", tx.hash);

    // Wait for the transaction to be confirmed
    const receipt = await tx.wait();
    console.log("Transaction confirmed, block number:", receipt.blockNumber);
  } catch (error) {
    console.error("Error adding rewards:", error);
    throw error; // Rethrow to catch in main
  }
}

async function main() {
  try {
    await addRewards();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
