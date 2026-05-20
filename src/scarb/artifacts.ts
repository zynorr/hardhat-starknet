import { promises as fs } from "fs";
import { join } from "path";
import { parseScarbManifest } from "./manifest";
import { getArtifactDir } from "./paths";
import type { ResolvedStarknetConfig } from "../config/schema";

/**
 * Lazily resolve the package name — uses explicit config or auto-detects from Scarb.toml.
 */
export async function resolvePackageName(
  config: { packageName?: string },
  projectRoot?: string,
): Promise<string> {
  if (config.packageName) {
    return config.packageName;
  }
  const manifest = await parseScarbManifest(projectRoot);
  return manifest?.name || "";
}

/**
 * Find compiled contract artifacts from `scarb build` output.
 * Searches the configured artifact directory.
 *
 * @param contractName - The contract name (e.g., "Token")
 * @param config - Plugin config (for artifactDir and packageName)
 * @param projectRoot - Optional project root directory
 * @returns Object with sierra and casm paths, or null if not found
 */
export async function findCompiledArtifact(
  contractName: string,
  config: { artifactDir?: string; packageName?: string },
  projectRoot?: string,
): Promise<{ sierra: string; casm: string } | null> {
  const targetDir = getArtifactDir(config, projectRoot);
  const packageName = await resolvePackageName(config, projectRoot);

  try {
    const files = await fs.readdir(targetDir);

    const escapedName = contractName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let sierraPattern: RegExp;
    let casmPattern: RegExp;

    if (packageName) {
      const escapedPkg = packageName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      sierraPattern = new RegExp(`(?:${escapedPkg}_)?${escapedName}\\.contract_class\\.json$`);
      casmPattern = new RegExp(
        `(?:${escapedPkg}_)?${escapedName}\\.compiled_contract_class\\.json$`,
      );
    } else {
      sierraPattern = new RegExp(`${escapedName}\\.contract_class\\.json$`);
      casmPattern = new RegExp(`${escapedName}\\.compiled_contract_class\\.json$`);
    }

    const sierraMatch = files.find((f) => sierraPattern.test(f));
    const casmMatch = files.find((f) => casmPattern.test(f));

    if (sierraMatch && casmMatch) {
      return {
        sierra: join(targetDir, sierraMatch),
        casm: join(targetDir, casmMatch),
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * List all compiled contract names from the artifact directory.
 * Scans for *.contract_class.json files and extracts contract names
 * by stripping the package prefix (e.g., "sample_token_Token" => "Token").
 */
export async function listCompiledContracts(
  config: { artifactDir?: string; packageName?: string },
  projectRoot?: string,
): Promise<string[]> {
  const targetDir = getArtifactDir(config, projectRoot);
  const packageName = await resolvePackageName(config, projectRoot);

  try {
    const files = await fs.readdir(targetDir);
    const contractNames = new Set<string>();

    for (const file of files) {
      const match = file.match(/^(.+?)\.contract_class\.json$/);
      if (match && !file.includes("compiled_contract_class")) {
        let baseName = match[1];

        if (packageName && baseName.startsWith(packageName + "_")) {
          baseName = baseName.slice(packageName.length + 1);
        }

        contractNames.add(baseName);
      }
    }

    return Array.from(contractNames).sort();
  } catch {
    return [];
  }
}
