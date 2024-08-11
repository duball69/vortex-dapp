//const { ethers } = require("ethers");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Interacting with the factory contract using the account:",
    deployer.address
  );

  // Replace these with your desired token name, symbol, and total supply
  const tokenName = "Etnica";
  const tokenSymbol = "ET";
  const tokenSupply = 30000;

  // Read the JSON file
  const myFactoryJson = JSON.parse(
    fs.readFileSync(
      "artifacts/contracts/TestFactory.sol/MyFactory.json",
      "utf8"
    )
  );

  // Get the ABI from the JSON object
  const factoryAbi = myFactoryJson.abi;

  // Replace this with the address of the deployed factory contract
  const factoryAddress = "0x8073bef1728a47dA7C370842A1D2a41af7761a0c";

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  // Call the deployToken function of the factory contract
  const tx = await factory.deployToken(tokenName, tokenSymbol, tokenSupply);

  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log("Token deployed successfully!");
  // Log all events emitted during the transaction

  // Check if receipt contains logs
  if (receipt.logs && receipt.logs.length > 0) {
    // Parse logs to find the TokenDeployed event
    const tokenDeployedEvent = receipt.logs.find(
      (log) =>
        log.address.toLowerCase() === factoryAddress.toLowerCase() &&
        log.topics[0] ===
          "0x91d24864a084ab70b268a1f865e757ca12006cf298d763b6be697302ef86498c" // keccak256 hash of the event signature
    );

    if (tokenDeployedEvent) {
      // Extract the token address from the event data
      const tokenAddress = tokenDeployedEvent.args[0]; // Assuming the token address is the first argument
      console.log("Your new contract address is:", tokenAddress);
    } else {
      console.error("Token deployment event not found in transaction receipt");
    }
  } else {
    console.error("No logs found in transaction receipt");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
