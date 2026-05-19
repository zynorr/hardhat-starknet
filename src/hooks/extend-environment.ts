import { extendEnvironment } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { createStarknetPlugin } from "../plugin";

/**
 * Registers the `hre.starknet` runtime environment extension.
 */
export function registerEnvironmentExtension(): void {
  extendEnvironment((hre) => {
    hre.starknet = lazyObject(() => {
      return createStarknetPlugin(hre.config.starknet);
    });
  });
}
