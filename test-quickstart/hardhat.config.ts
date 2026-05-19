import { HardhatUserConfig } from "hardhat/config";
import "hardhat-starknet";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  starknet: {
    network: "devnet",
    wallet: {
      accountAddress: process.env.STARKNET_ACCOUNT,
      privateKey: process.env.STARKNET_PRIVATE_KEY,
    },
  },
};

export default config;
