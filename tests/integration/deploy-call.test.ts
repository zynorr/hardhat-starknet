/// <reference types="mocha" />

import { expect } from "chai";
import { execSync } from "child_process";
import { existsSync, promises as fs } from "fs";
import { join, resolve } from "path";

const EXAMPLE_DIR = resolve(process.cwd(), "examples/basic");
const PLUGIN_DIR = process.cwd();
const DEVNET_URL = "http://127.0.0.1:5050";

// Devnet account #0 (seed 0, pre-funded)
const ACCOUNT_ADDR = "0x64b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691";
const ACCOUNT_PK = "0x71d7bb07b9a64f6f78ac4c816aff4da9";

/**
 * Integration test: Full build → declare → deploy → call → invoke flow.
 *
 * Runs against a local starknet-devnet (must be listening on port 5050).
 * Handles the case where contract classes are already declared (devnet
 * state persists between runs) by catching and continuing.
 */
describe("Integration: deploy-call (full path)", function () {
  this.timeout(300_000); // 5 minutes

  let contractAddress: string;

  before(async function () {
    // Verify devnet is reachable
    try {
      const res = await fetch(`${DEVNET_URL}/`, { method: "POST" });
      if (res.status !== 405 && res.status !== 200) {
        throw new Error(`Devnet not reachable at ${DEVNET_URL}`);
      }
    } catch {
      this.skip();
      return;
    }

    // Verify scarb
    try {
      execSync("which scarb", { stdio: "ignore" });
    } catch {
      this.skip();
      return;
    }

    // Install example project dependencies (fresh clone needs this)
    if (!existsSync(join(EXAMPLE_DIR, "node_modules/hardhat-starknet"))) {
      execSync("npm install", { cwd: EXAMPLE_DIR, stdio: "pipe" });
    }

    // Build plugin
    execSync("npm run build", { cwd: PLUGIN_DIR, stdio: "pipe" });
  });

  it("1. compiles contract with scarb build", async function () {
    // Clean previous artifacts for a fresh build
    const targetDir = join(EXAMPLE_DIR, "target");
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch {
      // may not exist
    }

    execSync("scarb build", { cwd: EXAMPLE_DIR, stdio: "pipe" });

    // Verify artifacts exist
    const artifactDir = join(EXAMPLE_DIR, "target/dev");
    const files = await fs.readdir(artifactDir);
    const sierraFile = files.find(
      (f) => f.endsWith(".contract_class.json") && !f.includes("compiled"),
    );
    const casmFile = files.find((f) => f.endsWith(".compiled_contract_class.json"));

    expect(sierraFile, "Sierra artifact should exist").to.exist;
    expect(casmFile, "CASM artifact should exist").to.exist;
  });

  it("2. declares and deploys contract", async function () {
    const env = {
      ...process.env,
      STARKNET_ACCOUNT: ACCOUNT_ADDR,
      STARKNET_PRIVATE_KEY: ACCOUNT_PK,
    };

    // Find artifact paths
    const artifactDir = join(EXAMPLE_DIR, "target/dev");
    const files = await fs.readdir(artifactDir);
    const sierraFile = files.find(
      (f) => f.endsWith(".contract_class.json") && !f.includes("compiled"),
    )!;
    const casmFile = files.find((f) => f.endsWith(".compiled_contract_class.json"))!;
    const sierraPath = join(artifactDir, sierraFile);
    const casmPath = join(artifactDir, casmFile);

    // Declare — might fail if already declared (devnet persisted state)
    let classHash: string;
    const declareCmd = `npx hardhat starknet:declare --sierra "${sierraPath}" --casm "${casmPath}"`;
    try {
      const declareOut = execSync(declareCmd, {
        cwd: EXAMPLE_DIR,
        env,
        stdio: "pipe",
      });
      const declareOutput = declareOut.toString();
      const match = declareOutput.match(/class hash:\s*(0x[a-fA-F0-9]+)/);
      expect(match, "Should find class hash").to.exist;
      classHash = match![1];
    } catch (e: any) {
      const stderr = e.stderr?.toString() || e.stdout?.toString() || "";
      const hashMatch = stderr.match(/0x[a-fA-F0-9]{64}/);
      if (stderr.includes("already declared") && hashMatch) {
        classHash = hashMatch[0];
        console.log(`  ℹ️  Class already declared, using hash: ${classHash}`);
      } else {
        throw new Error(`Declare failed: ${stderr}`);
      }
    }

    // Deploy with a unique constructor argument to get a fresh contract
    // "Hello Test" encoded as felt (hex encoding of the ASCII bytes)
    const greeting = "0x48656c6c6f2054657374"; // "Hello Test"
    const deployCmd = `npx hardhat starknet:deploy --class-hash ${classHash} --constructor-args ${greeting}`;
    const deployOut = execSync(deployCmd, {
      cwd: EXAMPLE_DIR,
      env,
      stdio: "pipe",
    });
    const deployOutput = deployOut.toString();
    const addressMatch = deployOutput.match(/deployed at:\s*(0x[a-fA-F0-9]+)/);
    expect(addressMatch, "Should find contract address in output").to.exist;
    contractAddress = addressMatch![1];

    console.log(`  ℹ️  Contract deployed at: ${contractAddress}`);
  });

  it("3. calls contract read function and invokes state change", async function () {
    expect(contractAddress, "Contract address must exist").to.exist;
    const env = {
      ...process.env,
      STARKNET_ACCOUNT: ACCOUNT_ADDR,
      STARKNET_PRIVATE_KEY: ACCOUNT_PK,
    };

    // Call get_greeting
    const callOut = execSync(
      `npx hardhat starknet:call --contract ${contractAddress} --function get_greeting`,
      { cwd: EXAMPLE_DIR, env, stdio: "pipe" },
    );
    const callOutput = callOut.toString();
    expect(callOutput, "Should contain greeting 'Hello Test'").to.include("0x48656c6c6f2054657374");

    // Invoke set_greeting
    const newGreeting = "0x48656c6c6f2048617264686174"; // "Hello Hardhat"
    const invokeOut = execSync(
      `npx hardhat starknet:invoke --contract ${contractAddress} --function set_greeting --calldata ${newGreeting}`,
      { cwd: EXAMPLE_DIR, env, stdio: "pipe" },
    );
    const invokeOutput = invokeOut.toString();
    expect(invokeOutput).to.match(/0x[a-fA-F0-9]{10,}/);

    // Wait briefly for state to propagate
    await new Promise((r) => setTimeout(r, 2000));

    // Call get_greeting again — should be updated
    const callOut2 = execSync(
      `npx hardhat starknet:call --contract ${contractAddress} --function get_greeting`,
      { cwd: EXAMPLE_DIR, env, stdio: "pipe" },
    );
    const callOutput2 = callOut2.toString();
    expect(callOutput2, "Should contain updated greeting").to.include(newGreeting);
  });

  it("4. reads balance", async function () {
    expect(contractAddress, "Contract address must exist").to.exist;
    const env = {
      ...process.env,
      STARKNET_ACCOUNT: ACCOUNT_ADDR,
      STARKNET_PRIVATE_KEY: ACCOUNT_PK,
    };

    const callOut = execSync(
      `npx hardhat starknet:call --contract ${contractAddress} --function get_balance`,
      { cwd: EXAMPLE_DIR, env, stdio: "pipe" },
    );
    const callOutput = callOut.toString();
    expect(callOutput, "Should contain initial balance of 0").to.include("0x0");
  });
});
