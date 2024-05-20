const { ethers } = require("hardhat");
const { Pool, Token, Price } = require('@uniswap/sdk-core');
const JSBI = require('jsbi');
const BigNumber = ethers.BigNumber;

const poolTokenAddresses = [];


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

async function getTokenApprovedEvent(factory) {
    // Get the filter for the PoolCreated event
    const filter = factory.filters.TokenApproved();

    // Query the filter for events emitted by the factory contract
    const events = await factory.queryFilter(filter);

    // Log the events array to inspect its contents
    console.log("Events array:", events);

    // Find the PoolCreated event matching the token address
    const tokenApprovedEvent = events[events.length - 1]; // Assuming the latest event corresponds to the pool creation

    return tokenApprovedEvent;
}


async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Interacting with the factory contract using the account:", deployer.address);

    // Replace this with the address of the deployed factory contract
    const factoryAddress = "0xb16b40b5d1F9B7478B3ffF43487042546aDbAa85";

    // Connect to the factory contract using its ABI and address
    const Factory = await ethers.getContractFactory("MyFactory");
    const factory = await Factory.attach(factoryAddress);

    const tokenAddress = "0x1e4114b68d6becB1a4ac2dC4b7A672f27798a66D";

    //const pool_Address = "0x1c00Afa3Ba73471359661C537c036CA5915A4330";
    const pool_Address = "0x259Ac28B1c2FCb1a40fD0c6322Dc7C71BDa3813D";

    const WETH_address = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14";
    const positionManager_address = "0x1238536071E1c677A632429e3655c799b22cDA52";

    const tokenAmount = ethers.parseUnits("30000", 18); // 30,000 tokens
    const wethAmount = ethers.parseUnits("1", 18); // 1 WETH

    
    // Calculate sqrtPriceX96 considering both tokens have 18 decimals
    const priceRatio = BigInt(10 ** 18) / BigInt(30000);
    const sqrtPriceRatio = sqrt(priceRatio * (BigInt(10 ** 18) / BigInt(10 ** 18)));
    const sqrtPriceX96 = (sqrtPriceRatio * (2n ** 96n)) / (10n ** 9n); // Scale to 2^96
    console.log(`Calculated sqrtPriceX96: ${sqrtPriceX96.toString()}`);


    // Initialize the pool
    const initializeTx = await factory.initializePool(pool_Address, sqrtPriceX96);
    await initializeTx.wait();


    // Approve tokens for the factory contract
    console.log("Approving tokens for the factory contract...");
    const approveTokenTx = await factory.approveToken(tokenAddress, positionManager_address, tokenAmount);
    await approveTokenTx.wait();
    console.log("Tokens approved.");

    const approveWETHTx = await factory.approveToken(WETH_address, positionManager_address, wethAmount);
    await approveWETHTx.wait();
    console.log("WETH approved.");

    console.log("Adding liquidity to the pool...");
    const tx = await factory.addInitialLiquidity(tokenAddress, pool_Address, factoryAddress, tokenAmount, wethAmount,{
        gasLimit: 5000000 // Set a higher gas limit for adding liquidity
    });

    const receipt = await tx.wait();

    console.log("Liquidity added successfully!");

    console.log("receipt = ",receipt);

    // Get the PoolCreated event emitted by the factory contract
    const tokenApprovedEvent = await getTokenApprovedEvent(factory);

    if (tokenApprovedEvent) {
        //const pool_Address = tokenApprovedEvent.args[1];
        console.log('Token Approved Successfully');
        
    } else {
        console.error('TokenApproved event not found');
    }


}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });