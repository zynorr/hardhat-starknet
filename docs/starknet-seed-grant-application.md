# Starknet Seed Grant Application

## hardhat-starknet — A Modern Hardhat Plugin for Starknet

---

## 1. Project Overview

**Project Name:** hardhat-starknet

**Tagline:** A modern, modular Hardhat plugin for Starknet that leverages Scarb as its build backend — tested on local devnet, config-ready for Sepolia and mainnet — and provides clean deploy/call/invoke workflows.

**Repository:** https://github.com/zynorr/hardhat-starknet

**License:** MIT

**Current Version:** 0.1.0-alpha.1

**Category:** Developer Tooling & Infrastructure

---

## 2. Problem Statement

The Starknet developer experience has evolved rapidly — Scarb replaced the old compiler, Sierra + CASM replaced raw Cairo bytecode, and Hardhat itself has gone through multiple major versions. Yet the existing Starknet Hardhat plugin (`@shardlabs/starknet-hardhat-plugin`) was built for a different era:

- **Legacy compilation:** It implemented its own compilation logic instead of delegating to Scarb, the official Cairo package manager and build tool.
- **Outdated architecture:** Tight coupling between config, compilation, and deployment logic makes it hard to maintain or extend.
- **Limited test coverage:** Few unit tests, making it risky to upgrade dependencies or add features.
- **Config opacity:** Configuration errors surface at runtime rather than at environment setup time, wasting developer time.

Starknet developers need a **battle-tested, modern Hardhat plugin** that stays aligned with the evolving Cairo/Starknet toolchain without requiring a rewrite every six months.

---

## 3. Solution

**hardhat-starknet** is a complete re-implementation of Starknet Hardhat integration, designed for the current Cairo/Scarb toolchain with a clean, maintainable architecture.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Scarb as the build backend** | No custom compilation logic. `scarb build` produces artifacts; the plugin discovers them. Stays compatible with future Scarb updates automatically. |
| **Three-layer architecture** | Config validation, Scarb adapter, and Starknet integration are separate, independently testable modules with no circular imports. |
| **Explicit config validation** | JSON Schema-driven validation fails early with clear messages. Invalid settings can't cause mysterious runtime failures. |
| **Lazy environment initialization** | The Starknet client is lazily constructed via Hardhat's `lazyObject`, so config issues surface at first use, not at import time. |

### Current Feature Set

| Feature | Status |
|---------|--------|
| Scarb-based Cairo compilation (`compile:starknet`, `starknet:build`) | ✅ Done |
| Contract declaration (`starknet:declare`) | ✅ Done |
| Contract deployment (`starknet:deploy`) | ✅ Done |
| Combined declare + deploy in scripts | ✅ Done |
| Read-only function calls (`starknet:call`) | ✅ Done |
| State-mutating invocations (`starknet:invoke`) | ✅ Done |
| Account management (`starknet:account`, `starknet:create-account`) | ✅ Done |
| Compiled artifact discovery | ✅ Done |
| Scarb.toml manifest parsing | ✅ Done |
| Network aliases (devnet, sepolia, mainnet) | ✅ Done |
| Config validation with clear error messages | ✅ Done |
| Environment variable support for wallet credentials | ✅ Done |
| Unit tests (config, manifest, artifact discovery) | ✅ Done |
| CI pipeline (typecheck + tests) | ✅ Done |
| Integration tests against local devnet | ✅ Done |
| Example project with deploy/call scripts | ✅ Done |

---

## 4. Architecture

```
┌──────────────────────────────────┐
│  Hardhat Tasks + Hooks           │  ← Hardhat Plugin Layer
│  compile:starknet                │     (task definitions)
│  starknet:build/deploy/call/...  │
├──────────────────────────────────┤
│  plugin.ts (orchestrator)        │  ← Plugin Bridge
├──────────────────────────────────┤
│  config/    │  scarb/            │
│  schema.ts  │  manifest.ts       │  ← Config + Scarb Adapter Layers
│  validate   │  build.ts          │
│  resolve    │  artifacts.ts      │
│             │  paths.ts          │
├──────────────────────────────────┤
│  starknet/                       │
│  client.ts    (RPC, deploy,      │  ← Starknet Integration Layer
│                call, invoke,     │
│                account mgmt)     │
│  network.ts   (URL resolution)   │
└──────────────────────────────────┘
```

