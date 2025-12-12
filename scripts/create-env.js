// Script to create a properly formatted .env file
// Run: node scripts/create-env.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const envPath = path.join(rootDir, '.env')

const envContent = `# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyBCEO3zMs7_Oh_lj-XNjfyPG00zrTcgwl8
VITE_FIREBASE_AUTH_DOMAIN=medichain-8f369.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=medichain-8f369
VITE_FIREBASE_STORAGE_BUCKET=medichain-8f369.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=802517269270
VITE_FIREBASE_APP_ID=1:802517269270:web:a667ec103fd2d099856e37

# Smart Contract Address (fill after deployment)
VITE_MEDICHAIN_ADDRESS=

# Sepolia RPC URL (REQUIRED - get from Infura or Alchemy)
# Get from: https://infura.io/ or https://www.alchemy.com/
SEPOLIA_RPC_URL=

# Private Key (REQUIRED - export from MetaMask test wallet)
# MetaMask → ⋮ → Account details → Export Private Key
# ⚠️ Use a TEST wallet, not your main wallet!
PRIVATE_KEY=

# Etherscan API Key (optional - for contract verification)
ETHERSCAN_API_KEY=
`

try {
  fs.writeFileSync(envPath, envContent, 'utf8')
  console.log('✅ .env file created/updated successfully!')
  console.log(`📁 Location: ${envPath}\n`)
  console.log('📝 Next steps:')
  console.log('   1. Add SEPOLIA_RPC_URL (get from Infura or Alchemy)')
  console.log('   2. Add PRIVATE_KEY (export from MetaMask test wallet)')
  console.log('   3. Run: npm run check-env (to verify)')
  console.log('   4. Run: npm run deploy:sepolia (to deploy contract)')
  console.log('   5. Add deployed address to VITE_MEDICHAIN_ADDRESS\n')
} catch (error) {
  console.error('❌ Error creating .env file:', error.message)
  process.exit(1)
}

