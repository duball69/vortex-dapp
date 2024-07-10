// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function fetchStakingDetails() {
  const stakingContractAddress = "0xb8730B8f311FE8488336dc73047cFDA776803D4B"; // Update this to your actual deployed staking contract address

  // Get the first signer for demonstration purposes
  const [signer] = await ethers.getSigners();

  // ABI that includes the totalStaked, totalRewards functions, and REWARD_INTERVAL constant
  const contractABI = [
    "function totalStaked() view returns (uint256)",
    "function totalRewards() view returns (uint256)",
    "function REWARD_INTERVAL() view returns (uint256)",
  ];

  // Attach to the existing contract
  const stakingContract = await ethers.getContractAt(
    contractABI,
    stakingContractAddress,
    signer
  );

  try {
    // Call the totalStaked function to get the current total staked amount
    const totalStaked = await stakingContract.totalStaked();
    console.log("Total Staked:", ethers.formatEther(totalStaked), "ETH");

    // Call the totalRewards function to get the current total rewards amount
    const totalRewards = await stakingContract.totalRewards();
    console.log("Total Rewards:", ethers.formatEther(totalRewards), "ETH");

    // Retrieve the rewards interval in seconds and convert to minutes
    const rewardIntervalSeconds = await stakingContract.REWARD_INTERVAL();
    const rewardIntervalMinutes = Number(rewardIntervalSeconds) / 60;
    console.log("Reward Interval:", rewardIntervalMinutes, "minutes");

    // Calculate APY
    const intervalsPerYear = (365 * 24 * 60) / rewardIntervalMinutes; // Number of intervals per year
    const rewardPerInterval =
      Number(ethers.formatEther(totalRewards)) / intervalsPerYear; // Convert totalRewards from wei and handle as number
    const ratePerInterval =
      rewardPerInterval / Number(ethers.formatEther(totalStaked)); // Convert totalStaked from wei and handle as number
    const apy = (1 + ratePerInterval) ** intervalsPerYear - 1;
    console.log("APY:", (apy * 100).toFixed(2), "%");
  } catch (error) {
    console.error("Error fetching staking details:", error);
    throw error; // Rethrow to catch in main
  }
}

async function main() {
  try {
    await fetchStakingDetails();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