### Why This Architecture Matters

- **Modularity:** Each layer can be tested, upgraded, or replaced independently.
- **No circular imports:** The dependency graph is a strict DAG — config → scarb → starknet.
- **Testability:** Unit tests cover each layer in isolation. Integration tests verify end-to-end flows.
- **Future-proof:** When Starknet changes its RPC spec or Scarb changes its artifact format, only one layer needs updating.

---

## 5. Roadmap & Milestones

### ✅ Phase 1: Core Plugin (Completed — v0.1.0-alpha.1)

The core plugin foundation is built and functional. Currently **tested and verified against local starknet-devnet**. Sepolia and mainnet are architecturally ready (RPC client, config aliases, and provider initialization all support them) but have NOT yet been integration-tested.

| Feature | Status |
|---------|--------|
| Scarb-based compilation | ✅ Tested on devnet |
| Declare + deploy + call + invoke | ✅ Tested on devnet |
| Account creation + management | ✅ Tested on devnet |
| Config validation | ✅ Unit tested |
| Sepolia RPC support | 🔧 Config-ready, untested |
| Mainnet RPC support | 🔧 Config-ready, untested |

### 🎯 Phase 2: Grant-Funded Milestones (6 months total)

The grant will fund the path from a devnet-only alpha to a polished, documented, production-grade v1.0.0-stable release. Milestones are structured to match the Seed Grant program requirements — each 2-3 months apart with clear, verifiable deliverables.

#### Milestone 1: Production Hardening — Sepolia & Mainnet Validation
**Amount:** $10,000 (upfront)
**Timeline:** 2-3 months
**Deliverables:**
- Sepolia testnet integration testing — verify declare, deploy, call, invoke against a real Sepolia testnet node
- Mainnet integration testing — verify all operations against Starknet mainnet
- Robust error handling for production RPC environments (rate limits, timeouts, reorgs)
- Gas estimation support (`starknet:estimate-fee` task)
- Transaction status tracking with human-readable status messages
- Comprehensive error messages for RPC failures
- End-to-end test suite for Sepolia and mainnet (separate from devnet CI)

#### Milestone 2: Event Introspection & Developer Tools
**Amount:** $10,000
**Timeline:** 2-3 months (months 3-4)
**Deliverables:**
- `starknet:events` task — parse and display transaction receipts with structured event data
- `starknet:simulate` task — simulate transactions before executing
- Hardhat Toolbox integration — visual contract browser, account manager, deploy UI
- `starknet:verify` task — contract source verification on Starknet block explorers
- Enhanced multi-contract deployment support

#### Milestone 3: Documentation, Migration & Stable Release
**Amount:** $5,000
**Timeline:** 2-3 months (months 5-6)
**Deliverables:**
- Dedicated documentation website with:
  - API reference for all 9+ tasks
  - Step-by-step tutorials (quickstart, migration, advanced usage)
  - Configuration reference with examples
- Migration guide from `@shardlabs/starknet-hardhat-plugin` to `hardhat-starknet`
- Migration helper script to auto-convert legacy configs
- Security review of the plugin's RPC interaction layer
- v1.0.0-stable release on npm
- Video walkthrough of the complete deploy/call workflow

### 🔭 Phase 3: Advanced Features (Post-Grant)

- **Cairo test runner integration** — surface `scarb test` results in Hardhat's test runner
- **Multi-contract deployment scripts** — declarative deployment YAML/JSON format
- **Account abstraction support** — deploy and interact with ERC-6900 compatible accounts
- **Starknet Foundry integration** — complementary tooling for advanced testing

---

## 6. Budget Request

