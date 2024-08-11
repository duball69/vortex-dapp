//const ethers = require("hardhat");

async function getPoolCreatedEvent(factory, tokenAddress) {
  // Get the filter for the PoolCreated event
  const filter = factory.filters.PoolCreated();

  // Query the filter for events emitted by the factory contract
  const events = await factory.queryFilter(filter);

  // Log the events array to inspect its contents
  //console.log("Events array:", events);

  // Find the PoolCreated event matching the token address
  const poolCreatedEvent = events[events.length - 1]; // Assuming the latest event corresponds to the pool creation

  return poolCreatedEvent;
}

// Babylonian method for square root calculation using BigInt
function sqrt(value) {
  if (value < 0n) {
    throw new Error("Square root of negative numbers is not supported");
  }
  if (value === 0n) return 0n;
  let z = value;
  let x = value / 2n + 1n;
  while (x < z) {
    z = x;
    x = (value / x + x) / 2n;
  }
  return z;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Interacting with the factory contract using the account:",
    deployer.address
  );

  // Replace these with your desired token name, symbol, and total supply
  // Extract parameters from command line arguments
  const args = process.argv.slice(2);
  const tokenName = agrs[0];
  const tokenSymbol = agrs[1];
  const tokenSupply = agrs[2];
  const tokenAddress = "0x825bfE105239f0C94365D7d3047c00A2C93AE854";

  // Replace this with the address of the deployed factory contract
  const factoryAddress = "0x5f0Cc56D44596396E70F619e21CbB8F9eB1641D6";

  const WETH_address = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"; // (for SEPOLIA) don't change
  const positionManager_address = "0x1238536071E1c677A632429e3655c799b22cDA52"; // (for SEPOLIA) don't change

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  // Retrieve the contract address of the deployed token
  const provider = ethers.getDefaultProvider(); // Update with your WebSocket provider URL

  // Create a Uniswap pool paired with ETH
  const poolAddress = await factory.createPoolForToken(tokenAddress); // CREATE POOL

  await poolAddress.wait();

  console.log("Pool created successfully!");

  // Get the PoolCreated event emitted by the factory contract
  const poolCreatedEvent = await getPoolCreatedEvent(factory, tokenAddress);

  const pool_Address = poolCreatedEvent.args[1];
  console.log("Pool Address: ", pool_Address);

  const tokenAmount = ethers.parseUnits(tokenSupply, 18); // 1,000,000 tokens with 18 decimals
  const wethAmount = ethers.parseUnits("0.1", 18); // 0.1 WETH

  // Calculate sqrtPriceX96 considering both tokens have 18 decimals
  const priceRatio = BigInt(wethAmount) / BigInt(tokenSupply);
  const sqrtPriceRatio = sqrt(
    priceRatio * (BigInt(10 ** 18) / BigInt(10 ** 18))
  );
  const sqrtPriceX96 = (sqrtPriceRatio * 2n ** 96n) / 10n ** 9n; // Scale to 2^96
  console.log(`Calculated sqrtPriceX96: ${sqrtPriceX96.toString()}`);

  // Initialize the pool
  const initializeTx = await factory.initializePool(pool_Address, sqrtPriceX96); //INITIALIZE POOL
  await initializeTx.wait();

  // Approve tokens for the factory contract
  console.log("Approving tokens for the factory contract...");
  const approveTokenTx = await factory.approveToken(
    tokenAddress,
    positionManager_address,
    tokenAmount
  );
  await approveTokenTx.wait();
  console.log("Tokens approved.");

  const approveWETHTx = await factory.approveToken(
    WETH_address,
    positionManager_address,
    wethAmount
  );
  await approveWETHTx.wait();
  console.log("WETH approved.");

  console.log("Adding liquidity to the pool...");
  const tx2 = await factory.addInitialLiquidity(
    tokenAddress,
    pool_Address,
    factoryAddress,
    tokenAmount,
    wethAmount,
    {
      gasLimit: 5000000, // Set a higher gas limit for adding liquidity
    }
  );

  await tx2.wait();

  console.log("Liquidity added successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
