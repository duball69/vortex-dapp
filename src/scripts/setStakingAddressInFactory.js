// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed factory contract
  const factoryContractAddress = "0x1a9EF94197D2b0a39D922dbEe0b87F8c973b85dd"; // Sepolia factory

  // The address of your deployed SimpleStaking contract
  const stakingContractAddress = "0x35a4a01b81D011b09BC01d996C215188Be1e8491";

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
