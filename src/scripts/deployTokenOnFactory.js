const fs = require("fs");

// Array to store deployed token contract addresses
const deployedTokenAddresses = [];

async function getTokenDeployedEvent(token, factoryAddress) {
  // Get the filter for the TokenDeployed event
  const filter = token.filters.TokenDeployed();

  // Query the filter for events emitted by the token contract
  const events = await token.queryFilter(filter);

  // Find the TokenDeployed event emitted by the token contract
  const tokenDeployedEvent = events[events.length - 1]; // Get the latest event

  return tokenDeployedEvent;
}

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
  //const factoryAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; local one
  //const factoryAddress = "0xf490f0ceeeb9AC8295797DB594b9827CAAacdAFC";  //this one has 1 weth + 0.6sepolia eth + tokens
  const factoryAddress = "0x5f0Cc56D44596396E70F619e21CbB8F9eB1641D6";

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  // Retrieve the contract address of the deployed token
  const provider = ethers.getDefaultProvider(); // Update with your WebSocket provider URL
  const factoryContract = new ethers.Contract(
    factoryAddress,
    factoryAbi,
    provider
  );

  // Call the deployToken function of the factory contract
  const tx = await factory.deployToken(tokenName, tokenSymbol, tokenSupply);

  // Wait for the transaction to be mined
  const receipt = await tx.wait();
  console.log("Token deployed successfully!");

  // Get the TokenDeployed event emitted by the token contract
  const tokenDeployedEvent = await getTokenDeployedEvent(factory);

  if (tokenDeployedEvent) {
    const tokenAddress = tokenDeployedEvent.args[0];
    console.log("Token deployed at:", tokenAddress);
    // Store the deployed token address
    deployedTokenAddresses.push(tokenAddress);
  } else {
    console.error("Token deployment event not found");
  }

  // Output all deployed token addresses
  console.log("Deployed token addresses:", deployedTokenAddresses);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
