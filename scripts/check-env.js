// Script to check if .env file has all required values
// Run: node scripts/check-env.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Load .env file
const envPath = path.join(rootDir, '.env')
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!')
  console.log('💡 Create a .env file in the root directory')
  process.exit(1)
}

dotenv.config({ path: envPath })

console.log('🔍 Checking .env file...\n')

const required = {
  // Frontend (VITE_)
  'VITE_FIREBASE_API_KEY': 'Firebase API Key',
  'VITE_FIREBASE_AUTH_DOMAIN': 'Firebase Auth Domain',
  'VITE_FIREBASE_PROJECT_ID': 'Firebase Project ID',
  'VITE_FIREBASE_STORAGE_BUCKET': 'Firebase Storage Bucket',
  'VITE_FIREBASE_MESSAGING_SENDER_ID': 'Firebase Messaging Sender ID',
  'VITE_FIREBASE_APP_ID': 'Firebase App ID',
  'VITE_MEDICHAIN_ADDRESS': 'MediChain Contract Address (can be empty until deployment)',
  
  // Backend (Hardhat)
  'SEPOLIA_RPC_URL': 'Sepolia RPC URL (for contract deployment)',
  'PRIVATE_KEY': 'Private Key (for contract deployment)',
}

const optional = {
  'ETHERSCAN_API_KEY': 'Etherscan API Key (optional, for contract verification)',
}

let allGood = true

console.log('📋 Required Variables:\n')
for (const [key, description] of Object.entries(required)) {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    if (key === 'VITE_MEDICHAIN_ADDRESS') {
      console.log(`  ⚠️  ${key}: ${description}`)
      console.log(`     → Fill this after deploying the contract\n`)
    } else {
      console.log(`  ❌ ${key}: ${description} - MISSING!\n`)
      allGood = false
    }
  } else {
    // Mask sensitive values
    let displayValue = value
    if (key === 'PRIVATE_KEY') {
      displayValue = `${value.substring(0, 6)}...${value.substring(value.length - 4)}`
    } else if (key.includes('KEY') || key.includes('SECRET')) {
      displayValue = `${value.substring(0, 10)}...`
    }
    console.log(`  ✅ ${key}: ${description}`)
    console.log(`     Value: ${displayValue}\n`)
  }
}

console.log('📋 Optional Variables:\n')
for (const [key, description] of Object.entries(optional)) {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    console.log(`  ⚠️  ${key}: ${description} - Not set (optional)\n`)
  } else {
    console.log(`  ✅ ${key}: ${description}\n`)
  }
}

if (!allGood) {
  console.log('\n❌ Some required variables are missing!')
  console.log('💡 See ENV_SETUP_GUIDE.md for instructions on how to fill them.\n')
  process.exit(1)
} else {
  console.log('\n✅ All required variables are set!')
  console.log('💡 Next steps:')
  console.log('   1. Make sure your wallet has Sepolia testnet ETH')
  console.log('   2. Run: npm run compile')
  console.log('   3. Run: npm run deploy:sepolia')
  console.log('   4. Add the deployed contract address to VITE_MEDICHAIN_ADDRESS\n')
}

