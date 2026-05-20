import type { StarknetConfig, ConfigValidationError } from "./schema";
import { NETWORK_ALIASES } from "./resolve";

/**
 * Validates the user-provided Starknet plugin configuration.
 * Returns an array of errors. An empty array means the config is valid.
 *
 * @param config - The user-provided config (may be partial)
 * @returns Array of validation errors
 *
 * @example
 * const errors = validateStarknetConfig({ network: "invalid" });
 * // errors = [{ path: "starknet.network", message: "Unknown network "invalid"..." }]
 */
export function validateStarknetConfig(config?: Partial<StarknetConfig>): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (!config) {
    errors.push({
      path: "starknet",
      message: "Missing starknet config. Add a `starknet` section to hardhat.config.ts.",
    });
    return errors;
  }

  // Validate network
  if (config.network !== undefined) {
    const net = config.network;
    if (!NETWORK_ALIASES[net] && !net.startsWith("http://") && !net.startsWith("https://")) {
      errors.push({
        path: "starknet.network",
        message: `Unknown network "${net}". Use one of: ${Object.keys(NETWORK_ALIASES).join(", ")}, or a full RPC URL (e.g., "http://127.0.0.1:5050").`,
      });
    }
  }

  // Validate scarbPath if provided
  if (config.scarbPath !== undefined && typeof config.scarbPath !== "string") {
    errors.push({
      path: "starknet.scarbPath",
      message: `Expected a string path to the scarb binary, got "${typeof config.scarbPath}".`,
    });
  }

  // Validate profile
  if (config.profile !== undefined) {
    const validProfiles = ["release", "debug", "dev"];
    if (!validProfiles.includes(config.profile)) {
      errors.push({
        path: "starknet.profile",
        message: `Unknown profile "${config.profile}". Valid profiles: ${validProfiles.join(", ")}.`,
      });
    }
  }

  // Validate wallet
  if (config.wallet !== undefined) {
    const wallet = config.wallet;

    if (typeof wallet !== "object" || wallet === null || Array.isArray(wallet)) {
      errors.push({
        path: "starknet.wallet",
        message: "Expected wallet to be an object with accountAddress and/or privateKey.",
      });
    } else {
      if (wallet.accountAddress !== undefined && typeof wallet.accountAddress !== "string") {
        errors.push({
          path: "starknet.wallet.accountAddress",
          message: `Expected a string (hex address), got "${typeof wallet.accountAddress}".`,
        });
      }

      if (wallet.privateKey !== undefined && typeof wallet.privateKey !== "string") {
        errors.push({
          path: "starknet.wallet.privateKey",
          message: `Expected a string (hex private key), got "${typeof wallet.privateKey}".`,
        });
      }
    }
  }

  // Validate packageName
  if (config.packageName !== undefined && typeof config.packageName !== "string") {
    errors.push({
      path: "starknet.packageName",
      message: `Expected a string (package name from Scarb.toml), got "${typeof config.packageName}".`,
    });
  }

  return errors;
}
