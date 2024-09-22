require("dotenv").config();

// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function fetchUnstakeQueue() {
  const stakingContractAddress = process.env.REACT_APP_STAKING_SEPOLIA_CA;

  // Get the first signer for demonstration purposes
  const [signer] = await ethers.getSigners();

  // Attach the existing contract
  const stakingContract = await ethers.getContractAt(
    "SimpleStaking",
    stakingContractAddress,
    signer
  );

  try {
    // Assume getUnstakeQueueLength and getUnstakeRequest are implemented in your contract
    const queueLength = await stakingContract.getUnstakeQueueLength();
    const queue = [];
    const totalAmountWei = await stakingContract.getTotalUnstakeQueueAmount(); // Call the getTotalUnstakeQueueAmount method

    for (let i = 0; i < queueLength; i++) {
      const request = await stakingContract.getUnstakeRequest(i);
      queue.push({
        user: request.user,
        amount: ethers.formatEther(request.amount),
        timestamp: new Date(Number(request.timestamp) * 1000).toLocaleString(),
      });
    }

    return { queue, totalAmount: ethers.formatEther(totalAmountWei) }; // Return both queue and formatted total amount
  } catch (error) {
    console.error("Error fetching unstake queue:", error);
    throw error; // rethrow to catch in main
  }
}

async function main() {
  try {
    const { queue, totalAmount } = await fetchUnstakeQueue();
    console.log("Unstake Queue:", queue);
    console.log("Total Unstake Amount:", totalAmount + " ETH"); // Display the total amount in Ether
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
