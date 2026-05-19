/// <reference types="mocha" />

import { expect } from "chai";
import { validateStarknetConfig } from "../src/config/validate";
import { resolveConfig } from "../src/config/resolve";
import { parseScarbToml } from "../src/scarb/manifest";

describe("Negative Tests (unit)", function () {
  describe("Config validation failures", function () {
    it("should fail when network is an empty string", function () {
      const errors = validateStarknetConfig({ network: "" });
      expect(errors).to.have.lengthOf(1);
      expect(errors[0].path).to.equal("starknet.network");
    });

    it("should fail when network is a random string", function () {
      const errors = validateStarknetConfig({ network: "my-local-starknet-node" });
      expect(errors).to.have.lengthOf(1);
      expect(errors[0].path).to.equal("starknet.network");
    });

    it("should fail with invalid scarbPath type (boolean)", function () {
      const errors = validateStarknetConfig({ scarbPath: true as any });
      expect(errors).to.have.lengthOf(1);
    });

    it("should fail with invalid profile (empty string)", function () {
      const errors = validateStarknetConfig({ profile: "" });
      expect(errors).to.have.lengthOf(1);
      expect(errors[0].path).to.equal("starknet.profile");
    });

    it("should fail with numeric wallet", function () {
      const errors = validateStarknetConfig({ wallet: 42 as any });
      expect(errors).to.have.lengthOf(1);
    });

    it("should fail with array wallet", function () {
      const errors = validateStarknetConfig({ wallet: [] as any });
      expect(errors).to.have.lengthOf(1);
    });

    it("should fail with null wallet accountAddress", function () {
      const errors = validateStarknetConfig({ wallet: { accountAddress: null as any } });
      expect(errors).to.have.lengthOf(1);
    });

    it("should collect multiple errors at once", function () {
      const errors = validateStarknetConfig({
        network: "nonexistent-chain",
        profile: "custom",
        scarbPath: 999 as any,
      });
      expect(errors.length).to.be.greaterThanOrEqual(2);
    });
  });

  describe("Config resolution edge cases", function () {
    it("should handle undefined user config gracefully", function () {
      const resolved = resolveConfig();
      expect(resolved.network).to.equal("devnet");
      expect(resolved.scarbPath).to.equal("scarb");
    });

    it("should handle null wallet gracefully", function () {
      const resolved = resolveConfig({ wallet: null as any });
      expect(resolved.wallet).to.be.ok;
    });

    it("should handle partial wallet (only accountAddress)", function () {
      const resolved = resolveConfig({ wallet: { accountAddress: "0xabc" } });
      expect(resolved.wallet?.accountAddress).to.equal("0xabc");
      expect(resolved.wallet?.privateKey).to.be.undefined;
    });
  });

  describe("Scarb.toml parsing edge cases", function () {
    it("should handle completely malformed input gracefully", function () {
      const manifest = parseScarbToml("this is not toml at all !!! @@@");
      expect(manifest.name).to.equal("unknown");
    });

    it("should handle input with only comments", function () {
      const manifest = parseScarbToml("# just a comment\n# another comment");
      expect(manifest.name).to.equal("unknown");
    });

    it("should handle input with only empty lines", function () {
      const manifest = parseScarbToml("\n\n\n  \n\t\n");
      expect(manifest.name).to.equal("unknown");
    });

    it("should handle section headers without values", function () {
      const manifest = parseScarbToml("[package]\n[dependencies]");
      expect(manifest.name).to.equal("unknown");
      expect(manifest.dependencies).to.deep.equal({});
    });

    it("should handle unclosed quoted strings gracefully", function () {
      const manifest = parseScarbToml('[package]\nname = "unclosed\nversion = "0.1.0"');
      expect(manifest.version).to.equal("0.1.0");
    });

    it("should handle very long content without crashing", function () {
      const longLine = "a".repeat(10000);
      const manifest = parseScarbToml(`[package]\nname = "${longLine}"`);
      expect(manifest.name).to.equal(longLine);
    });
  });
});
