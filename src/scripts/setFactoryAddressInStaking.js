// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed SimpleStaking contract
  const stakingContractAddress = "0xaC0ee7386123077dc6e8CaB58037294D49c52023";

  // The desired new factory address you want to set
  const newFactoryAddress = "0x4178dAC8B36172A7CED03dB5fcaEAedf19F04462"; //sepolia factory

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
