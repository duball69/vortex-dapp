async function getLatestEvent(token, eventName) {
  // Get the filter for the TokenDeployed event
  const filter = token.filters[eventName]();

  // Query the filter for events emitted by the token contract
  const events = await token.queryFilter(filter);

  //console.log("Events = ", events);

  // Find the TokenDeployed event emitted by the token contract
  const latestEvent = events[events.length - 1]; // Get the latest event

  return latestEvent;
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
  const tokenName = "ShitCoin";
  const tokenSymbol = "Shit";
  const tokenSupply = "100";

  // Replace this with the address of the deployed factory contract
  const factoryAddress = "0xBD89A44A2DEC9A1B4AaeEb1b64bE4eF0adafAB8c";

  const lockerAddress = "0x31828AAC589e46549F3980912A6a8001F81a9eD5";

  const WETH_address = process.env.SEPOLIA_WETH;

  const nftAddress = process.env.SEPOLIA_POSITION_MANAGER;

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  const LiquidityLocker = await ethers.getContractFactory("LiquidityLocker");
  const locker = await LiquidityLocker.attach(lockerAddress);

  const tokenAmount = ethers.parseUnits(tokenSupply, 18); // 1,000,000 tokens with 18 decimals
  const wethAmount = ethers.parseUnits("0.0001", 18); // 0.01 WETH

  // Amount of ETH to swap
  const amountIn = ethers.parseUnits("0.0001", 18); // 0.01 ETH

  // Call the deployToken function of the factory contract
  const tx = await factory.deployToken(tokenName, tokenSymbol, tokenSupply); //DEPLOY

  // Wait for the transaction to be mined
  await tx.wait();
  console.log("Token deployed successfully!");

  // Get the TokenDeployed event emitted by the token contract
  //const tokenDeployedEvent = await getTokenDeployedEvent(factory);

  const eventName = "TokenDeployed";
  const tokenDeployedEvent = await getLatestEvent(factory, eventName);

  const tokenAddress = tokenDeployedEvent.args[0];
  console.log("Token Address: ", tokenAddress);

  let token0, token1, token0amount, token1amount;
  if (tokenAddress.toLowerCase() < WETH_address.toLowerCase()) {
    token0 = tokenAddress;
    token1 = WETH_address;
    token0amount = tokenAmount;
    token1amount = wethAmount;
  } else {
    token0 = WETH_address;
    token1 = tokenAddress;
    token0amount = wethAmount;
    token1amount = tokenAmount;
  }

  // Calculate sqrtPriceX96 considering both tokens have 18 decimals
  const priceRatio =
    (BigInt(token1amount) * BigInt(10 ** 18)) / BigInt(token0amount);
  const sqrtPriceRatio = sqrt(priceRatio);
  const sqrtPriceX96 = (sqrtPriceRatio * 2n ** 96n) / 10n ** 9n; // Scale to 2^96
  //console.log(`Calculated sqrtPriceX96: ${sqrtPriceX96.toString()}`);

  // Encode the calls
  const iface = new ethers.Interface([
    "function createAndInitializePoolIfNecessary(address,address,uint160) external returns (address pool)",
    "function addInitialLiquidity(address,address,address,uint256,uint256) external",
    "function swapETHforTokens(uint256, address) external payable returns (uint256 )",
  ]);

  const createPoolData = iface.encodeFunctionData(
    "createAndInitializePoolIfNecessary",
    [token0, token1, sqrtPriceX96]
  );
  const addLiquidityData = iface.encodeFunctionData("addInitialLiquidity", [
    token0,
    token1,
    tokenAddress,
    token0amount,
    token1amount,
  ]);
  //const swapData = iface.encodeFunctionData("swapETHforTokens", [amountIn, tokenAddress]);

  // Multicall
  const tx2 = await factory.multicall([createPoolData, addLiquidityData], {
    //value: amountIn,
    gasLimit: 9000000,
  });

  await tx2.wait();
  console.log("Multi-call successful!");

  //const tokenIdEvent = await getLiquidityAddedEvent(factory);

  const eventName2 = "LiquidityAdded";
  const tokenIdEvent = await getLatestEvent(factory, eventName2);

  const tokenId = tokenIdEvent.args[0];

  console.log("tokenId: ", tokenId);

  console.log("Buying tokens for the team...");
  tx1 = await factory.swapETHforTokens(amountIn, tokenAddress, {
    value: amountIn,
  });
  receipt = await tx1.wait();
  console.log("Swap performed successfully!");

  //const tokensSwappedEvent = await getTokensSwappedEvent(factory);

  const eventName3 = "TokensSwapped";
  const tokensSwappedEvent = await getLatestEvent(factory, eventName3);

  const tokensReceived = tokensSwappedEvent.args[0];
  const formattedTokens = ethers.formatUnits(tokensReceived, 18);
  console.log("Tokens received: ", formattedTokens);

  // Approve the locker to manage the NFT
  console.log("Approving LiquidityLocker to manage the factory NFT...");
  const approveTx = await factory.approveNFT(
    nftAddress,
    tokenId,
    lockerAddress
  );
  await approveTx.wait();
  console.log("Approval successful.");

  // Lock the liquidity
  console.log("Locking liquidity...");
  //const duration = 3600 * 24 * 7; // 1 week in seconds
  const duration = 120;

  const lockLiquidityTx = await locker.lockLiquidity(
    nftAddress,
    tokenId,
    duration,
    factoryAddress
  );
  receipt = await lockLiquidityTx.wait();

  console.log("Liquidity locked.");

  // Get the TokenDeployed event emitted by the token contract
  //const liquidityLockedEvent = await getLiquidityLockedEvent(locker);

  const eventName4 = "LiquidityLocked";

  const liquidityLockedEvent = await getLatestEvent(locker, eventName4);

  const lockId = liquidityLockedEvent.args[0];
  console.log("lockId: ", lockId);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    console.log("Not enough weth on the factory contract");
    process.exit(1);
  });
