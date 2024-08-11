// Import ethers from Hardhat or directly if using in a standalone script
const { ethers } = require("hardhat");

async function checkPendingRewards(stakerAddress) {
  // Assuming the contract is already deployed, and you have the address
  const stakingContractAddress = "0x2B2643e0914e07b33cE23C14c8e48F4993A9FFf9";

  // Setup provider and signer (here using the first signer for simplicity)
  const [signer] = await ethers.getSigners();

  // Create a contract instance attached to signer
  const stakingContract = await ethers.getContractAt(
    "SimpleStaking",
    stakingContractAddress,
    signer
  );

  try {
    // Call the `pendingReward` function
    const pendingRewards = await stakingContract.pendingReward(stakerAddress);
    console.log(
      `Pending Rewards for ${stakerAddress}: ${ethers.formatEther(
        pendingRewards
      )} ETH`
    );
  } catch (error) {
    console.error("Failed to fetch pending rewards:", error);
  }
}

// Example usage
const stakerAddress = "0x5c9e1e018Bbd2f8Fa868a5AAd02930DCc1dd2494"; // Specify the staker address
checkPendingRewards(stakerAddress);
