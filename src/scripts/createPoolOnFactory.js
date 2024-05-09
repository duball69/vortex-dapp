const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Interacting with the factory contract using the account:", deployer.address);

    // Replace this with the address of the deployed factory contract
    const factoryAddress = "0xEc920653009D228D044cEAF59563b2d41c07eA6F";

    // Connect to the factory contract using its ABI and address
    const Factory = await ethers.getContractFactory("MyFactory");
    const factory = await Factory.attach(factoryAddress);

    const tokenAddress = "0x71eDe4424302aBFA9DFa71310042b7BEa09bf08b";

    // Create a Uniswap pool paired with ETH
    const poolAddress = await factory.createPoolForToken(tokenAddress);
    console.log("Pool created at address:", poolAddress);

    const pool_Address = "0x667EB9B0d91D3bb9c080486bc96c21CAB9CAFa85";

    // Add liquidity to the pool
    await factory.addInitialLiquidity(tokenAddress, pool_Address);
    console.log("Liquidity added successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
