
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
  
    console.log("Interacting with the factory contract using the account:", deployer.address);

    // Replace these with your desired token name, symbol, and total supply
    const tokenName = "BudaCoin";
    const tokenSymbol = "SWAPPENIS";
    const tokenSupply = "11";
    //const totalSupply = "3000";

    // Replace this with the address of the deployed factory contract
    const factoryAddress = "0x4939fedB0ef5DC98c99D1B11bbdc3B43879706D3";

    //SEPOLIA
    const WETH_address = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";

    //BASE
  /*  const WETH_address = "0x4200000000000000000000000000000000000006";
    */

    //const tokenAddress = "0x90950111fcfF15474c670aA44890561F9624866C";
    //const pool_Address = "0xc28FE4D9ecd71A3B71FF469cE4C23671cd6dc180";
    
    // Connect to the factory contract using its ABI and address
    const Factory = await ethers.getContractFactory("MyFactory");
    const factory = await Factory.attach(factoryAddress);
    
    // Retrieve the contract address of the deployed token
    const provider = ethers.getDefaultProvider(); // Update with your WebSocket provider URL

    const tokenAmount = ethers.parseUnits(tokenSupply, 18); // 1,000,000 tokens with 18 decimals
    const wethAmount = ethers.parseUnits("0.01", 18); // 0.01 WETH

    // Call the deployToken function of the factory contract
    const tx = await factory.deployToken(tokenName, tokenSymbol, tokenSupply);  //DEPLOY

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Token deployed successfully!");   
    
    // Get the TokenDeployed event emitted by the token contract
    const tokenDeployedEvent = await getTokenDeployedEvent(factory);

    const tokenAddress = tokenDeployedEvent.args[0];
    console.log("Token Address: ",tokenAddress);

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

    console.log(`Creating pool with token0: ${token0} and token1: ${token1}, token0amount: ${token0amount}, token1amount: ${token1amount}...`);
    const poolAddressTx = await factory.createPoolForToken(token0, token1);
    await poolAddressTx.wait();
    console.log("Pool created successfully!");

    // Get the PoolCreated event emitted by the factory contract
    const poolCreatedEvent = await getPoolCreatedEvent(factory, tokenAddress);

    const pool_Address = poolCreatedEvent.args[1];
    console.log("Pool Address: ",pool_Address);
 
    // Calculate sqrtPriceX96 considering both tokens have 18 decimals
    const priceRatio = BigInt(token1amount)* BigInt(10 ** 18) / BigInt(token0amount);
    const sqrtPriceRatio = sqrt(priceRatio);
    const sqrtPriceX96 = (sqrtPriceRatio * (2n ** 96n)) / (10n ** 9n); // Scale to 2^96
    //const sqrtPriceX96 = sqrtPriceRatio * BigInt(2 ** 96)/BigInt(10 ** 9);
    console.log(`Calculated price ratio: ${priceRatio}`);
    console.log(`Calculated sqrt price ratio: ${sqrtPriceRatio}`);
    console.log(`Calculated sqrtPriceX96: ${sqrtPriceX96.toString()}`);

    // Initialize the pool
    const initializeTx = await factory.initializePool(pool_Address, sqrtPriceX96); //INITIALIZE POOL
    await initializeTx.wait();

    console.log("Adding liquidity to the pool...");
    const tx2 = await factory.addInitialLiquidity(token0, token1, factoryAddress, token0amount, token1amount,{
        gasLimit: 5000000 // Set a higher gas limit for adding liquidity
    });

    await tx2.wait();

    console.log("Liquidity added successfully!");

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });