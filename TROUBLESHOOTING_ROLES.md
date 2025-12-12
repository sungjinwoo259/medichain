# Troubleshooting Blockchain Role Issues

If you're seeing "Missing Blockchain Role" error even after an admin granted the role, follow these steps:

## Step 1: Verify the Role Was Actually Granted

### Check Admin Panel Success Message
When an admin grants a role, they should see:
- ✅ A success message with a transaction hash
- A link to view the transaction on Etherscan

**If you see an error message instead**, the role grant failed. Check:
- Admin wallet is connected to MetaMask
- Admin wallet has Sepolia ETH for gas fees
- The wallet address entered matches exactly (case-sensitive for display, but should work either way)

### Check Etherscan
1. Copy the transaction hash from the admin panel success message
2. Go to https://sepolia.etherscan.io/tx/[TRANSACTION_HASH]
3. Verify the transaction was successful (Status: Success)
4. Check that the `to` address matches your wallet address

## Step 2: Verify Your Wallet Address

Make sure the wallet address you're using matches exactly:
- In Manufacturer Panel: Check the wallet address shown in the error message
- In Admin Panel: Verify the wallet address entered matches exactly
- Case doesn't matter for Ethereum addresses, but the address must be exactly 42 characters starting with `0x`

## Step 3: Refresh Role Check

1. In the Manufacturer Panel, click the **"Refresh Role Check"** button
2. Wait a few seconds for the check to complete
3. If it still shows missing role, proceed to Step 4

## Step 4: Check Browser Console

1. Open browser Developer Tools (F12)
2. Go to the Console tab
3. Look for messages like:
   - `hasRoleOnChain result:` - Shows the role check result
   - `Granting role:` - Shows role grant attempt
   - `Transaction sent:` - Shows transaction hash
   - Any error messages

## Step 5: Common Issues and Solutions

### Issue: "Transaction failed" in Admin Panel
**Solution:**
- Make sure admin wallet is connected to MetaMask
- Ensure admin wallet has Sepolia ETH
- Check you're on Sepolia testnet in MetaMask
- Verify the contract address in `.env` is correct

### Issue: Role shows as granted but still can't create batches
**Solution:**
- Wait 10-15 seconds after role grant (blockchain confirmation time)
- Click "Refresh Role Check" button
- Disconnect and reconnect your MetaMask wallet
- Refresh the page

### Issue: Wallet address mismatch
**Solution:**
- Copy the exact wallet address from MetaMask
- Paste it in the Admin Panel (don't type it manually)
- Make sure there are no extra spaces

### Issue: Admin wallet not connected
**Solution:**
- Admin must connect MetaMask wallet before granting roles
- The "Connect MetaMask" button should show the connected wallet address
- If not connected, blockchain role grant will be skipped

## Step 6: Manual Role Grant (Command Line)

If the Admin Panel isn't working, you can grant the role manually:

```bash
# Make sure you're using the admin account (the one that deployed the contract)
hardhat run scripts/grant-role.js --network sepolia -- --role MANUFACTURER_ROLE --address 0x8BBb8FB9Bdf8Cc3B2a447A34868e406Ce42Fd6aA
```

Replace `0x8BBb8FB9Bdf8Cc3B2a447A34868e406Ce42Fd6aA` with your actual wallet address.

## Step 7: Verify Contract Address

Make sure the contract address in `.env` matches the deployed contract:
- Check `VITE_MEDICHAIN_ADDRESS` in `.env`
- Verify it matches the address from deployment
- If different, update `.env` and restart the dev server

## Still Not Working?

1. **Check Network**: Ensure you're on Sepolia testnet in MetaMask
2. **Check Contract**: Verify the contract is deployed and accessible
3. **Check Admin**: Ensure the admin account has DEFAULT_ADMIN_ROLE
4. **Check Gas**: Ensure admin wallet has enough Sepolia ETH
5. **Wait**: Sometimes it takes a few block confirmations for the role to be recognized

## Debug Information to Collect

If still having issues, collect this information:
1. Your wallet address (from MetaMask)
2. Admin wallet address (from MetaMask)
3. Contract address (from `.env`)
4. Transaction hash (if role grant was attempted)
5. Browser console errors
6. Network (should be Sepolia)

