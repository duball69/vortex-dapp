const { ethers } = require("hardhat");

async function calculateAPY(stakingContract) {
  try {
    let totalStaked = await stakingContract.totalStaked();
    const totalRewards = await stakingContract.totalRewards();

    if (ethers.BigNumber.from(totalStaked).eq(0)) {
      console.log("No staked capital.");
      return 0;
    }

    const rewardIntervalSeconds = 300; // 5 minutes
    const secondsInYear = 31536000;
    const intervalsPerYear = secondsInYear / rewardIntervalSeconds;
    const annualRewards = totalRewards.mul(intervalsPerYear);
    const apy = annualRewards.mul(100).div(totalStaked);

    console.log(`Current APY: ${ethers.utils.formatUnits(apy, "wei")}%`);
    return apy;
  } catch (error) {
    console.error("Failed to calculate APY:", error);
    return null;
  }
}

async function main() {
  const stakingContractAddress =
    process.env.STAKING_CONTRACT_ADDRESS ||
    "0xdB70E2a2bd6aAfc3190048D9C096f67D75791a88";
  const [signer] = await ethers.getSigners();
  const stakingContract = await ethers.getContractAt(
    "SimpleStaking",
    stakingContractAddress,
    signer
  );

  const apy = await calculateAPY(stakingContract);
  if (apy !== null) {
    console.log(`APY successfully calculated: ${apy}`);
  }
}

main().catch((error) => {
  console.error("Main execution failed:", error);
  process.exit(1);
});
