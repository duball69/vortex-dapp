// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function checkWETHBalance() {
  const stakingContractAddress = "0x3E6D86CB4933068B522EB6DEc26AcC0D8132a402"; // Your staking contract address
  const wethAddress = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"; // Mainnet WETH address, replace if using a different network

  // Get the first signer for demonstration purposes
  const [signer] = await ethers.getSigners();

  // ABI for WETH contract to interact with the balanceOf function
  const wethABI = ["function balanceOf(address owner) view returns (uint256)"];

  // Attach to the existing WETH contract
  const wethContract = await ethers.getContractAt(wethABI, wethAddress, signer);

  try {
    // Fetch the balance of WETH for the staking contract
    const balance = await wethContract.balanceOf(stakingContractAddress);
    console.log(
      `WETH Balance in the staking contract: ${ethers.formatEther(
        balance
      )} WETH`
    );
  } catch (error) {
    console.error("Error fetching WETH balance:", error);
    throw error; // Rethrow to catch in main
  }
}

async function main() {
  try {
    await checkWETHBalance();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
