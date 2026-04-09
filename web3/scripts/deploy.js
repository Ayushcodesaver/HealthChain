async function main() {
  const { ethers } = require("hardhat");

  const signers = await ethers.getSigners();
  console.log("Signers found:", signers.length);

  const deployer = signers[0];

  if (!deployer) {
    throw new Error(
      "No deployer account found. Check web3/.env PRIVATE_KEY and hardhat.config.js sepolia accounts."
    );
  }

  console.log("Deploying Healthcare with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  const Healthcare = await ethers.getContractFactory("Healthcare");
  const healthcare = await Healthcare.deploy();

  await healthcare.deployed();

  console.log("Healthcare deployed to:", healthcare.address);

  console.log(
    "\nSet in the project root .env.local:\nNEXT_PUBLIC_CONTRACT_ADDRESS=" +
      healthcare.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});