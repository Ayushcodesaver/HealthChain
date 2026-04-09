const path = require("path");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: path.join(__dirname, ".env") });

function deployerAccounts() {
  const pk = process.env.PRIVATE_KEY;

  if (!pk || typeof pk !== "string") {
    console.log("❌ PRIVATE_KEY missing in web3/.env");
    return [];
  }

  const trimmed = pk.trim();

  if (!trimmed.startsWith("0x") || trimmed.length !== 66) {
    console.log("❌ PRIVATE_KEY invalid format. Must be 0x + 64 hex chars");
    return [];
  }

  console.log("✅ PRIVATE_KEY loaded correctly");
  return [trimmed];
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    sepolia: {
      url:
        process.env.SEPOLIA_RPC_URL ||
        "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: deployerAccounts(),
      chainId: 11155111,
    },
  },
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache",
    tests: "./test",
  },
  sourcify: {
    enabled: true,
  },
};