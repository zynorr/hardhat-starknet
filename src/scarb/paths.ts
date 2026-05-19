import { join } from "path";
import type { ResolvedStarknetConfig } from "../config/schema";

/**
 * Resolve the artifact directory path from config and optional project root.
 */
export function getArtifactDir(
  config: { artifactDir?: string },
  projectRoot?: string,
): string {
  const cwd = projectRoot || process.cwd();
  return join(cwd, config.artifactDir || "target/dev");
}
