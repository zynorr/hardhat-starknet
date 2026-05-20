import { Account, RpcProvider, CallData, ec, hash, stark } from "starknet";
import { promises as fs } from "fs";
import { resolveNetworkUrl } from "./network";
import { u256Split, formatEther } from "../utils/format";
import type { ResolvedStarknetConfig } from "../config/schema";

// OZ Account contract class hash (Cairo 1) — used by starknet-devnet
const OZ_ACCOUNT_CLASS_HASH = "0x5b4b537eaa2399e3aa99c4e2e0208ebd6c71bc1467938cd52c798c601e43564";

// Standard ERC20 ETH contract address on Starknet (mainnet, sepolia, devnet)
const ETH_CONTRACT_ADDRESS = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

/**
 * StarknetClient wraps the RpcProvider and Account, providing all
 * Starknet network operations: declare, deploy, call, invoke, account creation.
 */
export class StarknetClient {
  private provider: RpcProvider;
  private account: Account | null = null;
  private config: ResolvedStarknetConfig;

  constructor(config: ResolvedStarknetConfig) {
    this.config = config;

    const rpcUrl = resolveNetworkUrl(config.network);
    this.provider = new RpcProvider({
      nodeUrl: rpcUrl,
      blockIdentifier: "latest",
    });

    if (config.wallet?.accountAddress && config.wallet?.privateKey) {
      this.account = new Account({
        provider: this.provider,
        address: config.wallet.accountAddress,
        signer: config.wallet.privateKey,
      });
    }
  }

  // --- Accessors ---

  getProviderUrl(): string {
    return resolveNetworkUrl(this.config.network);
  }

  getAccountAddress(): string {
    if (!this.account) {
      throw new Error(
        "No Starknet account configured. Set starknet.wallet.accountAddress and starknet.wallet.privateKey in hardhat.config.ts",
      );
    }
    return this.account.address;
  }

  getProvider(): RpcProvider {
    return this.provider;
  }

  getAccount(): Account | null {
    return this.account;
  }

  // --- Declare ---

  /**
   * Declare a compiled contract class on Starknet.
   */
  async declare(sierraArtifactPath: string, casmArtifactPath: string): Promise<string> {
    if (!this.account) {
      throw new Error(
        "Account required to declare contracts. Set starknet.wallet.accountAddress and starknet.wallet.privateKey.",
      );
    }

    const sierraContent = await fs.readFile(sierraArtifactPath, "utf-8");
    const casmContent = await fs.readFile(casmArtifactPath, "utf-8");

    const sierraCode = JSON.parse(sierraContent);
    const casmCode = JSON.parse(casmContent);

    const contractPayload = { contract: sierraCode, casm: casmCode };
    const declareResponse = await this.account.declare(contractPayload);

    return declareResponse.class_hash;
  }

  // --- Deploy ---

  /**
   * Deploy a contract from a previously declared class hash.
   */
  async deploy(classHash: string, constructorCalldata: string[] = []): Promise<string> {
    if (!this.account) {
      throw new Error(
        "Account required to deploy contracts. Set starknet.wallet.accountAddress and starknet.wallet.privateKey.",
      );
    }

    const deployResponse = await this.account.deployContract({
      classHash,
      constructorCalldata,
    });

    return deployResponse.contract_address;
  }

  /**
   * Declare and deploy a contract in one step.
   */
  async declareAndDeploy(
    sierraArtifactPath: string,
    casmArtifactPath: string,
    constructorCalldata: string[] = [],
  ): Promise<{ classHash: string; contractAddress: string }> {
    if (!this.account) {
      throw new Error(
        "Account required to deploy contracts. Set starknet.wallet.accountAddress and starknet.wallet.privateKey.",
      );
    }

    const sierraContent = await fs.readFile(sierraArtifactPath, "utf-8");
    const casmContent = await fs.readFile(casmArtifactPath, "utf-8");

    const sierraCode = JSON.parse(sierraContent);
    const casmCode = JSON.parse(casmContent);

    const contractPayload = { contract: sierraCode, casm: casmCode };
    const result = await this.account.declare(contractPayload);

    if (result.transaction_hash) {
      await this.provider.waitForTransaction(result.transaction_hash);
    }

    const deployResponse = await this.account.deployContract({
      classHash: result.class_hash,
      constructorCalldata,
    });

    return {
      classHash: result.class_hash,
      contractAddress: deployResponse.contract_address,
    };
  }

