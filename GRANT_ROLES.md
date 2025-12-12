# Granting Blockchain Roles

The MediChain smart contract uses role-based access control. Users need blockchain roles to interact with the contract.

## Quick Fix for Current User

If you're getting "Not manufacturer" error, you need to grant yourself the MANUFACTURER_ROLE.

### Option 1: Using Admin Panel (Recommended)

1. Login as an admin user
2. Go to Admin Panel
3. When assigning a role to a user, make sure to:
   - Select the role (Manufacturer, Distributor, or Pharmacy)
   - Enter the user's wallet address
   - Click "Approve & Assign Role"
   - The system will automatically grant both Firebase and blockchain roles

**Note:** The admin wallet must be connected to MetaMask for blockchain role granting to work.

### Option 2: Using Command Line Script

If you need to grant a role manually:

```bash
# Grant MANUFACTURER_ROLE to an address
hardhat run scripts/grant-role.js --network sepolia -- --role MANUFACTURER_ROLE --address 0x8BBb8FB9Bdf8Cc3B2a447A34868e406Ce42Fd6aA

# Grant DISTRIBUTOR_ROLE
hardhat run scripts/grant-role.js --network sepolia -- --role DISTRIBUTOR_ROLE --address 0x...

# Grant PHARMACY_ROLE
hardhat run scripts/grant-role.js --network sepolia -- --role PHARMACY_ROLE --address 0x...
```

**Important:** 
- The account used in `PRIVATE_KEY` in `.env` must be the admin (the one who deployed the contract)
- Only the admin can grant roles

## Available Roles

- **MANUFACTURER_ROLE**: Required to create batches
- **DISTRIBUTOR_ROLE**: Required for distributor operations
- **PHARMACY_ROLE**: Required to add prescriptions

## Verify Role

You can verify if an address has a role by checking the contract on Etherscan or using the contract's `hasRole` function.

## Troubleshooting

1. **"Not manufacturer" error**: Your wallet address doesn't have the MANUFACTURER_ROLE. Grant it using one of the methods above.

2. **"AccessControlUnauthorizedAccount"**: The account trying to grant the role is not an admin. Make sure you're using the admin account.

3. **Transaction fails**: 
   - Check you have Sepolia ETH for gas
   - Verify the contract address in `.env` is correct
   - Ensure you're connected to Sepolia testnet

