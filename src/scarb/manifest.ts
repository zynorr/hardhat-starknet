import { promises as fs } from "fs";
import { join } from "path";

/**
 * Parsed representation of a Cairo/Starknet project's Scarb.toml manifest.
 */
export interface ScarbManifest {
  /** Package name (e.g., "sample_token") */
  name: string;
  /** Package version (e.g., "0.1.0") */
  version: string;
  /** Cairo edition (e.g., "2024_07") */
  edition: string;
  /** Dependencies: map of name → version requirement */
  dependencies: Record<string, string>;
  /** Target contracts: empty strings mean no specific name */
  starknetContracts: string[];
  /** Whether Sierra output is enabled */
  sierra: boolean;
  /** Whether CASM output is enabled */
  casm: boolean;
  /** Path to the Scarb.toml file that was parsed */
  sourcePath: string;
}

/**
 * Parses a Scarb.toml file into a structured manifest.
 *
 * @param projectRoot - Directory containing Scarb.toml
 * @returns Parsed manifest, or null if file is missing/invalid
 *
 * @example
 * const manifest = await parseScarbManifest("/path/to/project");
 * console.log(manifest.name);        // "sample_token"
 * console.log(manifest.dependencies); // { starknet: ">=2.18.0", openzeppelin: "1.0.0" }
 */
export async function parseScarbManifest(
  projectRoot?: string,
): Promise<ScarbManifest | null> {
  const cwd = projectRoot || process.cwd();
  const scarbPath = join(cwd, "Scarb.toml");

  try {
    const raw = await fs.readFile(scarbPath, "utf-8");
    return parseScarbToml(raw, scarbPath);
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw new Error(
      `Failed to read Scarb.toml at ${scarbPath}: ${error.message}`,
    );
  }
}

/**
 * Parse raw TOML content into a ScarbManifest.
 * Uses a lightweight hand-written parser — no external TOML library needed.
 */
export function parseScarbToml(raw: string, sourcePath?: string): ScarbManifest {
  const lines = raw.split("\n");

  const manifest: Partial<ScarbManifest> & { [section: string]: any } = {
    name: "",
    version: "",
    edition: "",
    dependencies: {},
    starknetContracts: [],
    sierra: true,
    casm: true,
    sourcePath: sourcePath || "",
  };

  let currentSection: string | null = null;
  let inDependencies = false;
  let inTargets = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "" || line.startsWith("#")) continue;

    // Section headers: [package], [dependencies], [[target.starknet-contract]]
    const sectionMatch = line.match(/^\[{1,2}([^\]]+)\]{1,2}$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      inDependencies = currentSection === "dependencies";
      inTargets = currentSection === "target.starknet-contract";
      continue;
    }

    if (currentSection === "package") {
      const kv = parseKeyValue(line);
      if (kv) {
        if (kv.key === "name") manifest.name = kv.value;
        else if (kv.key === "version") manifest.version = kv.value;
        else if (kv.key === "edition") manifest.edition = kv.value;
      }
    } else if (inDependencies) {
      const kv = parseKeyValue(line);
      if (kv) {
        manifest.dependencies = manifest.dependencies || {};
        manifest.dependencies[kv.key] = kv.value;
      }
    } else if (inTargets) {
      if (line.startsWith("sierra")) {
        manifest.sierra = parseBoolValue(line);
      } else if (line.startsWith("casm")) {
        manifest.casm = parseBoolValue(line);
      } else if (line.startsWith("name")) {
        const kv = parseKeyValue(line);
        if (kv) manifest.starknetContracts!.push(kv.value);
      }
    }
  }

  return {
    name: manifest.name || "unknown",
    version: manifest.version || "0.1.0",
    edition: manifest.edition || "",
    dependencies: manifest.dependencies || {},
    starknetContracts: manifest.starknetContracts || [],
    sierra: manifest.sierra !== undefined ? manifest.sierra : true,
    casm: manifest.casm !== undefined ? manifest.casm : true,
    sourcePath: sourcePath || "",
  };
}

function parseKeyValue(line: string): { key: string; value: string } | null {
  const stripped = line.replace(
    /(?:".*?"|'.*?')|(#.*)/g,
    (match, comment) => (comment ? "" : match),
  );

  const eqIndex = stripped.indexOf("=");
  if (eqIndex === -1) return null;

  const key = stripped.slice(0, eqIndex).trim();
  const rawValue = stripped.slice(eqIndex + 1).trim();

  if (!key || rawValue === "") return null;

  let value = rawValue;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return { key, value };
}

function parseBoolValue(line: string): boolean {
  const kv = parseKeyValue(line);
  if (!kv) return false;
  return kv.value.toLowerCase() === "true";
}
