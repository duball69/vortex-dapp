// scripts/sendEthToStaking.js
require("dotenv").config();
const { ethers } = require("hardhat");

async function sendEthToStakingPool(stakingContractAddress, wethAddress) {
  try {
    const [sender] = await ethers.getSigners(); // Get the first signer (deployer)

    console.log(
      `Converting ETH to WETH and sending to StakingPool at address: ${stakingContractAddress}`
    );

    // Step 1: Convert ETH to WETH
    const wethABI = [
      "function deposit() payable",
      "function transfer(address to, uint256 value) returns (bool)",
    ];
    const wethContract = new ethers.Contract(wethAddress, wethABI, sender);

    const amountToConvert = ethers.parseEther("0.03");
    const depositTx = await wethContract.deposit({ value: amountToConvert });
    await depositTx.wait();

    console.log(
      `Successfully converted ${ethers.formatEther(
        amountToConvert
      )} ETH to WETH.`
    );

    // Step 2: Send WETH to the staking contract
    const stakingABI = [
      "function stake() payable",
      // Add other function signatures if needed
    ];
    const stakingContract = new ethers.Contract(
      stakingContractAddress,
      stakingABI,
      sender
    );

    const transferTx = await wethContract.transfer(
      stakingContractAddress,
      amountToConvert
    );
    await transferTx.wait();

    console.log(
      `Successfully sent ${ethers.formatEther(
        amountToConvert
      )} WETH to the staking contract.`
    );
  } catch (error) {
    console.error("An error occurred while sending WETH:", error);
    console.log("Error details:", error.message);
  }
}

async function main() {
  const stakingContractAddress = process.env.REACT_APP_STAKING_SEPOLIA_CA; // Replace with your actual contract address
  const wethAddress = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"; // Replace with the WETH address on your network

  await sendEthToStakingPool(stakingContractAddress, wethAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error in main execution:", error);
    console.log("Error details:", error.message);
    process.exit(1);
  });
