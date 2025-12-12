# Setup Default Address with All Roles

This guide shows how to grant all blockchain roles to the default address: `0x8bbb8fb9bdf8cc3b2a447a34868e406ce42fd6aa`

## Quick Setup

Run this command to grant all roles (Manufacturer, Distributor, Pharmacy, Admin) to the default address:

```bash
npm run grant-all-roles
```

This will:
- ✅ Grant MANUFACTURER_ROLE
- ✅ Grant DISTRIBUTOR_ROLE  
- ✅ Grant PHARMACY_ROLE
- ✅ Grant DEFAULT_ADMIN_ROLE

## Prerequisites

1. **Contract must be deployed** - Make sure `VITE_MEDICHAIN_ADDRESS` is set in `.env`
2. **Admin account** - The account in `PRIVATE_KEY` must be the admin (the one that deployed the contract)
3. **Sepolia ETH** - Admin account needs Sepolia ETH for gas fees
4. **Network** - Make sure you're on Sepolia testnet

## What This Does

The script will:
1. Check which roles the address currently has
2. Grant any missing roles
3. Verify all roles were granted successfully
4. Show the final status

## Default Address

**Address:** `0x8bbb8fb9bdf8cc3b2a447a34868e406ce42fd6aa`

This address will have access to:
- **Manufacturer**: Create batches
- **Distributor**: Transfer batches
- **Pharmacy**: Add prescriptions
- **Admin**: Grant/revoke roles

## Using This Address

After running the script:

1. **In MetaMask**: Make sure this address is imported/active
2. **In Firebase**: Update user records to use this wallet address
3. **In Admin Panel**: When creating/approving users, use this address

## Verification

After granting roles, you can verify by:

1. **Check Manufacturer Panel**: Should show green checkmark ✅
2. **Check Browser Console**: Look for `hasRoleOnChain result: true`
3. **Try creating a batch**: Should work without "Not manufacturer" error

## Troubleshooting

### Error: "AccessControlUnauthorizedAccount"
- The account in `PRIVATE_KEY` is not the admin
- Solution: Use the admin account (the one that deployed the contract)

### Error: "insufficient funds"
- Admin account doesn't have enough Sepolia ETH
- Solution: Get Sepolia ETH from a faucet

### Roles not showing after grant
- Wait 10-15 seconds for block confirmation
- Refresh the page
- Click "Refresh Role Check" in Manufacturer Panel

## Manual Verification

You can manually check roles using Etherscan:
1. Go to your contract on Sepolia Etherscan
2. Go to "Read Contract" tab
3. Use `hasRole` function to check each role

## Notes

- The address is case-insensitive (Ethereum addresses work either way)
- Roles are permanent until revoked by an admin
- You can use this same address for all roles in testing
- For production, use separate addresses for each role
