import type { ScarbManifest } from "./scarb/manifest";

import "hardhat/types/config";
import "hardhat/types/runtime";

declare module "hardhat/types/config" {
  export interface StarknetConfig {
    /** Starknet network URL or alias ("devnet", "sepolia", "mainnet") */
    network?: string;
    /** Path to the scarb binary */
    scarbPath?: string;
    /** Wallet configuration for deployment */
    wallet?: {
      /** Account address on Starknet */
      accountAddress?: string;
      /** Private key for the account */
      privateKey?: string;
    };
    /** Default compilation profile ("release", "debug", "dev") */
    profile?: string;
    /** Package name from Scarb.toml (overrides auto-detection) */
    packageName?: string;
    /** Custom artifact output directory (default: "target/dev") */
    artifactDir?: string;
  }

  export interface HardhatUserConfig {
    starknet?: StarknetConfig;
  }

  export interface HardhatConfig {
    starknet: StarknetConfig;
  }
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    starknet: StarknetPlugin;
  }
}

/**
 * StarknetPlugin provides the core API exposed to Hardhat scripts and tasks.
 * All methods return promises and accept standard Starknet parameters.
 */
export interface StarknetPlugin {
  /** Deploy a pre-declared contract class. */
  deploy(classHash: string, constructorCalldata?: string[]): Promise<string>;

  /** Call a read-only function on a Starknet contract. */
  call(contractAddress: string, functionName: string, calldata?: string[]): Promise<string[]>;

  /** Execute a state-changing function on a Starknet contract. */
  invoke(contractAddress: string, functionName: string, calldata?: string[]): Promise<string>;

  /** Declare a compiled contract class to Starknet. */
  declare(sierraArtifactPath: string, casmArtifactPath: string): Promise<string>;

  /** Get the default account address used for transactions. */
  getAccountAddress(): string;

  /** Get the provider URL being used. */
  getProviderUrl(): string;

  /** Compile Cairo contracts using Scarb. */
  compile(): Promise<{ success: boolean; output: string }>;

  /** Find compiled contract artifacts (Sierra + CASM) from scarb output. */
  findArtifacts(contractName: string): Promise<{ sierra: string; casm: string } | null>;

  /** Declare and deploy a contract in one step. */
  declareAndDeploy(
    sierraArtifactPath: string,
    casmArtifactPath: string,
    constructorCalldata?: string[],
  ): Promise<{ classHash: string; contractAddress: string }>;

  /** Wait for a transaction to complete and return its emitted events. */
  getEvents(txHash: string): Promise<any[]>;

  /** Create and deploy a new Starknet account. */
  createAccount(fundingAmountWei?: string): Promise<{
    address: string;
    privateKey: string;
    publicKey: string;
  }>;

  /** Parse the Scarb.toml manifest for the current project. */
  parseManifest(projectRoot?: string): Promise<ScarbManifest | null>;

  /** Validate the starknet configuration. Returns an array of errors; empty array means valid. */
  validateConfig(): Array<{ path: string; message: string }>;

  /** List all available compiled contract names from the artifact directory. */
  listContracts(): Promise<string[]>;
}
