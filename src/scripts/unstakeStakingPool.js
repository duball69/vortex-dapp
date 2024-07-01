// scripts/unstakeEth.js

const { ethers } = require("hardhat");

async function unstakeEthFromStakingPool(stakingPoolAddress, amountToUnstake) {
  try {
    const [sender] = await ethers.getSigners(); // Get the first signer (deployer)

    console.log(
      `Unstaking ${amountToUnstake} ETH from StakingPool at address: ${stakingPoolAddress}`
    );

    // Get the contract instance
    const stakingABI = [
      "function unstake(uint256 amount)",
      // Add other function signatures if needed
    ];
    const stakingContract = new ethers.Contract(
      stakingPoolAddress,
      stakingABI,
      sender
    );

    // Unstake the specified amount of ETH
    const amountInWei = ethers.parseEther(amountToUnstake);
    const tx = await stakingContract.unstake(amountInWei);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction receipt:", receipt);
    console.log(
      `Successfully unstaked ${amountToUnstake} ETH from the staking contract.`
    );
  } catch (error) {
    console.error("An error occurred while unstaking ETH:", error);
    console.log("Error details:", error.message);
  }
}

async function main() {
  const stakingPoolAddress = "0x2F3e5b80653260eC9d12Bd15f37ea127F6322fC3"; // Replace with your actual contract address
  const amountToUnstake = "0.01"; // Replace with the amount you want to unstake

  await unstakeEthFromStakingPool(stakingPoolAddress, amountToUnstake);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error in main execution:", error);
    console.log("Error details:", error.message);
    process.exit(1);
  });
