# Quickstart

## Prerequisites

- **Node.js 18+** and npm/pnpm
- **Scarb** — install: `curl -L https://docs.swmansion.com/scarb/install.sh | sh`

## Install

```bash
npm install --save-dev hardhat-starknet
```

## Minimal config

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-starknet";

const config: HardhatUserConfig = {
  starknet: {
    network: "devnet",
  },
};

export default config;
```

## Build, deploy, call

```bash
# Compile Cairo contracts
npx hardhat compile:starknet

# Start devnet (separate terminal)
starknet-devnet --seed 0 --port 5050

# Create an account
npx hardhat starknet:create-account
# Export the printed address/private key

# List compiled contracts
npx hardhat starknet:list-contracts

# Declare
npx hardhat starknet:declare \
  --sierra target/dev/hello_starknet_HelloStarknet.contract_class.json \
  --casm target/dev/hello_starknet_HelloStarknet.compiled_contract_class.json

# Deploy
npx hardhat starknet:deploy \
  --classHash <class_hash> \
  --constructorArgs "0x48656c6c6f"

# Call
npx hardhat starknet:call \
  --contract <contract_address> \
  --function get_greeting
```

## See also

- [Configuration reference](./config.md)
- [Troubleshooting](./troubleshooting.md)
- [Example project](../examples/basic/)
