const path = require("path");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: path.join(__dirname, ".env") });

function deployerAccounts() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk || typeof pk !== "string") return [];
  const trimmed = pk.trim();
  if (!trimmed.startsWith("0x") || trimmed.length !== 66) return [];
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
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: process.env.LOCALHOST_RPC_URL || "http://127.0.0.1:8545",
      chainId: 1337,
    },
    holesky: {
      url:
        process.env.NETWORK_RPC_URL ||
        "https://ethereum-holesky.publicnode.com",
      accounts: deployerAccounts(),
      chainId: 17000,
    },
    hoodi: {
      url: process.env.HOODI_RPC_URL || process.env.NETWORK_RPC_URL,
      accounts: deployerAccounts(),
      chainId: 560048,
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