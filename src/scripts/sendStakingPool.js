// scripts/sendEth.js

const { ethers } = require("hardhat");

async function sendEthToStakingPool(stakingPoolAddress) {
  try {
    const [sender] = await ethers.getSigners(); // Get the first signer (deployer)

    console.l og(
      `Sending 0.01 ETH to StakingPool at address: ${stakingPoolAddress}`
    );

    // Get the contract instance
    const stakingABI = [
      "function stake() payable",
      // Add other function signatures if needed
    ];
    const stakingContract = new ethers.Contract(
      stakingPoolAddress,
      stakingABI,
      sender
    );

    // Send 0.01 ETH to the stake function
    const amountToSend = ethers.parseEther("0.01");
    const tx = await stakingContract.stake({
      value: amountToSend,
    });

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);
    console.log(
      `Successfully sent ${ethers.formatEther(
        amountToSend
      )} ETH to the staking contract.`
    );
  } catch (error) {
    console.error("An error occurred while sending ETH:", error);
    console.log("Error details:", error.message);
  }
}

async function main() {
  const stakingPoolAddress = "0x78B6cEf9658DdA132e5C37EeBC786e10B2917625"; // Replace with your actual contract address

  await sendEthToStakingPool(stakingPoolAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error in main execution:", error);
    console.log("Error details:", error.message);
    process.exit(1);
  });
