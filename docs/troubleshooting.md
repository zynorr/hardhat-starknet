# Troubleshooting

## "scarb: command not found"

Scarb is not installed or not in your PATH.

**Fix:** Install Scarb:
```bash
curl -L https://docs.swmansion.com/scarb/install.sh | sh
```
Or set a custom path: `scarbPath: "/path/to/scarb"`.

## "Compiled artifacts not found"

Run `scarb build` or `npx hardhat compile:starknet` first. If still missing:

- Check `Scarb.toml` has `[[target.starknet-contract]]` with `sierra = true` and `casm = true`
- Verify the contract name matches the artifact filename
- If using a custom `artifactDir`, update your config

## "Cannot connect to devnet"

Make sure `starknet-devnet` is running on port 5050:
```bash
starknet-devnet --seed 0 --port 5050
```

## "No Starknet account configured"

Set wallet credentials:
```bash
export STARKNET_ACCOUNT=0x...
export STARKNET_PRIVATE_KEY=0x...
```
Or create a new one on devnet: `npx hardhat starknet:create-account`

## "Transaction rejected by RPC"

Possible causes:
- Insufficient account balance for gas fees
- Calldata doesn't match the function signature
- Function doesn't exist on the contract

Check the Starknet error message for details.
