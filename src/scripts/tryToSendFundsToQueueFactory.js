// Importing ethers from Hardhat environment
require("dotenv").config();

const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed factory contract
  const factoryContractAddress = process.env.REACT_APP_FACTORY_SEPOLIA_CA; // Replace with your actual factory contract address on the correct network

  // Get signer information from the default account
  const [signer] = await ethers.getSigners();

  // Create a contract instance connected to the signer
  const FactoryContract = await ethers.getContractFactory("MyFactory");
  const factory = FactoryContract.attach(factoryContractAddress).connect(
    signer
  );

  // Call the tryToSendFunds function
  const transactionResponse = await factory.tryToSendFunds();
  console.log("Waiting for transaction to be mined...");
  await transactionResponse.wait();

  console.log("tryToSendFunds called and transaction mined.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
