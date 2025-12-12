# How to Add SEPOLIA_RPC_URL and PRIVATE_KEY to .env

## Current Status
✅ Firebase config is set  
❌ `SEPOLIA_RPC_URL` - **MISSING** (required for deployment)  
❌ `PRIVATE_KEY` - **MISSING** (required for deployment)

---

## Step 1: Get SEPOLIA_RPC_URL

### Option A: Infura (Recommended - Free)

1. **Go to:** https://infura.io/
2. **Sign up** for a free account (or log in)
3. **Click "Create New Key"** or **"Create Project"**
4. **Select:**
   - Product: **Ethereum**
   - Network: **Sepolia**
5. **Copy the endpoint URL** - it will look like:
   ```
   https://sepolia.infura.io/v3/abc123def456ghi789...
   ```

### Option B: Alchemy (Alternative - Free)

1. **Go to:** https://www.alchemy.com/
2. **Sign up** for a free account (or log in)
3. **Click "Create App"**
4. **Select:**
   - Chain: **Ethereum**
   - Network: **Sepolia**
5. **Copy the HTTPS URL** - it will look like:
   ```
   https://eth-sepolia.g.alchemy.com/v2/abc123def456...
   ```

---

## Step 2: Get PRIVATE_KEY from MetaMask

1. **Open MetaMask** browser extension
2. **Click the 3 dots (⋮)** next to your account name
3. **Select "Account details"**
4. **Click "Export Private Key"**
5. **Enter your MetaMask password**
6. **Copy the private key** (starts with `0x`)

⚠️ **IMPORTANT:**
- Use a **TEST wallet**, NOT your main wallet!
- The private key gives full access to your wallet
- Never share it publicly

---

## Step 3: Get Sepolia Testnet ETH

Your wallet needs Sepolia ETH to pay for gas fees:

1. **Go to a Sepolia faucet:**
   - https://sepoliafaucet.com/
   - https://faucet.quicknode.com/ethereum/sepolia
   - https://www.alchemy.com/faucets/ethereum-sepolia

2. **Enter your wallet address** (the one you exported the private key from)
3. **Request testnet ETH** (usually 0.5-1 ETH)

---

## Step 4: Add Values to .env File

1. **Open** `.env` file in your project root:
   ```
   C:\Users\santhoo\Videos\medichain\.env
   ```

2. **Find these lines:**
   ```bash
   SEPOLIA_RPC_URL=
   PRIVATE_KEY=
   ```

3. **Replace with your values:**
   ```bash
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
   PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
   ```

4. **Save the file**

---

## Step 5: Verify

Run this command to check:
```bash
npm run check-env
```

You should see:
- ✅ SEPOLIA_RPC_URL: Sepolia RPC URL
- ✅ PRIVATE_KEY: Private Key

---

## Step 6: Deploy

Once both values are set:
```bash
npm run deploy:sepolia
```

---

## Quick Example

Your `.env` file should look like this:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBCEO3zMs7_Oh_lj-XNjfyPG00zrTcgwl8
VITE_FIREBASE_AUTH_DOMAIN=medichain-8f369.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medichain-8f369
VITE_FIREBASE_STORAGE_BUCKET=medichain-8f369.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=802517269270
VITE_FIREBASE_APP_ID=1:802517269270:web:a667ec103fd2d099856e37

# Smart Contract Address (fill after deployment)
VITE_MEDICHAIN_ADDRESS=

# Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/abc123def456ghi789jkl012mno345pqr

# Private Key
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Etherscan API Key (optional)
ETHERSCAN_API_KEY=
```

---

## Need Help?

- **Can't find Infura/Alchemy?** - Check the links above
- **Private key not working?** - Make sure you copied the entire key (starts with `0x`, 66 characters total)
- **Deployment fails?** - Make sure your wallet has Sepolia ETH

