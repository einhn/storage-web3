import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import { HardhatUserConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

const {
  ARBITRUM_SEPOLIA_RPC = "",
  DEPLOYER_PRIVATE_KEY,
  ARBISCAN_API_KEY,
} = process.env;

const config: HardhatUserConfig = {
  plugins: [
    hardhatToolboxMochaEthersPlugin,
    hardhatVerify,
  ],

  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },

  verify: {
    etherscan: {
      apiKey: ARBISCAN_API_KEY 
    },
  },

  networks: {
    // 로컬 시뮬레이션
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },

    // Ethereum Sepolia (L1)
    // sepolia: {
    //   type: "http",
    //   chainType: "l1",
    //   url: configVariable("SEPOLIA_RPC_URL"),
    //   accounts: [configVariable("SEPOLIA_PRIVATE_KEY")],
    // },

    // ✅ Arbitrum Sepolia (L2)
    arbitrumSepolia: {
      type: "http",
      chainType: "op", // optimistic rollup
      url: ARBITRUM_SEPOLIA_RPC,
      accounts: DEPLOYER_PRIVATE_KEY
        ? [DEPLOYER_PRIVATE_KEY]
        : [],
      // chainId: 421614,
    },
  },
};

export default config;