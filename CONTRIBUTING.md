# Contributing

Thank you for considering contributing to `hardhat-starknet`! This guide covers setup, development workflows, testing, and the pull request process.

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| **Node.js** | >= 20 | Older versions may work but aren't tested |
| **npm** | Bundled with Node.js | Lockfile is `package-lock.json` |
| **Scarb** | Latest | [Install guide](https://docs.swmansion.com/scarb/download.html) |
| **starknet-devnet** | Latest | Required only for integration tests (`npm test` with full suite) |

### Installing Scarb

```bash
curl -L https://docs.swmansion.com/scarb/install.sh | sh
```

### Installing starknet-devnet

```bash
pip install starknet-devnet
```

## Getting Started

```bash
# Clone the repository
git clone https://github.com/zynorr/hardhat-starknet.git
cd hardhat-starknet

# Install dependencies
npm install

# Build the plugin
npm run build
```

## Development Workflow

### Build

Compile TypeScript to `dist/`:

```bash
npm run build
```

### Typecheck

Check `src/` only (fast):

```bash
npm run typecheck
```

Check all files including tests and examples:

```bash
npm run typecheck:all
```

### Lint

```bash
npm run lint
```

### Format

Check formatting:

```bash
npm run format
```

Auto-fix formatting:

```bash
npm run format:fix
```

### Full validation before pushing

```bash
npm run build && npm run typecheck:all && npm run lint && npm run format && npm test
```

## Testing

### Test structure

```
tests/
├── config.test.ts              # Config schema, validation, resolution
├── manifest.test.ts            # Scarb.toml manifest parsing
├── artifact-discovery.test.ts  # Compiled contract discovery
├── negative.test.ts            # Error handling and edge cases
└── integration/
    └── deploy-call.test.ts     # Full deploy/call/invoke flow against devnet
```

### Running tests

**Unit tests only** (fast, no external dependencies):

```bash
npm run test:unit
```

**Integration tests only** (requires devnet on port 5050):

```bash
# Terminal 1: Start devnet
starknet-devnet --seed 0 --port 5050

# Terminal 2: Run integration tests
npm run test:integration
```

**Full test suite** (all unit + integration tests):

```bash
npm test
```

> **Note:** Integration tests gracefully skip (`this.skip()`) when `starknet-devnet` or `scarb` aren't available, so `npm test` works cleanly in any environment.

### Writing tests

- **Framework:** Mocha + Chai (`expect` style)
- **TypeScript:** Tests run via `ts-node` at runtime — no separate compilation needed
- **Naming:** Test files use `.test.ts` extension in `tests/`
- **Pattern:** Group related tests with `describe`, individual tests with `it`
- **Integration tests:** Use `this.skip()` in a `before` hook to conditionally skip the entire suite when devnet or scarb aren't available — CI runs `npm test` but integration tests skip gracefully since devnet isn't set up there. See `tests/integration/deploy-call.test.ts` for the pattern.

## Project Structure

```
├── src/
│   ├── index.ts              # Plugin entry point (re-exports)
│   ├── plugin.ts             # Orchestrator — wires tasks, hooks, extensions
│   ├── types.ts              # Shared TypeScript types
│   ├── config/
│   │   ├── schema.ts         # JSON Schema for starknet config
│   │   ├── validate.ts       # Config validation logic
│   │   └── resolve.ts        # Config defaults and resolution
│   ├── scarb/
│   │   ├── build.ts          # Scarb compilation runner
│   │   ├── manifest.ts       # Scarb.toml manifest parser
│   │   ├── artifacts.ts      # Compiled artifact discovery
│   │   └── paths.ts          # Scarb path resolution
│   ├── starknet/
│   │   ├── client.ts         # Starknet RPC client
│   │   └── network.ts        # Network URL resolution
│   ├── tasks/
│   │   ├── build.ts          # starknet:build task
│   │   ├── deploy.ts         # starknet:deploy task
│   │   ├── call.ts           # starknet:call / starknet:invoke tasks
│   │   └── init.ts           # starknet:create-account task
│   └── hooks/                # Hardhat extension hooks
├── tests/                    # Test suite
├── examples/
│   └── basic/                # Complete working example project
├── docs/                     # Documentation
└── dist/                     # Build output (gitignored)
```

## Code Style

- **TypeScript** with strict mode enabled
- **Semicolons** required
- **Double quotes** for strings
- **Trailing commas** everywhere
- **Print width** 100 characters
- **2-space** indentation

ESLint and Prettier configurations are in `.eslintrc.json` and `.prettierrc.json`. Run `npm run lint` and `npm run format` to check compliance.

## Pull Request Workflow

### 1. Create a branch

```bash
git checkout -b feat/my-feature
```

Use a descriptive prefix:

| Prefix | Use case |
|--------|----------|
| `feat/` | New feature or task |
| `fix/` | Bug fix |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring with no behavior change |
| `chore/` | Build, CI, or tooling changes |

### 2. Make changes

- Keep changes focused — one PR per feature/fix
- Write or update tests to cover your changes
- Run `npm run typecheck:all` and `npm test` to verify nothing is broken

### 3. Commit

Use clear, concise commit messages:

```bash
git commit -m "Add support for custom artifact directories"
```

### 4. Open a PR

- Target the `main` branch
- Describe what the change does and why
- Note any breaking changes or migration steps

### 5. CI checks

The CI workflow (`.github/workflows/ci.yml`) runs automatically on every push/PR to `main`:

| Job | Runs | What it checks |
|-----|------|----------------|
| **Typecheck** | `npm ci` → `npm run typecheck:all` | Type errors across src, tests, and examples |
| **Test** | `npm ci` → `npm run build` → `npm test` | All unit tests pass; integration tests skip gracefully |

Both checks must pass before merging.

### 6. Review

A maintainer will review your PR. Feedback may include:

- Suggestions for simplifying the implementation
- Questions about edge cases not covered by tests
- Requests to split large changes into smaller PRs

## Example project

The `examples/basic/` directory contains a complete Starknet project that uses the plugin:

```
examples/basic/
├── Scarb.toml
├── src/lib.cairo          # HelloStarknet contract (balance + greeting)
├── hardhat.config.ts
├── scripts/
│   ├── deploy.ts          # Declare + deploy script
│   └── call.ts            # Read/write script
└── package.json
```

To verify your changes work end-to-end:

```bash
# Terminal 1
starknet-devnet --seed 0 --port 5050

# Terminal 2
cd examples/basic
npm install
export STARKNET_ACCOUNT=0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691
export STARKNET_PRIVATE_KEY=0x71d7bb07b9a64f6f78ac4c816aff4da9

# Deploy
npx hardhat run scripts/deploy.ts

# Call
CONTRACT_ADDRESS=0x... npx hardhat run scripts/call.ts
```

## Need help?

Open an issue on GitHub. For Starknet-specific questions, refer to the [Starknet documentation](https://docs.starknet.io/).
