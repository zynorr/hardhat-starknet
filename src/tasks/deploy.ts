import { task, types } from "hardhat/config";

/**
 * `starknet:declare` — Declare a compiled contract.
 */
task("starknet:declare", "Declare a Cairo contract class on Starknet")
  .addParam("sierra", "Path to the Sierra contract class JSON", undefined, types.string)
  .addParam("casm", "Path to the CASM compiled contract class JSON", undefined, types.string)
  .setAction(async ({ sierra, casm }, hre) => {
    console.log(`📜 Declaring contract...`);
    const classHash = await hre.starknet.declare(sierra, casm);
    console.log(`✅ Contract declared with class hash: ${classHash}`);
    return classHash;
  });

/**
 * `starknet:deploy` — Deploy a declared contract.
 */
task("starknet:deploy", "Deploy a declared Cairo contract on Starknet")
  .addParam("classHash", "The class hash of the contract to deploy", undefined, types.string)
  .addOptionalParam(
    "constructorArgs",
    "Comma-separated constructor arguments (felt values as strings)",
    "",
    types.string,
  )
  .setAction(async ({ classHash, constructorArgs }, hre) => {
    const calldata = constructorArgs ? constructorArgs.split(",").map((s: string) => s.trim()) : [];
    console.log(`🚀 Deploying contract (class hash: ${classHash})...`);
    const address = await hre.starknet.deploy(classHash, calldata);
    console.log(`✅ Contract deployed at: ${address}`);
    return address;
  });
