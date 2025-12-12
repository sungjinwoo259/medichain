# MediChain Setup Guide

## Step 1: Environment Variables (.env)

Make sure your `.env` file in the root directory contains:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBCEO3zMs7_Oh_lj-XNjfyPG00zrTcgwl8
VITE_FIREBASE_AUTH_DOMAIN=medichain-8f369.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medichain-8f369
VITE_FIREBASE_STORAGE_BUCKET=medichain-8f369.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=802517269270
VITE_FIREBASE_APP_ID=1:802517269270:web:a667ec103fd2d099856e37

# Smart Contract Address (will be set after deployment)
VITE_MEDICHAIN_ADDRESS=

# Hardhat/Deployment (for backend)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_sepolia_deployer_private_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_optional
```

## Step 2: Firebase Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Batches collection
    match /batches/{batchId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                       (resource.data.currentOwnerWallet == request.auth.uid || 
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
    
    // Prescriptions collection
    match /prescriptions/{prescriptionId} {
      allow read: if request.auth != null && 
                     (resource.data.pharmacyId == request.auth.uid || 
                      resource.data.consumerId == request.auth.uid ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow create: if request.auth != null;
    }
  }
}
```

## Step 3: Firebase Storage Rules

Go to Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /prescriptions/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Step 4: Deploy Smart Contract to Sepolia

1. **Get Sepolia testnet ETH:**
   - Use a faucet: https://sepoliafaucet.com/ or https://faucet.quicknode.com/ethereum/sepolia
   - Fund your deployer wallet (the one with the PRIVATE_KEY)

2. **Update `.env` with your Sepolia RPC URL:**
   - Get a free RPC URL from Infura, Alchemy, or QuickNode
   - Add it as `SEPOLIA_RPC_URL`

3. **Compile the contract:**
   ```bash
   npx hardhat compile
   ```

4. **Deploy to Sepolia:**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

5. **Copy the deployed contract address** from the output and add it to `.env`:
   ```bash
   VITE_MEDICHAIN_ADDRESS=0xYourDeployedContractAddress
   ```

6. **(Optional) Verify on Etherscan:**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <ADMIN_ADDRESS>
   ```

## Step 5: Copy Contract ABI for Frontend

After compilation, copy the ABI to a location the frontend can access:

```bash
# On Windows (PowerShell)
Copy-Item artifacts\contracts\MediChain.sol\MediChain.json src\abis\MediChain.json

# On Mac/Linux
cp artifacts/contracts/MediChain.sol/MediChain.json src/abis/MediChain.json
```

Or create the `src/abis` folder first, then copy.

## Step 6: Start the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Step 7: Initial Setup in the App

1. **Create an Admin Account:**
   - Go to Firebase Console → Authentication → Users
   - Click "Add user" and create an admin account manually
   - Or use the app's login page (but you'll need to set up the first admin via Firebase Console)

2. **Set Admin Role in Firestore:**
   - Go to Firestore → `users` collection
   - Find the user document by their UID
   - Add field: `role: "admin"`, `wallet: "0xYourMetaMaskAddress"`

3. **Login as Admin:**
   - Use the login page with the admin email/password
   - Connect MetaMask (make sure it's on Sepolia network)
   - You'll be redirected to the Admin Panel

4. **Create Other Users:**
   - Use the Admin Panel to create users with different roles:
     - Manufacturer
     - Distributor
     - Pharmacy
     - Consumer
   - Each user needs a MetaMask wallet address

## Step 8: Test the Flow

1. **Manufacturer:**
   - Login as manufacturer
   - Create a new drug batch
   - Generate QR code

2. **Distributor:**
   - Login as distributor
   - Scan the QR code
   - Receive and transfer batch

3. **Pharmacy:**
   - Login as pharmacy
   - Scan QR code to receive from distributor
   - Upload prescription when selling to consumer

4. **Consumer:**
   - Login as consumer
   - Scan QR code to verify drug authenticity
   - View complete blockchain history

## Troubleshooting

- **"MetaMask not found"**: Install MetaMask extension
- **"Contract not deployed"**: Make sure `VITE_MEDICHAIN_ADDRESS` is set in `.env`
- **"ABI not found"**: Run `npx hardhat compile` and copy the ABI file
- **Firebase errors**: Check that all Firebase config values are correct in `.env`
- **Transaction failures**: Ensure wallet has Sepolia ETH and is on Sepolia network

