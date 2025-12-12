# How to Fill Your .env File - Step by Step

## ✅ Already Filled (Firebase Config)
You've already added all the Firebase configuration values. Great!

## 🔧 Remaining Fields to Fill

### 1. `VITE_MEDICHAIN_ADDRESS` (Fill AFTER contract deployment)
**Status:** Leave empty for now, fill after Step 3 below
```
VITE_MEDICHAIN_ADDRESS=
```

**How to get it:**
- After deploying the contract (see Step 3), you'll see output like:
  ```
  MediChain deployed to: 0x1234567890abcdef1234567890abcdef12345678
  ```
- Copy that address and paste it here.

---

### 2. `SEPOLIA_RPC_URL` (Required for deployment)

You need an RPC endpoint to connect to Sepolia testnet. Choose one option:

#### Option A: Infura (Free, Recommended)
1. Go to https://infura.io/
2. Sign up for a free account
3. Create a new project
4. Select "Ethereum" network
5. Copy the "Sepolia" endpoint URL
6. It will look like: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

**Format:**
```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
```

#### Option B: Alchemy (Free, Alternative)
1. Go to https://www.alchemy.com/
2. Sign up for a free account
3. Create a new app
4. Select "Ethereum" and "Sepolia" network
5. Copy the HTTPS URL
6. It will look like: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

**Format:**
```
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

#### Option C: QuickNode (Free)
1. Go to https://www.quicknode.com/
2. Sign up and create an endpoint
3. Select "Ethereum" and "Sepolia"
4. Copy the endpoint URL

---

### 3. `PRIVATE_KEY` (Required for deployment)

This is the private key of the wallet that will deploy the contract. **IMPORTANT: Never share this key!**

#### How to Get Your Private Key from MetaMask:

1. **Open MetaMask** browser extension
2. Click the **three dots (⋮)** next to your account name
3. Select **"Account details"**
4. Click **"Export Private Key"**
5. Enter your MetaMask password
6. **Copy the private key** (it starts with `0x`)

**⚠️ SECURITY WARNING:**
- This private key gives full access to your wallet
- Never commit it to Git (it's already in `.gitignore`)
- Never share it publicly
- Use a separate wallet for testing, not your main wallet

**Format:**
```
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**Make sure:**
- The wallet has Sepolia testnet ETH (get from a faucet)
- You're using a test wallet, not your main wallet

#### Get Sepolia Testnet ETH:
- https://sepoliafaucet.com/
- https://faucet.quicknode.com/ethereum/sepolia
- https://www.alchemy.com/faucets/ethereum-sepolia

---

### 4. `ETHERSCAN_API_KEY` (Optional - for contract verification)

This is optional but recommended if you want to verify your contract on Etherscan.

1. Go to https://etherscan.io/
2. Sign up for a free account
3. Go to **"API-KEYs"** in your account menu
4. Click **"Add"** to create a new API key
5. Copy the API key

**Format:**
```
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

**Note:** This is optional. You can leave it empty if you don't want to verify the contract.

---

## 📝 Complete .env Template

Here's what your complete `.env` file should look like:

```bash
# Firebase Configuration (✅ Already filled)
VITE_FIREBASE_API_KEY=AIzaSyBCEO3zMs7_Oh_lj-XNjfyPG00zrTcgwl8
VITE_FIREBASE_AUTH_DOMAIN=medichain-8f369.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medichain-8f369
VITE_FIREBASE_STORAGE_BUCKET=medichain-8f369.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=802517269270
VITE_FIREBASE_APP_ID=1:802517269270:web:a667ec103fd2d099856e37

# Smart Contract Address (Fill after deployment)
VITE_MEDICHAIN_ADDRESS=

# Hardhat/Deployment Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY_OPTIONAL
```

---

## 🚀 Quick Setup Checklist

- [ ] Get Sepolia RPC URL from Infura/Alchemy → Fill `SEPOLIA_RPC_URL`
- [ ] Export private key from MetaMask test wallet → Fill `PRIVATE_KEY`
- [ ] Get Sepolia testnet ETH for that wallet (from faucet)
- [ ] (Optional) Get Etherscan API key → Fill `ETHERSCAN_API_KEY`
- [ ] Deploy contract: `npm run deploy:sepolia`
- [ ] Copy deployed contract address → Fill `VITE_MEDICHAIN_ADDRESS`

---

## ⚠️ Important Reminders

1. **Never commit `.env` to Git** (already in `.gitignore` ✅)
2. **Use a test wallet**, not your main wallet
3. **Keep your private key secure** - never share it
4. **Get testnet ETH** before deploying (contract deployment costs gas)

---

## 🆘 Need Help?

If you're stuck:
- **RPC URL issues**: Make sure you've created a project/app on Infura/Alchemy
- **Private key format**: Should start with `0x` and be 66 characters long
- **Deployment fails**: Check that you have Sepolia ETH in your wallet
- **Contract address**: Will be shown in terminal after successful deployment

