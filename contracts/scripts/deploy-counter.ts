import hre from "hardhat";
const { ethers } = await hre.network.connect();

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying Counter with account:", deployer.address);
  console.log("Deployer balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const Counter = await ethers.getContractFactory("Counter");
  const counter = await Counter.deploy();

  await counter.waitForDeployment();

  const address = await counter.getAddress();
  console.log("✅ Counter deployed at:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
