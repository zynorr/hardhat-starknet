import { StarknetClient } from "./starknet/client";
import { runScarbBuild } from "./scarb/build";
import { findCompiledArtifact, listCompiledContracts } from "./scarb/artifacts";
import { parseScarbManifest } from "./scarb/manifest";
import { validateStarknetConfig } from "./config/validate";
import type { StarknetPlugin } from "./types";
import { resolveConfig } from "./config/resolve";
import type { StarknetConfig, ConfigValidationError } from "./config/schema";
import type { ScarbManifest } from "./scarb/manifest";

/**
 * Creates the StarknetPlugin object — the top-level orchestrator that
 * connects the Hardhat layer, Starknet integration layer, and Scarb adapter layer.
 *
 * - Hardhat layer: task definitions, config validation, runtime hooks
 * - Scarb adapter layer: compilation, artifact discovery, manifest parsing
 * - Starknet integration layer: RPC client, deploy, call, invoke, account mgmt
 */
export function createStarknetPlugin(config: StarknetConfig): StarknetPlugin {
  // Resolve defaults before constructing the client
  const resolved = resolveConfig(config);
  const client = new StarknetClient(resolved);

  return {
    // --- Compilation (Scarb layer) ---
    async compile() {
      return runScarbBuild(resolved.scarbPath);
    },

    // --- Artifact discovery (Scarb layer) ---
    async findArtifacts(contractName: string) {
      return findCompiledArtifact(contractName, config);
    },

    async listContracts() {
      return listCompiledContracts(config);
    },

    // --- Manifest parsing (Scarb layer) ---
    async parseManifest(projectRoot?: string): Promise<ScarbManifest | null> {
      return parseScarbManifest(projectRoot);
    },

    // --- Config validation (Config layer) ---
    validateConfig(): ConfigValidationError[] {
      return validateStarknetConfig(config);
    },

    // --- Declare & Deploy (Starknet layer) ---
    async declare(sierraArtifactPath: string, casmArtifactPath: string) {
      return client.declare(sierraArtifactPath, casmArtifactPath);
    },

    async deploy(classHash: string, constructorCalldata?: string[]) {
      return client.deploy(classHash, constructorCalldata || []);
    },

    async declareAndDeploy(
      sierraArtifactPath: string,
      casmArtifactPath: string,
      constructorCalldata?: string[],
    ) {
      return client.declareAndDeploy(
        sierraArtifactPath,
        casmArtifactPath,
        constructorCalldata || [],
      );
    },

    // --- Contract interaction (Starknet layer) ---
    async call(
      contractAddress: string,
      functionName: string,
      calldata?: string[],
    ) {
      return client.call(contractAddress, functionName, calldata || []);
    },

    async invoke(
      contractAddress: string,
      functionName: string,
      calldata?: string[],
    ) {
      return client.invoke(contractAddress, functionName, calldata || []);
    },

    // --- Events (Starknet layer) ---
    async getEvents(txHash: string) {
      return client.getEvents(txHash);
    },

    // --- Account management (Starknet layer) ---
    async createAccount(fundingAmountWei?: string) {
      return client.createAccount(fundingAmountWei);
    },

    getAccountAddress() {
      return client.getAccountAddress();
    },

    getProviderUrl() {
      return client.getProviderUrl();
    },
  };
}