| Category | Amount (USD) | Details |
|----------|-------------|---------|
| **Milestone 1 — Production hardening** | $10,000 | Sepolia/mainnet validation, gas estimation, error handling, test suites |
| **Milestone 2 — Developer tools** | $10,000 | Event introspection, Toolbox integration, simulation, verification |
| **Milestone 3 — Documentation & release** | $5,000 | Docs site, migration guide, security review, v1.0.0 stable release |
| **Total** | **$25,000** | |

**Funding preference:** STRK tokens

---

## 7. Team

**Lead Developer:** Victor Gunga (@zynorr / @vicgunga)

- Active Starknet ecosystem contributor
- Experience building developer tooling and Hardhat plugins
- Deep understanding of Cairo, Starknet, and the Scarb build system

**Location:** Ruiru, Nairobi, Kenya

**Past Work:**
- `hardhat-starknet` — complete plugin with 9 tasks, config validation, artifact discovery, integration tests
- [Other relevant projects if applicable]

**Links:**
- GitHub: https://github.com/zynorr/hardhat-starknet
- Telegram: @vicgunga
- Email: zynorlawes@gmail.com

---

## 8. Ecosystem Impact

### Why This Matters for Starknet

1. **Lowers the barrier to entry:** Hardhat is the most widely used Ethereum development framework. A polished Starknet plugin means every Hardhat developer can deploy to Starknet with zero learning curve beyond Cairo itself.

2. **Replaces a legacy plugin:** The existing `@shardlabs/starknet-hardhat-plugin` hasn't kept pace with the Cairo/Scarb toolchain. This plugin provides a drop-in replacement with modern architecture and active maintenance.

3. **Enables complex dApp development:** Production Starknet dApps need reliable deploy pipelines, account management, and contract interaction — exactly what this plugin provides as first-class features.

4. **Strengthens the tooling ecosystem:** Every major L2 has Hardhat support. Starknet having modern, well-maintained Hardhat tooling signals maturity to Ethereum developers evaluating L2s.

### Target Users

- **Ethereum developers** migrating to Starknet (familiar Hardhat workflows)
- **Cairo contract authors** who need reliable deploy/test/debug loops
- **Starknet dApp teams** building production applications
- **Educational content creators** teaching Starknet development

---

## 9. Success Metrics

| Metric | Target (6 months post-grant) |
|--------|------------------------------|
| npm downloads | 1,000+ per week |
| GitHub stars | 100+ |
| Active installations | 50+ projects |
| Community PRs | 5+ external contributions |
| Documentation site visits | 500+ unique visitors/month |
| Migration rate from old plugin | 20% of legacy plugin users |

---

## 10. Competition & Differentiation

| Aspect | `@shardlabs/starknet-hardhat-plugin` (legacy) | `hardhat-starknet` (this project) |
|--------|-----------------------------------------------|-----------------------------------|
| Build backend | Custom compilation logic | Delegates to Scarb |
| Architecture | Monolithic | Three-layer (config → scarb → starknet) |
| Config validation | Runtime errors | Early validation with clear messages |
| Test coverage | Minimal | Unit + integration tests in CI |
| Account management | Manual | `starknet:create-account` task |
| Artifact discovery | Hardcoded paths | Pattern-based matching |
| Modularity | Tight coupling | Isolated layers, no circular imports |
| Maintenance | Low activity | Active development |

---

## 11. Additional Context

- **Open source:** MIT license — free for all Starknet developers
- **CI/CD:** GitHub Actions runs typechecking and all tests on every push
- **Compatibility:** Works alongside existing Hardhat Ethereum plugins (e.g., `@nomiclabs/hardhat-waffle`)
- **Getting started:** Complete working example in `examples/basic/` with a deploy script and call script

---

*Prepared for the Starknet Foundation Seed Grant Program*

**Applicant:** Victor Gunga
**Contact:** zynorlawes@gmail.com / @vicgunga (Telegram) / https://github.com/zynorr
**Address:** Archies Apartment, Ruiru, Nairobi, Kenya

**Application Date:** [Date]
