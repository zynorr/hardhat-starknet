# Configuration Reference

## `starknet` config options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `network` | `string` | `"devnet"` | Starknet network: `"devnet"`, `"sepolia"`, `"mainnet"`, or full RPC URL |
| `scarbPath` | `string` | `"scarb"` | Path to the `scarb` binary |
| `profile` | `string` | `"release"` | Compilation profile: `"release"`, `"debug"`, or `"dev"` |
| `packageName` | `string` | auto-detected | Override the package name from Scarb.toml |
| `artifactDir` | `string` | `"target/dev"` | Custom artifact output directory |
| `wallet.accountAddress` | `string` | env var `STARKNET_ACCOUNT` | Account address for transactions |
| `wallet.privateKey` | `string` | env var `STARKNET_PRIVATE_KEY` | Private key for signing |

## Available tasks

| Task | Description |
|------|-------------|
| `compile:starknet` | Compile Cairo contracts with Scarb |
| `starknet:build` | Alias for `compile:starknet` |
| `starknet:declare` | Declare a compiled contract class |
| `starknet:deploy` | Deploy a declared contract |
| `starknet:call` | Call a read-only function |
| `starknet:invoke` | Execute a state-changing function |
| `starknet:account` | Show current account info |
| `starknet:create-account` | Create a new Starknet account (devnet) |
| `starknet:info` | Show Cairo project info from Scarb.toml |
| `starknet:list-contracts` | List compiled contract artifacts |

## Layer architecture

```
Hardhat tasks + hooks        ← Hardhat Plugin Layer
    ↓            ↑
StarknetPlugin orchestrator  ← Plugin bridge
    ↓            ↑
StarknetClient               ← Starknet Integration Layer
(provider, account, call,
 deploy, declare, events)

ScarbBuild / Artifacts       ← Scarb Adapter Layer
Manifest Parser / Paths
```
