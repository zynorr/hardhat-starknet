/**
 * Split a decimal amount string into u256 [low, high] felt strings.
 * Useful for ERC20 transfer and similar operations on Starknet.
 *
 * @param amount - Decimal string representation of a value
 * @returns [low, high] felt strings for u256 representation
 *
 * @example
 * u256Split("1000000000000000000")
 * // => ["1000000000000000000", "0"]
 */
export function u256Split(amount: string): [string, string] {
  const value = BigInt(amount);
  const mask = (BigInt(1) << BigInt(128)) - BigInt(1);
  return [(value & mask).toString(), (value >> BigInt(128)).toString()];
}

/**
 * Format wei as a human-readable ETH string.
 *
 * @param wei - Decimal string of wei amount
 * @returns Formatted ETH string (e.g., "1.0000" or "1.23e-5")
 *
 * @example
 * formatEther("1000000000000000000")  // => "1.0000"
 * formatEther("12300000000000")        // => "0.000012" -> exponential
 */
export function formatEther(wei: string): string {
  const value = BigInt(wei);
  const eth = Number(value) / 1e18;
  return eth >= 1 ? eth.toFixed(4) : eth.toExponential(2);
}
