import { execSync } from "child_process";

/**
 * Run `scarb build` in the given directory.
 *
 * @param scarbPath - Path to the scarb binary (default: "scarb")
 * @param cwd - Working directory to run the build in
 * @returns Result with success flag and output text
 */
export function runScarbBuild(
  scarbPath: string = "scarb",
  cwd?: string,
): { success: boolean; output: string } {
  const workingDir = cwd || process.cwd();

  try {
    const output = execSync(`${scarbPath} build`, {
      cwd: workingDir,
      encoding: "utf-8" as const,
      stdio: ["pipe", "pipe", "pipe"] as const,
    });
    return { success: true, output: output.trim() };
  } catch (error: any) {
    const message = error.stderr || error.stdout || String(error);
    return { success: false, output: message.trim() };
  }
}
