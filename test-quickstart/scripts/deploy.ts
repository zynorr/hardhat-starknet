import "hardhat";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

declare var hre: HardhatRuntimeEnvironment;

async function main() {
  // 1. Compile
  console.log("🔨 Compiling...");
  const result = await hre.starknet.compile();
  if (!result.success) {
    console.error("Compilation failed:", result.output);
    process.exit(1);
  }
  console.log("✅ Compiled");

  // 2. Find artifact
  const artifacts = await hre.starknet.findArtifacts("HelloStarknet");
  if (!artifacts) {
    console.error("Artifact not found. Did you set sierra = true and casm = true in Scarb.toml?");
    process.exit(1);
  }
  console.log(`📁 Sierra: ${artifacts.sierra.split("/").pop()}`);
  console.log(`📁 CASM: ${artifacts.casm.split("/").pop()}`);

  // 3. Deploy with greeting
  const greeting = "0x48656c6c6f20537461726b6e6574"; // "Hello Starknet" as felt
  const { classHash, contractAddress } = await hre.starknet.declareAndDeploy(
    artifacts.sierra,
    artifacts.casm,
    [greeting],
  );
  console.log(`📜 Class hash: ${classHash}`);
  console.log(`🏗️  Contract:   ${contractAddress}`);

  // 4. Call
  const [greetingResult] = await hre.starknet.call(contractAddress, "get_greeting");
  console.log(`👋 Greeting: ${greetingResult}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  });
