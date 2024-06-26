async function getTokenDeployedEvent(token) {
  // Get the filter for the TokenDeployed event
  const filter = token.filters.TokenDeployed();

  // Query the filter for events emitted by the token contract
  const events = await token.queryFilter(filter);

  // Find the TokenDeployed event emitted by the token contract
  const tokenDeployedEvent = events[events.length - 1]; // Get the latest event

  return tokenDeployedEvent;
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
  const tokenName = "PoopCoin";
  const tokenSymbol = "Poop";
  const tokenSupply = "100";

  // Replace this with the address of the deployed factory contract
  const factoryAddress = "0x75085f466Eb0a88a3faF8E6E8eBcD19348726a4f";

  const swapRouterAddress = "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E";
  const abi = require("../scripts/swapRouterABI.json");
  const swapRouter = new ethers.Contract(swapRouterAddress, abi, deployer);

  const lockerAddress = "0xc4d1Fad3e2f86ec002368E79f88C68B2aE03d18b";
  const nftAddress = "0x1238536071E1c677A632429e3655c799b22cDA52";

  const WETH_address = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";

  // Connect to the factory contract using its ABI and address
  const Factory = await ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  const tokenAmount = ethers.parseUnits(tokenSupply, 18); // 1,000,000 tokens with 18 decimals
  const wethAmount = ethers.parseUnits("0.0001", 18); // 0.01 WETH

  // Amount of ETH to swap
  const amountIn = ethers.parseUnits("0.0005", 18); // 0.01 ETH

  // Call the deployToken function of the factory contract
  const tx = await factory.deployToken(tokenName, tokenSymbol, tokenSupply); //DEPLOY

  // Wait for the transaction to be mined
  await tx.wait();
  console.log("Token deployed successfully!");

  // Get the TokenDeployed event emitted by the token contract
  const tokenDeployedEvent = await getTokenDeployedEvent(factory);

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

  console.log("Buying tokens for the team...");
  tx1 = await factory.swapETHforTokens(amountIn, tokenAddress, {
    value: amountIn,
  });
  receipt = await tx1.wait();
  console.log("Swap performed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
