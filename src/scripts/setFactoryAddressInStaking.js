// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed SimpleStaking contract
  const stakingContractAddress = "0x3E303b4C2A5F477d4c52104570Af4E737108BEF1";

  // The desired new factory address you want to set
  const newFactoryAddress = "0x0CeD474F344497dc917D285a00eEE0394c6F044c"; //sepolia factory

  // Get signer information from the default account
  const [signer] = await ethers.getSigners();

  // Create a contract instance connected to the signer
  const StakingContract = await ethers.getContractFactory("SimpleStaking");
  const staking = StakingContract.attach(stakingContractAddress).connect(
    signer
  );

  // Call the setFactoryAddress function
  const transactionResponse = await staking.setFactoryAddress(
    newFactoryAddress
  );
  console.log("Waiting for transaction to be mined...");
  await transactionResponse.wait();

  console.log(`Factory address updated to: ${newFactoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
