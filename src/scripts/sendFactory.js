// scripts/sendEthToFactory.js
require("dotenv").config();
const { ethers } = require("hardhat");

async function convertEthAndSendToFactory(
  factoryAddress,
  wethAddress,
  amountInEth
) {
  try {
    const [sender] = await ethers.getSigners(); // Get the first signer (deployer)

    console.log(
      `Converting ${amountInEth} ETH to WETH and sending to Factory at address: ${factoryAddress}`
    );

    // Step 1: Convert ETH to WETH
    const wethABI = [
      "function deposit() payable",
      "function balanceOf(address owner) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
    ];
    const wethContract = new ethers.Contract(wethAddress, wethABI, sender);

    const amountToConvert = ethers.parseEther(amountInEth.toString());
    const depositTx = await wethContract.deposit({ value: amountToConvert });
    await depositTx.wait();

    console.log(
      `Successfully converted ${ethers.formatEther(
        amountToConvert
      )} ETH to WETH.`
    );

    // Step 2: Approve the factory to spend the converted WETH
    const approveTx = await wethContract.approve(
      factoryAddress,
      amountToConvert
    );
    await approveTx.wait();

    console.log(
      `Approved ${ethers.formatEther(
        amountToConvert
      )} WETH for the factory contract.`
    );

    // Step 3: Call transferWETHToFactory on the factory contract
    const factoryABI = [
      "function transferWETHToFactory(uint256 amount) external",
    ];
    const factoryContract = new ethers.Contract(
      factoryContractAddress,
      factoryABI,
      sender
    );

    const transferTx = await factoryContract.transferWETHToFactory(
      amountToConvert
    );
    await transferTx.wait();

    console.log(
      `Successfully sent ${ethers.formatEther(
        amountToConvert
      )} WETH to the factory contract.`
    );
  } catch (error) {
    console.error(
      "An error occurred while sending WETH to the factory:",
      error
    );
    console.log("Error details:", error.message);
  }
}

async function main() {
  const factoryContractAddress = process.env.REACT_APP_FACTORY_SEPOLIA_CA;
  // Replace with your actual factory contract address
  const wethAddress = "0xfff9976782d46cc05630d1f6ebab18b2324d6b14"; // Replace with the WETH address on your network
  const amountInEth = 0.02; // The amount of ETH to convert to WETH and send

  await convertEthAndSendToFactory(
    factoryContractAddress,
    wethAddress,
    amountInEth
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Unhandled error in main execution:", error);
    console.log("Error details:", error.message);
    process.exit(1);
  });
