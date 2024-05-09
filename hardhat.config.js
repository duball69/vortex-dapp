require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-ethers");
require("@nomicfoundation/hardhat-network-helpers");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks:{
  sepolia:{
    url: process.env.ALCHEMY_SEPOLIA_ENDPOINT,
    accounts: [process.env.SEPOLIA_PRIVATE_KEY],
  },

  base:{
    url: process.env.ALCHEMY_BASE_ENDPOINT,
    accounts: [process.env.SEPOLIA_PRIVATE_KEY],
  },

  localhost: {
    url: "http://127.0.0.1:8545", // This is the default URL for the Hardhat node
  },
},
};
