// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed SimpleStaking contract
  const stakingContractAddress = "0xfA3d3f1Fec89E5C14d7deaC9c816fB8daf64e062";

  // The desired new factory address you want to set
  const newFactoryAddress = "0x13679f5B2b553d95e41549279841258be3Fb1830"; //sepolia factory

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
