/// <reference types="mocha" />

import { expect } from "chai";
import { parseScarbToml } from "../src/scarb/manifest";

describe("Scarb.toml Parser (unit)", function () {
  it("should parse a minimal valid Scarb.toml", function () {
    const raw = `
[package]
name = "sample_token"
version = "0.1.0"
edition = "2024_07"

[dependencies]
starknet = ">=2.18.0"
openzeppelin = "1.0.0"

[[target.starknet-contract]]
sierra = true
casm = true
    `.trim();

    const manifest = parseScarbToml(raw);
    expect(manifest.name).to.equal("sample_token");
    expect(manifest.version).to.equal("0.1.0");
    expect(manifest.edition).to.equal("2024_07");
    expect(manifest.dependencies).to.deep.equal({
      starknet: ">=2.18.0",
      openzeppelin: "1.0.0",
    });
    expect(manifest.sierra).to.be.true;
    expect(manifest.casm).to.be.true;
  });

  it("should parse Scarb.toml without targets section", function () {
    const raw = `
[package]
name = "simple"
version = "1.0.0"
edition = "2024_07"

[dependencies]
starknet = ">=2.19.0"
    `.trim();

    const manifest = parseScarbToml(raw);
    expect(manifest.name).to.equal("simple");
    expect(manifest.version).to.equal("1.0.0");
    expect(manifest.sierra).to.be.true;
    expect(manifest.casm).to.be.true;
    expect(manifest.starknetContracts).to.deep.equal([]);
  });

  it("should handle empty string input", function () {
    const manifest = parseScarbToml("");
    expect(manifest.name).to.equal("unknown");
    expect(manifest.version).to.equal("0.1.0");
    expect(manifest.dependencies).to.deep.equal({});
  });

  it("should handle Scarb.toml with comments", function () {
    const raw = `
# This is a comment
[package]
name = "my_token"  # inline comment
version = "0.2.0"
edition = "2024_07"

# Dependencies section
[dependencies]
starknet = ">=2.20.0"
    `.trim();

    const manifest = parseScarbToml(raw);
    expect(manifest.name).to.equal("my_token");
    expect(manifest.version).to.equal("0.2.0");
  });

  it("should parse Scarb.toml with CASM disabled", function () {
    const raw = `
[package]
name = "cairo_only"
version = "0.1.0"

[[target.starknet-contract]]
sierra = true
casm = false
    `.trim();

    const manifest = parseScarbToml(raw);
    expect(manifest.sierra).to.be.true;
    expect(manifest.casm).to.be.false;
  });

  it("should parse Scarb.toml with specific contract names", function () {
    const raw = `
[package]
name = "multi_contract"
version = "0.1.0"

[[target.starknet-contract]]
name = "Token"
sierra = true
casm = true
    `.trim();

    const manifest = parseScarbToml(raw);
    expect(manifest.name).to.equal("multi_contract");
    expect(manifest.starknetContracts).to.include("Token");
  });

  it("should handle quoted values with special characters", function () {
    const raw = `
[package]
name = "my-package_v2"
version = "0.1.0-alpha.1"
edition = "2024_07"
    `.trim();

    const manifest = parseScarbToml(raw);
    expect(manifest.name).to.equal("my-package_v2");
    expect(manifest.version).to.equal("0.1.0-alpha.1");
  });

  it("should parse dependencies with operators", function () {
    const raw = `
[package]
name = "test"
version = "0.1.0"

[dependencies]
starknet = ">=2.18.0, <2.20.0"
openzeppelin = "^1.0.0"
    `.trim();

    const manifest = parseScarbToml(raw);
    expect(manifest.dependencies.starknet).to.equal(">=2.18.0, <2.20.0");
    expect(manifest.dependencies.openzeppelin).to.equal("^1.0.0");
  });
});
