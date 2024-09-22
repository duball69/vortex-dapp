// Importing ethers from Hardhat environment
const { ethers } = require("hardhat");

async function main() {
  // The address of your deployed factory contract
  const factoryContractAddress = "0x8a57fbE0738e44677CE2810eB154Da33c059c4f4"; // Replace with your factory address

  // Get signer information from the default account
  const [signer] = await ethers.getSigners();

  // Create a contract instance connected to the signer
  const FactoryContract = await ethers.getContractFactory("MyFactory"); // Replace 'MyFactory' with your contract name
  const factory = FactoryContract.attach(factoryContractAddress).connect(
    signer
  );

  // Call the tryToSendFunds function
  try {
    const transactionResponse = await factory.tryToSendFunds();
    console.log("Waiting for transaction to be mined...");
    await transactionResponse.wait();
    console.log("Funds transfer attempted successfully!");
  } catch (error) {
    console.error("Error calling tryToSendFunds:", error);
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
