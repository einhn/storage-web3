import hre from "hardhat";
import { promises as fs } from "fs";
import path from "path";

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

  // 배포 정보 JSON으로 저장
  const network = await ethers.provider.getNetwork();

  const artifact = await hre.artifacts.readArtifact("UsageBilling");
  const outDir = path.join(
    process.cwd(),
    "..",
    "..",
    "backend",
    "contracts",
    "deployed"
  );
  await fs.mkdir(outDir, { recursive: true });

  const data = {
    address,
    chainId: Number(network.chainId),
    network: "arbitrumSepolia",
    abi: artifact.abi,
  };

  const outPath = path.join(outDir, "usageBilling.arbitrum-sepolia.json");
  await fs.writeFile(outPath, JSON.stringify(data, null, 2));

  console.log(`💾 Saved deployment info to ${outPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});