# How to Get Your Private Key from MetaMask

## ⚠️ Important
The value you provided (`0x8bbb8fb9bdf8cc3b2a447a34868e406ce42fd6aa`) is a **wallet address**, not a private key.

**Private keys are:**
- 66 characters long (starts with `0x` + 64 hex characters)
- Example: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

**Wallet addresses are:**
- 42 characters long (starts with `0x` + 40 hex characters)
- Example: `0x8bbb8fb9bdf8cc3b2a447a34868e406ce42fd6aa` ← This is what you have

---

## Steps to Get Private Key

1. **Open MetaMask** browser extension

2. **Make sure you're on the account** with address: `0x8bbb8fb9bdf8cc3b2a447a34868e406ce42fd6aa`

3. **Click the 3 dots (⋮)** next to your account name at the top

4. **Select "Account details"**

5. **Click "Export Private Key"**

6. **Enter your MetaMask password**

7. **Copy the private key** - it will be 66 characters long and look like:
   ```
   0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
   ```

8. **Add it to your `.env` file:**
   ```bash
   PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
   ```

---

## Security Reminder

⚠️ **NEVER:**
- Share your private key publicly
- Commit it to Git (it's already in `.gitignore` ✅)
- Use your main wallet's private key

✅ **DO:**
- Use a test wallet for development
- Keep your private key secure
- Only use it for testnet deployments

---

## After Adding Private Key

1. **Verify:** `npm run check-env`
2. **Make sure wallet has Sepolia ETH** (get from faucet if needed)
3. **Deploy:** `npm run deploy:sepolia`

