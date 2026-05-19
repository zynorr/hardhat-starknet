/**
 * User-provided Starknet plugin configuration.
 */
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

/**
 * Starknet plugin config with all defaults resolved.
 * This is the runtime config object that tasks and services consume.
 */
export interface ResolvedStarknetConfig {
  /** Starknet network URL or alias ("devnet", "sepolia", "mainnet") */
  network: string;
  /** Path to the scarb binary */
  scarbPath: string;
  /** Cairo compilation profile (e.g., "release", "debug") */
  profile: string;
  /** Package name from Scarb.toml (overrides auto-detection) */
  packageName?: string;
  /** Custom artifact output directory (default: "target/dev") */
  artifactDir?: string;
  /** Wallet configuration for deployment */
  wallet?: {
    accountAddress?: string;
    privateKey?: string;
  };
}

/**
 * Validation error with a human-readable message.
 */
export interface ConfigValidationError {
  /** Dot-separated path to the invalid field (e.g., "starknet.wallet") */
  path: string;
  /** Human-readable error message */
  message: string;
}
