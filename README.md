

# hardhat-starknet

>  Hardhat plugin for Starknet that uses Scarb, supports local devnet, and gives clean deploy/call workflows.

```bash
npm install --save-dev hardhat-starknet
npx hardhat starknet:build
npx hardhat starknet:deploy --class-hash <hash> --constructor-args "0x48656c6c6f"
npx hardhat starknet:call --contract <addr> --function get_greeting
```

## Why this plugin

The existing Starknet Hardhat plugin proved the category. This is a **modern re-implementation** — built for today's Cairo/Scarb toolchain, with clean config validation from day one, and a modular architecture that won't force a rewrite when Starknet evolves.

**Three improvements over the old approach:**

- **Scarb is the build backend** — explicit, not hidden. `scarb build` produces artifacts; the plugin discovers them. No custom compilation logic.
- **Config validates predictably** — schema, validation, and defaults are three separate files with one job each. Invalid settings fail early with clear messages.
- **Maintainable by design** — three isolated layers (config, scarb, starknet) with no circular imports. Future changes stay contained.

## Quickstart

### 1. Install

```bash
npm install --save-dev hardhat-starknet
```

### 2. Configure

```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-starknet";

const config: HardhatUserConfig = {
  starknet: {
    network: "devnet",              // "devnet", "sepolia", "mainnet", or URL
    wallet: {
      accountAddress: process.env.STARKNET_ACCOUNT,
      privateKey: process.env.STARKNET_PRIVATE_KEY,
    },
  },
};
export default config;
```

### 3. Write a contract

```toml
# Scarb.toml
[package]
name = "hello"
version = "0.1.0"
edition = "2024_07"

[dependencies]
starknet = ">=2.18.0"

[[target.starknet-contract]]
sierra = true
casm = true
```

```cairo
// src/lib.cairo
#[starknet::contract]
mod Hello {
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage { greeting: felt252 }

    #[constructor]
    fn constructor(ref self: ContractState, greeting: felt252) {
        self.greeting.write(greeting);
    }

    #[external(v0)]
    fn get_greeting(self: @ContractState) -> felt252 {
        self.greeting.read()
    }
}
```

### 4. Build → Deploy → Call

```bash
# Terminal 1: Start devnet
starknet-devnet --seed 0 --port 5050

# Terminal 2: Build
npx hardhat starknet:build

# Set account (use one of devnet's pre-funded accounts)
export STARKNET_ACCOUNT=0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691
export STARKNET_PRIVATE_KEY=0x71d7bb07b9a64f6f78ac4c816aff4da9

# Declare + Deploy in one step via script
npx hardhat run examples/basic/scripts/deploy.ts
# Outputs: class hash, contract address, greeting

# Or step by step:
npx hardhat starknet:declare --sierra target/dev/hello_Hello.contract_class.json --casm target/dev/hello_Hello.compiled_contract_class.json
npx hardhat starknet:deploy --class-hash <hash> --constructor-args "0x48656c6c6f"
npx hardhat starknet:call --contract <addr> --function get_greeting
# → [0x48656c6c6f]  ("Hello")
```

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `network` | `"devnet"` | `"devnet"`, `"sepolia"`, `"mainnet"`, or full RPC URL |
| `scarbPath` | `"scarb"` | Path to `scarb` binary |
| `profile` | `"release"` | Compilation profile: `"release"`, `"debug"`, `"dev"` |
| `packageName` | auto-detected | Override package name from Scarb.toml |
| `artifactDir` | `"target/dev"` | Custom artifact output directory |
| `wallet.accountAddress` | env `STARKNET_ACCOUNT` | Account address for transactions |
| `wallet.privateKey` | env `STARKNET_PRIVATE_KEY` | Private key for signing |

## Tasks

| Task | What it does |
|------|-------------|
| `starknet:build` | Compile Cairo contracts with Scarb |
| `starknet:declare` | Declare a compiled contract class |
| `starknet:deploy` | Deploy a declared contract |
| `starknet:call` | Call a read-only function |
| `starknet:invoke` | Execute a state-changing function |
| `starknet:account` | Show current account info |
| `starknet:create-account` | Create a new Starknet account (devnet) |
| `starknet:info` | Show project info from Scarb.toml |
| `starknet:list-contracts` | List compiled contract artifacts |

## Architecture

```
┌──────────────────────────────┐
│  Hardhat tasks + hooks       │  ← Hardhat Plugin Layer
├──────────────────────────────┤
│  plugin.ts (orchestrator)    │  ← Plugin bridge
├──────────────────────────────┤
│  config/   │  scarb/         │
│  schema.ts │  manifest.ts    │  ← Config + Scarb Adapter Layers
│  validate  │  build.ts       │
│  resolve   │  artifacts.ts   │
├──────────────────────────────┤
│  starknet/client.ts          │  ← Starknet Integration Layer
│  starknet/network.ts         │     (RPC, deploy, call, invoke)
└──────────────────────────────┘
```

## Example project

A complete working example lives in [`examples/basic/`](./examples/basic/):

```
examples/basic/
├── Scarb.toml
├── src/lib.cairo
├── hardhat.config.ts
├── scripts/deploy.ts
├── scripts/call.ts
└── package.json
```

```bash
cd examples/basic
npm install
scarb build
STARKNET_ACCOUNT=0x... STARKNET_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.ts
CONTRACT_ADDRESS=0x... npx hardhat run scripts/call.ts
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `scarb: command not found` | Install Scarb: `curl -L https://docs.swmansion.com/scarb/install.sh \| sh` |
| `Compiled artifacts not found` | Run `scarb build` first. Check `Scarb.toml` has `sierra = true` and `casm = true` |
| `Cannot connect to devnet` | Run `starknet-devnet --seed 0 --port 5050` |
| `No account configured` | Set `STARKNET_ACCOUNT` and `STARKNET_PRIVATE_KEY` env vars |
| `Transaction rejected by RPC` | Check account balance, calldata format, and function name |

## Development

```bash
git clone <repo>
cd hardhat-starknet-plugin
npm install
npm run build
npm run test:unit      # unit tests only (fast)
npm test               # all tests (requires devnet for integration)
```

## License

MIT
