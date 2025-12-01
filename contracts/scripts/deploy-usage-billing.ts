import hre from "hardhat";

const { ethers } = await hre.network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying UsageBilling with account:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", balance.toString());

  const UsageBilling = await ethers.getContractFactory("UsageBilling", deployer);
  const contract = await UsageBilling.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("✅ UsageBilling deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});