require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();
require("@nomicfoundation/hardhat-verify");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    },
  },
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_SEPOLIA_ENDPOINT,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY],
    },
    base: {
      url: process.env.ALCHEMY_BASE_ENDPOINT,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY],
    },
    op: {
      url: process.env.ALCHEMY_OP_ENDPOINT,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY],
    },
    celo: {
      url: process.env.ALCHEMY_CELO_ENDPOINT,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY],
    },
    localhost: {
      url: "http://127.0.0.1:8545", // This is the default URL for the Hardhat node
    },
  },
  etherscan: {
    apiKey: {
      // Is not required by blockscout. Can be any non-empty string
      base: "abc",
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://base.blockscout.com/api",
          browserURL: "https://base.blockscout.com/",
        },
      },
    ],
  },
  sourcify: {
    enabled: false,
  },
};
