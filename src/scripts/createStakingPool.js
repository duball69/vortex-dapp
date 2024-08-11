// scripts/deploy.js

const { ethers } = require("hardhat");

async function main() {
  // Get the ContractFactory and signers.
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const wethAddress = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"; // sepolia

  // Deploy the SimpleStaking contract
  const SimpleStaking = await ethers.getContractFactory("SimpleStaking");
  const staking = await SimpleStaking.deploy(wethAddress);

  // Wait for the deployment transaction to be mined
  const receipt = await staking.deploymentTransaction().wait(2);

  console.log("Transaction receipt:", receipt);
  console.log("Staking contract deployed to:", receipt.contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
