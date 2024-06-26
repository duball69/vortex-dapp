// Import ethers from Hardhat or directly if using in a standalone script
const { ethers } = require("hardhat");

async function checkPendingRewards(stakerAddress) {
  // Assuming the contract is already deployed, and you have the address
  const stakingContractAddress = "0x9D56153550a39385F2d5DC09D08a81B2aA2C18F3";

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
const stakerAddress = "0x1d8A2eB5Eb3932349affC7Cd7f85354e73A92031"; // Specify the staker address
checkPendingRewards(stakerAddress);