  // --- Call & Invoke ---

  /**
   * Call a read-only function on a Starknet contract.
   */
  async call(
    contractAddress: string,
    functionName: string,
    calldata: string[] = [],
  ): Promise<string[]> {
    const result = await this.provider.callContract({
      contractAddress,
      entrypoint: functionName,
      calldata: CallData.compile(calldata),
    });
    return result.map(String);
  }

  /**
   * Execute a state-changing function on a Starknet contract.
   */
  async invoke(
    contractAddress: string,
    functionName: string,
    calldata: string[] = [],
  ): Promise<string> {
    if (!this.account) {
      throw new Error(
        "Account required to invoke contracts. Set starknet.wallet.accountAddress and starknet.wallet.privateKey.",
      );
    }

    const result = await this.account.execute({
      contractAddress,
      entrypoint: functionName,
      calldata,
    });

    return result.transaction_hash;
  }

  // --- Events ---

  /**
   * Wait for a transaction and return its emitted events.
   */
  async getEvents(txHash: string): Promise<any[]> {
    await this.provider.waitForTransaction(txHash);
    const receipt: any = await this.provider.getTransactionReceipt(txHash);
    return receipt.events || [];
  }

  // --- Account Management ---

  /**
   * Create and deploy a new Starknet account on devnet.
   */
  async createAccount(fundingAmountWei: string = "1000000000000000000"): Promise<{
    address: string;
    privateKey: string;
    publicKey: string;
  }> {
    if (!this.account) {
      throw new Error(
        "A funded account is required to create new accounts. " +
          "Set starknet.wallet.accountAddress and starknet.wallet.privateKey " +
          "in hardhat.config.ts (use one of the devnet's pre-funded accounts).",
      );
    }

    const rpcUrl = resolveNetworkUrl(this.config.network);
    if (!rpcUrl.includes("127.0.0.1") && !rpcUrl.includes("localhost")) {
      console.warn("⚠️  Creating accounts on non-devnet networks may require real ETH for fees.");
    }

    console.log("🔑 Generating new key pair...");

    const privateKey = stark.randomAddress();
    const publicKey = ec.starkCurve.getStarkKey(privateKey);

    const deployerAddress = this.account.address;
    const compiledCalldata = CallData.compile([publicKey]);
    const address = hash.calculateContractAddressFromHash(
      "0",
      OZ_ACCOUNT_CLASS_HASH,
      compiledCalldata,
      deployerAddress,
    );

    console.log(`📬 New account address:  ${address}`);
    console.log(`🔐 Public key (stark):   ${publicKey}`);
    console.log(`🔑 Private key:          ${privateKey}`);

    console.log("🚀 Deploying account contract...");
    const deployAddress = await this.deploy(OZ_ACCOUNT_CLASS_HASH, [publicKey]);

    if (deployAddress !== address) {
      console.warn(
        `   ⚠️  Address mismatch — computed: ${address}, deployed: ${deployAddress}\n` +
          "   The computed address uses deployer=0; deployed uses actual deployer.",
      );
    }

    console.log(`   ✅ Account deployed at: ${deployAddress}`);

    console.log(`💰 Funding account with ${formatEther(fundingAmountWei)} ETH...`);
    const [amountLow, amountHigh] = u256Split(fundingAmountWei);
    const fundingTx = await this.account.execute({
      contractAddress: ETH_CONTRACT_ADDRESS,
      entrypoint: "transfer",
      calldata: [deployAddress, amountLow, amountHigh],
    });
    console.log(`   Funding tx: ${fundingTx.transaction_hash}`);
    await this.provider.waitForTransaction(fundingTx.transaction_hash);
    console.log(`   ✅ Account funded`);

    return { address: deployAddress, privateKey, publicKey };
  }
}
