import { task, types } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";

const PLUGIN_NAME = "hardhat-starknet";

/**
 * `compile:starknet` — Compile Cairo contracts using Scarb.
 */
task("compile:starknet", "Compile Cairo contracts with Scarb").setAction(
  async (_, hre) => {
    console.log("🔨 Compiling Cairo contracts...");
    const result = await hre.starknet.compile();
    if (result.success) {
      console.log("✅ Cairo contracts compiled successfully");
      if (result.output) {
        console.log(result.output);
      }
    } else {
      throw new HardhatPluginError(
        PLUGIN_NAME,
        `Compilation failed:\n${result.output}`,
      );
    }
  },
);

/**
 * `starknet:build` — Alias for compile:starknet.
 */
task(
  "starknet:build",
  "Build Cairo contracts with Scarb (alias for compile:starknet)",
).setAction(async (_, hre) => {
  await hre.run("compile:starknet");
});
