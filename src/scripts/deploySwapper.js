const { ethers } = require("hardhat");

async function main() {
  // Replace these addresses with the correct ones for your deployment
  const positionManagerAddress = "0x1238536071E1c677A632429e3655c799b22cDA52"; // Uniswap V3 Position Manager address
  const swapRouterAddress = "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD"; // Uniswap V3 Swap Router address
  const wethAddress = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"; // WETH address

  // Get the contract factory for TokenEthSwapper
  const TokenEthSwapper = await ethers.getContractFactory("TokenSwapper");

  // Deploy the contract with the specified addresses
  const tokenEthSwapper = await TokenEthSwapper.deploy(
    positionManagerAddress,
    swapRouterAddress,
    wethAddress
  );

  const deploymentReceipt = await tokenEthSwapper
    .deploymentTransaction()
    .wait(2);

  const contractAddress = deploymentReceipt.contractAddress;

  // Print out the deployment information
  console.log("TokenEthSwapper deployed to:", contractAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
