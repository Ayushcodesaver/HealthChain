const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Healthcare with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  const Healthcare = await hre.ethers.getContractFactory("Healthcare");
  const healthcare = await Healthcare.deploy();
  await healthcare.deployed();

  const address = healthcare.address;
  console.log("Healthcare deployed to:", address);
  console.log(
    "\nSet in the project root .env.local:\nNEXT_PUBLIC_CONTRACT_ADDRESS=" +
      address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
