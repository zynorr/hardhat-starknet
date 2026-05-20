import type { StarknetConfig, ResolvedStarknetConfig } from "./schema";

/**
 * Runtime defaults for the Starknet plugin configuration.
 */
export const DEFAULT_CONFIG: ResolvedStarknetConfig = {
  network: "devnet",
  scarbPath: "scarb",
  profile: "release",
  artifactDir: "target/dev",
};

/**
 * Known network aliases that resolve to RPC URLs.
 */
export const NETWORK_ALIASES: Record<string, string> = {
  devnet: "http://127.0.0.1:5050",
  sepolia: "https://sepolia.starknet.io",
  mainnet: "https://alpha-mainnet.starknet.io",
};

/**
 * Resolve a user config (with defaults) into a complete runtime config.
 * Merges user-provided values with sane defaults.
 *
 * @param userConfig - Partial user config from hardhat.config.ts
 * @returns Fully resolved config with all fields set
 */
export function resolveConfig(userConfig?: Partial<StarknetConfig>): ResolvedStarknetConfig {
  return {
    network: userConfig?.network ?? DEFAULT_CONFIG.network,
    scarbPath: userConfig?.scarbPath ?? DEFAULT_CONFIG.scarbPath,
    profile: userConfig?.profile ?? DEFAULT_CONFIG.profile,
    packageName: userConfig?.packageName,
    artifactDir: userConfig?.artifactDir ?? DEFAULT_CONFIG.artifactDir,
    wallet:
      userConfig?.wallet &&
      (userConfig.wallet.accountAddress !== undefined || userConfig.wallet.privateKey !== undefined)
        ? userConfig.wallet
        : {
            accountAddress: process.env.STARKNET_ACCOUNT,
            privateKey: process.env.STARKNET_PRIVATE_KEY,
          },
  };
}

/**
 * Resolve a network alias to its full RPC URL.
 * Returns the input unchanged if it's already a URL.
 *
 * @param network - Network alias or URL
 * @returns Full RPC URL
 * @throws If the network alias is unknown and it's not a URL
 */
export function resolveNetworkUrl(network: string): string {
  if (network.startsWith("http://") || network.startsWith("https://")) {
    return network;
  }

  const url = NETWORK_ALIASES[network];
  if (!url) {
    throw new Error(
      `Unknown Starknet network: "${network}". ` +
        `Use one of: ${Object.keys(NETWORK_ALIASES).join(", ")}, or a full RPC URL.`,
    );
  }
  return url;
}
