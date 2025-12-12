# MediChain Quick Start Guide

## ✅ What's Done

- ✅ React + Vite frontend with Tailwind CSS
- ✅ All pages and components created
- ✅ Firebase integration configured
- ✅ Smart contract (MediChain.sol) ready
- ✅ Hardhat configuration for Sepolia
- ✅ Web3 service layer for blockchain interaction

## 🚀 Next Steps (In Order)

### 1. Verify Your `.env` File

Make sure your `.env` file has all the Firebase values (you already added them):

```bash
VITE_FIREBASE_API_KEY=AIzaSyBCEO3zMs7_Oh_lj-XNjfyPG00zrTcgwl8
VITE_FIREBASE_AUTH_DOMAIN=medichain-8f369.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medichain-8f369
VITE_FIREBASE_STORAGE_BUCKET=medichain-8f369.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=802517269270
VITE_FIREBASE_APP_ID=1:802517269270:web:a667ec103fd2d099856e37

# Add these after deployment:
VITE_MEDICHAIN_ADDRESS=
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_private_key
```

### 2. Set Up Firebase Security Rules

Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Firestore Database → Rules

Copy the rules from `SETUP.md` (Step 2) and paste them.

Do the same for Storage → Rules (Step 3 in SETUP.md).

### 3. Compile and Deploy Smart Contract

```bash
# Compile the contract
npm run compile

# Copy ABI to frontend
npm run copy-abi

# Deploy to Sepolia (make sure SEPOLIA_RPC_URL and PRIVATE_KEY are set)
npm run deploy:sepolia
```

After deployment, copy the contract address and add it to `.env`:
```bash
VITE_MEDICHAIN_ADDRESS=0xYourDeployedAddress
```

### 4. Start the App

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 5. Create Your First Admin User

**⚠️ IMPORTANT:** Since all new registrations create users with `pending` role, you MUST create the first admin manually via Firebase Console.

**Step-by-Step Instructions:**

1. **Go to Firebase Console**: https://console.firebase.google.com/
   - Select project: **medichain-8f369**

2. **Create Authentication User**:
   - Navigate to **Authentication** → **Users**
   - Click **"Add user"**
   - Enter:
     - Email: `admin@medichain.com` (or your preferred email)
     - Password: Create a strong password
   - Click **"Add user"**
   - **Copy the User UID** (you'll need this next)

3. **Create Firestore User Document**:
   - Go to **Firestore Database**
   - Click on **`users`** collection (create it if it doesn't exist)
   - Click **"Add document"**
   - Set **Document ID** = The User UID from step 2
   - Add these fields:
     ```
     uid: (paste the User UID)
     name: "Admin User"
     email: "admin@medichain.com"
     wallet: "" (optional, can add later)
     role: "admin"  ← IMPORTANT: Must be exactly "admin"
     status: "active"  ← IMPORTANT: Must be "active"
     createdAt: (click timestamp icon for current time)
     ```
   - Click **"Save"**

4. **Login to MediChain**:
   - Go to `http://localhost:5173/login`
   - Use the email and password you created
   - You should now have admin access!

**📖 For detailed instructions, see `ADMIN_SETUP.md`**

**After creating admin:**
- Login as admin
- Go to Admin Panel
- You'll see pending user registrations
- Assign roles to pending users
- Or create new users directly via Admin Panel

### 6. Test the Flow

1. **Login** as admin → Create users for each role
2. **Manufacturer** → Create a drug batch → Generate QR code
3. **Distributor** → Scan QR → Receive batch → Transfer to pharmacy
4. **Pharmacy** → Scan QR → Receive batch → Upload prescription
5. **Consumer** → Scan QR → Verify authenticity → View history

## 📝 Important Notes

- **MetaMask**: Make sure MetaMask is installed and connected to Sepolia testnet
- **Test ETH**: Get Sepolia ETH from a faucet for each wallet
- **ABI File**: The ABI will be automatically copied after `npm run compile`
- **Contract Address**: Must be set in `.env` before the frontend can interact with the contract

## 🐛 Troubleshooting

- **"Cannot find module '../abis/MediChain.json'"**: Run `npm run setup-contract`
- **"MetaMask not found"**: Install MetaMask browser extension
- **"Contract address not set"**: Add `VITE_MEDICHAIN_ADDRESS` to `.env`
- **Firebase errors**: Check that all Firebase config values are correct
- **Transaction fails**: Ensure wallet has Sepolia ETH and is on Sepolia network

## 📚 Full Documentation

See `SETUP.md` for detailed setup instructions and `README.md` for project overview.

