/// <reference types="mocha" />

import { expect } from "chai";
import { validateStarknetConfig } from "../src/config/validate";
import { resolveConfig, resolveNetworkUrl, NETWORK_ALIASES } from "../src/config/resolve";
import type { StarknetConfig } from "../src/config/schema";

describe("Config Validation (unit)", function () {
  it("should accept an empty config with defaults", function () {
    const errors = validateStarknetConfig({});
    expect(errors).to.be.empty;
  });

  it("should accept a full valid config", function () {
    const config: Partial<StarknetConfig> = {
      network: "devnet",
      scarbPath: "scarb",
      profile: "release",
      packageName: "my_package",
      artifactDir: "target/dev",
      wallet: {
        accountAddress: "0x123",
        privateKey: "0xabc",
      },
    };
    const errors = validateStarknetConfig(config);
    expect(errors).to.be.empty;
  });

  it("should accept custom RPC URL as network", function () {
    const errors = validateStarknetConfig({ network: "http://localhost:5050" });
    expect(errors).to.be.empty;
  });

  it("should accept sepolia network alias", function () {
    const errors = validateStarknetConfig({ network: "sepolia" });
    expect(errors).to.be.empty;
  });

  it("should reject unknown network alias", function () {
    const errors = validateStarknetConfig({ network: "testnet" });
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].path).to.equal("starknet.network");
  });

  it("should reject invalid scarbPath type", function () {
    const errors = validateStarknetConfig({ scarbPath: 123 as any });
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].path).to.equal("starknet.scarbPath");
  });

  it("should reject invalid profile", function () {
    const errors = validateStarknetConfig({ profile: "production" });
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].path).to.equal("starknet.profile");
  });

  it("should accept debug profile", function () {
    const errors = validateStarknetConfig({ profile: "debug" });
    expect(errors).to.be.empty;
  });

  it("should reject non-object wallet", function () {
    const errors = validateStarknetConfig({ wallet: "invalid" as any });
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].path).to.equal("starknet.wallet");
  });

  it("should reject invalid wallet.accountAddress", function () {
    const errors = validateStarknetConfig({ wallet: { accountAddress: 123 as any } });
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].path).to.equal("starknet.wallet.accountAddress");
  });

  it("should reject invalid wallet.privateKey", function () {
    const errors = validateStarknetConfig({ wallet: { privateKey: 456 as any } });
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].path).to.equal("starknet.wallet.privateKey");
  });

  it("should reject invalid packageName type", function () {
    const errors = validateStarknetConfig({ packageName: 123 as any });
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].path).to.equal("starknet.packageName");
  });

  it("should accept undefined config (missing starknet section)", function () {
    const errors = validateStarknetConfig(undefined);
    expect(errors).to.have.lengthOf(1);
    expect(errors[0].path).to.equal("starknet");
  });
});

describe("Config Resolution (unit)", function () {
  it("should return defaults for empty config", function () {
    const resolved = resolveConfig({});
    expect(resolved.network).to.equal("devnet");
    expect(resolved.scarbPath).to.equal("scarb");
    expect(resolved.profile).to.equal("release");
    expect(resolved.artifactDir).to.equal("target/dev");
  });

  it("should merge user values with defaults", function () {
    const resolved = resolveConfig({ network: "sepolia", profile: "debug" });
    expect(resolved.network).to.equal("sepolia");
    expect(resolved.profile).to.equal("debug");
    expect(resolved.scarbPath).to.equal("scarb");
    expect(resolved.artifactDir).to.equal("target/dev");
  });

  it("should resolve wallet from env vars when not provided", function () {
    const origAccount = process.env.STARKNET_ACCOUNT;
    const origKey = process.env.STARKNET_PRIVATE_KEY;

    process.env.STARKNET_ACCOUNT = "0xenv_account";
    process.env.STARKNET_PRIVATE_KEY = "0xenv_key";

    try {
      const resolved = resolveConfig({});
      expect(resolved.wallet?.accountAddress).to.equal("0xenv_account");
      expect(resolved.wallet?.privateKey).to.equal("0xenv_key");
    } finally {
      process.env.STARKNET_ACCOUNT = origAccount;
      process.env.STARKNET_PRIVATE_KEY = origKey;
    }
  });

  it("should use user wallet over env vars", function () {
    const origAccount = process.env.STARKNET_ACCOUNT;
    const origKey = process.env.STARKNET_PRIVATE_KEY;
    process.env.STARKNET_ACCOUNT = "0xenv_account";
    process.env.STARKNET_PRIVATE_KEY = "0xenv_key";

    try {
      const resolved = resolveConfig({
        wallet: { accountAddress: "0xuser", privateKey: "0xuser_key" },
      });
      expect(resolved.wallet?.accountAddress).to.equal("0xuser");
      expect(resolved.wallet?.privateKey).to.equal("0xuser_key");
    } finally {
      process.env.STARKNET_ACCOUNT = origAccount;
      process.env.STARKNET_PRIVATE_KEY = origKey;
    }
  });

  it("should preserve custom artifactDir", function () {
    const resolved = resolveConfig({ artifactDir: "custom/build" });
    expect(resolved.artifactDir).to.equal("custom/build");
  });

  it("should preserve packageName", function () {
    const resolved = resolveConfig({ packageName: "my_token" });
    expect(resolved.packageName).to.equal("my_token");
  });
});

describe("Network URL Resolution (unit)", function () {
  it("should return URL for devnet alias", function () {
    expect(resolveNetworkUrl("devnet")).to.equal("http://127.0.0.1:5050");
  });

  it("should return URL for sepolia alias", function () {
    expect(resolveNetworkUrl("sepolia")).to.equal("https://sepolia.starknet.io");
  });

  it("should return URL for mainnet alias", function () {
    expect(resolveNetworkUrl("mainnet")).to.equal("https://alpha-mainnet.starknet.io");
  });

  it("should pass through custom HTTP URL", function () {
    expect(resolveNetworkUrl("http://custom:1234")).to.equal("http://custom:1234");
  });

  it("should throw for unknown network alias", function () {
    expect(() => resolveNetworkUrl("invalid")).to.throw("Unknown Starknet network");
  });

  it("should have all network aliases resolve", function () {
    for (const alias of Object.keys(NETWORK_ALIASES)) {
      expect(() => resolveNetworkUrl(alias)).to.not.throw();
    }
  });
});
