const poolTokenAddresses = [];

async function getPoolCreatedEvent(factory, tokenAddress) {
  // Get the filter for the PoolCreated event
  const filter = factory.filters.PoolCreated();

  // Query the filter for events emitted by the factory contract
  const events = await factory.queryFilter(filter);

  // Log the events array to inspect its contents
  console.log("Events array:", events);

  // Find the PoolCreated event matching the token address
  const poolCreatedEvent = events[events.length - 1]; // Assuming the latest event corresponds to the pool creation

  return poolCreatedEvent;
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log(
    "Interacting with the factory contract using the account:",
    deployer.address
  );

  // Replace this with the address of the deployed factory contract
  const factoryAddress = "0xb16b40b5d1F9B7478B3ffF43487042546aDbAa85";

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  const tokenAddress = "0x1e4114b68d6becB1a4ac2dC4b7A672f27798a66D";

  // Create a Uniswap pool paired with ETH
  const poolAddress = await factory.createPoolForToken(tokenAddress);

  const receipt = await poolAddress.wait();

  console.log("Pool created successfully!");

  // Get the PoolCreated event emitted by the factory contract
  const poolCreatedEvent = await getPoolCreatedEvent(factory, tokenAddress);

  if (poolCreatedEvent) {
    const pool_Address = poolCreatedEvent.args[1];
    console.log("Pool deployed at:", pool_Address);
    // Store the deployed token address
    poolTokenAddresses.push(pool_Address);
  } else {
    console.error("Pool Creation event not found");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
