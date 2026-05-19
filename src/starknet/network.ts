import { resolveNetworkUrl } from "../config/resolve";

export { resolveNetworkUrl };

/**
 * Check if a URL points to a local devnet instance.
 */
export function isLocalDevnet(url: string): boolean {
  return url.includes("127.0.0.1") || url.includes("localhost");
}
