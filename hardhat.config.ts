import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const DEV_PK = vars.get("DEV_PK");
const SEPOLIA_RPC_URL = vars.get("SEPOLIA_RPC_URL");
const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [DEV_PK],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
