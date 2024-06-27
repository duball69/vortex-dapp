// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function addRewards() {
  const stakingContractAddress = "0x4e49908aE2AAD9Fcb498029a4A403aA994A3aFE6";

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
    const rewardAmount = ethers.parseEther("0.01"); // e.g., 1 ETH

    // Sending a transaction to add rewards
    const tx = await stakingContract.addRewards({ value: rewardAmount });
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
