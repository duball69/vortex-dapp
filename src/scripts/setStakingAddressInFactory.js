// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed factory contract
  const factoryContractAddress = "0xb852A73BD5aD3c131F520430902512fb935Db187"; // Sepolia factory

  // The address of your deployed SimpleStaking contract
  const stakingContractAddress = "0x5c9e1e018Bbd2f8Fa868a5AAd02930DCc1dd2494";

  // Get signer information from the default account
  const [signer] = await ethers.getSigners();

  // Create a contract instance connected to the signer
  const FactoryContract = await ethers.getContractFactory("MyFactory");
  const factory = FactoryContract.attach(factoryContractAddress).connect(
    signer
  );

  // Call the setStakingPoolAddress function
  const transactionResponse = await factory.setStakingAddress(
    stakingContractAddress
  );
  console.log("Waiting for transaction to be mined...");
  await transactionResponse.wait();

  console.log(`Staking pool address updated to: ${stakingContractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
