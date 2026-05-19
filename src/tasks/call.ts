import { task, types } from "hardhat/config";

/**
 * `starknet:call` — Call a read-only function.
 */
task(
  "starknet:call",
  "Call a read-only function on a Starknet contract",
)
  .addParam("contract", "The contract address", undefined, types.string)
  .addParam("function", "The function name to call", undefined, types.string)
  .addOptionalParam("calldata", "Comma-separated calldata values", "", types.string)
  .setAction(async ({ contract: contractAddress, function: fnName, calldata }, hre) => {
    const args = calldata
      ? calldata.split(",").map((s: string) => s.trim())
      : [];
    const result = await hre.starknet.call(contractAddress, fnName, args);
    console.log(`📞 ${fnName}() → [${result.join(", ")}]`);
    return result;
  });

/**
 * `starknet:invoke` — Execute a state-changing function.
 */
task(
  "starknet:invoke",
  "Execute a state-changing function on a Starknet contract",
)
  .addParam("contract", "The contract address", undefined, types.string)
  .addParam("function", "The function name to invoke", undefined, types.string)
  .addOptionalParam("calldata", "Comma-separated calldata values", "", types.string)
  .setAction(async ({ contract: contractAddress, function: fnName, calldata }, hre) => {
    const args = calldata
      ? calldata.split(",").map((s: string) => s.trim())
      : [];
    const txHash = await hre.starknet.invoke(contractAddress, fnName, args);
    console.log(`⚡ Invoked ${fnName}() — tx hash: ${txHash}`);
    return txHash;
  });
