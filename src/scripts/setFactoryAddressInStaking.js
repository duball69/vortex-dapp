// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed SimpleStaking contract
  const stakingContractAddress = "0x35a4a01b81D011b09BC01d996C215188Be1e8491";

  // The desired new factory address you want to set
  const newFactoryAddress = "0x1a9EF94197D2b0a39D922dbEe0b87F8c973b85dd"; //sepolia factory

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
