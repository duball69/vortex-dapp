const hre = require("hardhat");
const { ethers } = hre;

async function getLatestEvent(token, eventname) {
  // Get the filter for the specified event
  const filter = token.filters[eventname]();

  // Query the filter for events emitted by the contract
  const events = await token.queryFilter(filter);

  // Find the latest event
  const latestEvent = events[events.length - 1]; // Get the latest event

  return latestEvent;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Removing liquidity with the account:", deployer.address);

  const factoryAddress = "0x5892F7EF2Cb0017C75a51D6bbB91f5C1615CbB29";

  const lockerAddress = "0x2eb803Ca9DA5730B66365545D93e59c2aFB28D4C";

  const position_manager = process.env.SEPOLIA_POSITION_MANAGER;

  const Factory = await hre.ethers.getContractFactory("MyFactory");
  const factory = await Factory.attach(factoryAddress);

  const LiquidityLocker = await ethers.getContractFactory("LiquidityLocker");
  const locker = await LiquidityLocker.attach(lockerAddress);

  const [
    addresses,
    tokenIds,
    timestamps,
    liquidityRemovedStatus,
    zeroFeesDays,
    isInactive,
    lastFee,
    lockID,
    isLocked,
    unlockTime,
    isDead,
  ] = await factory.getAllTokens();

  // Print results
  console.log("Addresses:", addresses);
  console.log("Token IDs:", tokenIds);
  console.log("Timestamps:", timestamps);
  console.log("liquidityRemovedStatus:", liquidityRemovedStatus);
  console.log("lockID:", lockID);
  console.log("isLocked:", isLocked);
  console.log("unlockTime:", unlockTime);
  console.log("isDead:", isDead);

  const currentTime = Math.floor(Date.now() / 1000); // current time in seconds since Unix epoch

  // Loop through all tokens to check their launch time
  for (let i = 0; i < addresses.length; i++) {
    // Check if the token's initial liquidity has already been removed

    if (!liquidityRemovedStatus[i] && currentTime > unlockTime[i]) {
      console.log("Removing initial liquidity and relocking...");
      const tx = await factory.removeInitialLiquidity(tokenIds[i], lockID[i]); // Await here to get the transaction object
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      console.log("Success.");
    } else if (
      liquidityRemovedStatus[i] == true &&
      isInactive[i] == true &&
      currentTime > unlockTime[i]
    ) {
      console.log("Removing all liquidity and marking token as dead...");
      const tx = await factory.removeDeadLiquidity(tokenIds[i], lockID[i]); // Await here to get the transaction object
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      console.log("Success.");
    } else if (
      liquidityRemovedStatus[i] == true &&
      isInactive[i] == false &&
      currentTime > unlockTime[i]
    ) {
      console.log("Relocking liquidity...");
      const duration = 6; // 1 month
      const tx = await factory.relock(tokenIds[i], lockID[i], duration); // Await here to get the transaction object
      const receipt = await tx.wait(); // Wait for the transaction to be mined
      console.log("Done");
    } else {
      console.log(
        `Token at address ${addresses[i]} with token ID ${tokenIds[i]} is still locked or dead.`
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

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
