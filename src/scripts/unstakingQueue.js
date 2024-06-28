// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function fetchUnstakeQueue() {
  const stakingContractAddress = "0xaC0ee7386123077dc6e8CaB58037294D49c52023";

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

    for (let i = 0; i < queueLength; i++) {
      const request = await stakingContract.getUnstakeRequest(i);
      queue.push({
        user: request.user,
        amount: ethers.formatEther(request.amount),
        timestamp: new Date(Number(request.timestamp) * 1000).toLocaleString(),
      });
    }

    return queue;
  } catch (error) {
    console.error("Error fetching unstake queue:", error);
    throw error; // rethrow to catch in main
  }
}

async function main() {
  try {
    const unstakeQueue = await fetchUnstakeQueue();
    console.log("Unstake Queue:", unstakeQueue);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
