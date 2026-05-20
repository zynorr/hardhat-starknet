import { extendConfig } from "hardhat/config";
import { validateStarknetConfig } from "../config/validate";
import { resolveConfig } from "../config/resolve";
import type { ConfigValidationError } from "../config/schema";

/**
 * Registers the starknet config extension.
 * Validates user config and merges with defaults.
 */
export function registerConfigExtension(): void {
  extendConfig((config, userConfig) => {
    const userStarknet = userConfig.starknet || {};

    // Validate user config
    const errors = validateStarknetConfig(userStarknet);
    if (errors.length > 0) {
      console.warn(
        `\n⚠️  [hardhat-starknet] Config validation issues:\n` +
          errors.map((e: ConfigValidationError) => `     - ${e.path}: ${e.message}`).join("\n") +
          "\n",
      );
    }

    // Resolve with defaults
    const resolved = resolveConfig(userStarknet);

    config.starknet = {
      network: resolved.network,
      scarbPath: resolved.scarbPath,
      profile: resolved.profile,
      packageName: resolved.packageName,
      artifactDir: resolved.artifactDir,
      wallet: resolved.wallet,
    };
  });
}
