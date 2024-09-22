// Importing ethers from Hardhat environment
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed SimpleStaking contract
  const stakingContractAddress = process.env.REACT_APP_STAKING_SEPOLIA_CA;

  // The desired new factory address you want to set
  const factoryContractAddress = process.env.REACT_APP_FACTORY_SEPOLIA_CA;

  // Get signer information from the default account
  const [signer] = await ethers.getSigners();

  // Create a contract instance connected to the signer
  const StakingContract = await ethers.getContractFactory("SimpleStaking");
  const staking = StakingContract.attach(stakingContractAddress).connect(
    signer
  );

  // Call the setFactoryAddress function
  const transactionResponse = await staking.setFactoryAddress(
    factoryContractAddress
  );
  console.log("Waiting for transaction to be mined...");
  await transactionResponse.wait();

  console.log(`Factory address updated to: ${factoryContractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
