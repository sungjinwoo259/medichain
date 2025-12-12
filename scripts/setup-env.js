// Interactive script to help set up .env file
// Run: node scripts/setup-env.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const envPath = path.join(rootDir, '.env')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

console.log('🔧 MediChain .env Setup Wizard\n')
console.log('This will help you create/update your .env file.\n')

// Firebase config (already known)
const firebaseConfig = {
  VITE_FIREBASE_API_KEY: 'AIzaSyBCEO3zMs7_Oh_lj-XNjfyPG00zrTcgwl8',
  VITE_FIREBASE_AUTH_DOMAIN: 'medichain-8f369.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'medichain-8f369',
  VITE_FIREBASE_STORAGE_BUCKET: 'medichain-8f369.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '802517269270',
  VITE_FIREBASE_APP_ID: '1:802517269270:web:a667ec103fd2d099856e37',
}

let envContent = `# Firebase Configuration
VITE_FIREBASE_API_KEY=${firebaseConfig.VITE_FIREBASE_API_KEY}
VITE_FIREBASE_AUTH_DOMAIN=${firebaseConfig.VITE_FIREBASE_AUTH_DOMAIN}
VITE_FIREBASE_PROJECT_ID=${firebaseConfig.VITE_FIREBASE_PROJECT_ID}
VITE_FIREBASE_STORAGE_BUCKET=${firebaseConfig.VITE_FIREBASE_STORAGE_BUCKET}
VITE_FIREBASE_MESSAGING_SENDER_ID=${firebaseConfig.VITE_FIREBASE_MESSAGING_SENDER_ID}
VITE_FIREBASE_APP_ID=${firebaseConfig.VITE_FIREBASE_APP_ID}

# Smart Contract Address (fill after deployment)
VITE_MEDICHAIN_ADDRESS=

# Sepolia RPC URL
`

console.log('📡 Sepolia RPC URL Setup\n')
console.log('You need a Sepolia RPC endpoint. Options:')
console.log('1. Infura (https://infura.io/) - Recommended')
console.log('2. Alchemy (https://www.alchemy.com/)')
console.log('3. Enter your own RPC URL\n')

const rpcChoice = await question('Enter your Sepolia RPC URL (or press Enter to skip): ')
if (rpcChoice.trim()) {
  envContent += `SEPOLIA_RPC_URL=${rpcChoice.trim()}\n`
} else {
  envContent += `SEPOLIA_RPC_URL=\n`
}

envContent += `\n# Private Key (for deployment)\n`
console.log('\n🔐 Private Key Setup\n')
console.log('⚠️  SECURITY: Use a TEST wallet, not your main wallet!')
console.log('How to get: MetaMask → ⋮ → Account details → Export Private Key\n')

const privateKey = await question('Enter your private key (or press Enter to skip): ')
if (privateKey.trim()) {
  envContent += `PRIVATE_KEY=${privateKey.trim()}\n`
} else {
  envContent += `PRIVATE_KEY=\n`
}

envContent += `\n# Etherscan API Key (optional)\n`
const etherscanKey = await question('\nEnter Etherscan API key (optional, press Enter to skip): ')
if (etherscanKey.trim()) {
  envContent += `ETHERSCAN_API_KEY=${etherscanKey.trim()}\n`
} else {
  envContent += `ETHERSCAN_API_KEY=\n`
}

// Write the file
fs.writeFileSync(envPath, envContent, 'utf8')

console.log('\n✅ .env file created/updated successfully!')
console.log(`📁 Location: ${envPath}\n`)

if (!rpcChoice.trim() || !privateKey.trim()) {
  console.log('⚠️  Note: Some values are still empty.')
  console.log('   You need SEPOLIA_RPC_URL and PRIVATE_KEY to deploy the contract.\n')
}

console.log('Next steps:')
console.log('1. Run: npm run check-env (to verify)')
console.log('2. Run: npm run deploy:sepolia (to deploy contract)')
console.log('3. Add the deployed address to VITE_MEDICHAIN_ADDRESS\n')

rl.close()

