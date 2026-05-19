/// <reference types="mocha" />

import { expect } from "chai";

// These tests verify the artifact filename pattern matching logic
// from src/scarb/artifacts.ts, without needing file system access.

describe("Artifact Discovery (unit)", function () {
  function findSierraMatch(files: string[], contractName: string): string | undefined {
    return files.find((f) => {
      const escapedName = contractName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(?:\\w+_)?${escapedName}\\.contract_class\\.json$`);
      return pattern.test(f);
    });
  }

  function findCasmMatch(files: string[], contractName: string): string | undefined {
    return files.find((f) => {
      const escapedName = contractName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(?:\\w+_)?${escapedName}\\.compiled_contract_class\\.json$`);
      return pattern.test(f);
    });
  }

  it("should find Sierra artifact for exact contract name", function () {
    const files = [
      "sample_token_Token.contract_class.json",
      "sample_token_Token.compiled_contract_class.json",
    ];
    expect(findSierraMatch(files, "Token")).to.equal("sample_token_Token.contract_class.json");
    expect(findCasmMatch(files, "Token")).to.equal("sample_token_Token.compiled_contract_class.json");
  });

  it("should return undefined if no Sierra artifact found", function () {
    const files = [
      "sample_token_Other.contract_class.json",
      "sample_token_Token.compiled_contract_class.json",
    ];
    expect(findSierraMatch(files, "Token")).to.be.undefined;
  });

  it("should return undefined if no CASM artifact found", function () {
    const files = [
      "sample_token_Token.contract_class.json",
      "sample_token_Other.compiled_contract_class.json",
    ];
    expect(findCasmMatch(files, "Token")).to.be.undefined;
  });

  it("should not confuse Sierra with CASM files", function () {
    const files = [
      "sample_token_Token.compiled_contract_class.json",
    ];
    expect(findSierraMatch(files, "Token")).to.be.undefined;
    expect(findCasmMatch(files, "Token")).to.equal("sample_token_Token.compiled_contract_class.json");
  });

  it("should find artifacts with multi-word package names", function () {
    const files = [
      "my_package_MyContract.contract_class.json",
      "my_package_MyContract.compiled_contract_class.json",
    ];
    expect(findSierraMatch(files, "MyContract")).to.equal("my_package_MyContract.contract_class.json");
    expect(findCasmMatch(files, "MyContract")).to.equal("my_package_MyContract.compiled_contract_class.json");
  });

  it("should find artifacts when contract name contains underscores", function () {
    const files = [
      "pkg_my_contract.contract_class.json",
      "pkg_my_contract.compiled_contract_class.json",
    ];
    expect(findSierraMatch(files, "my_contract")).to.equal("pkg_my_contract.contract_class.json");
    expect(findCasmMatch(files, "my_contract")).to.equal("pkg_my_contract.compiled_contract_class.json");
  });

  it("should handle multiple contracts returning correct matches", function () {
    const files = [
      "pkg_Token.contract_class.json",
      "pkg_Token.compiled_contract_class.json",
      "pkg_Account.contract_class.json",
      "pkg_Account.compiled_contract_class.json",
    ];
    expect(findSierraMatch(files, "Token")).to.equal("pkg_Token.contract_class.json");
    expect(findCasmMatch(files, "Token")).to.equal("pkg_Token.compiled_contract_class.json");
    expect(findSierraMatch(files, "Account")).to.equal("pkg_Account.contract_class.json");
    expect(findCasmMatch(files, "Account")).to.equal("pkg_Account.compiled_contract_class.json");
  });

  it("should handle partial name match edge cases", function () {
    const files = [
      "pkg_Token.contract_class.json",
      "pkg_TokenV2.contract_class.json",
    ];
    // "Token" should match only Token.contract_class.json due to regex anchor
    const match = findSierraMatch(files, "Token");
    expect(match).to.equal("pkg_Token.contract_class.json");
    // More specific name should match its own file
    expect(findSierraMatch(files, "TokenV2")).to.equal("pkg_TokenV2.contract_class.json");
  });

  it("should handle empty file list", function () {
    expect(findSierraMatch([], "Token")).to.be.undefined;
    expect(findCasmMatch([], "Token")).to.be.undefined;
  });
});
