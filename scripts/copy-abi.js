// Script to copy compiled contract ABI to src/abis for frontend use
// Run: node scripts/copy-abi.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const sourcePath = path.join(rootDir, 'artifacts', 'contracts', 'MediChain.sol', 'MediChain.json')
const destPath = path.join(rootDir, 'src', 'abis', 'MediChain.json')

try {
  if (!fs.existsSync(sourcePath)) {
    console.error('❌ Contract ABI not found. Please run: npx hardhat compile')
    process.exit(1)
  }

  // Ensure destination directory exists
  const destDir = path.dirname(destPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  // Copy the file
  fs.copyFileSync(sourcePath, destPath)
  console.log('✅ ABI copied successfully to src/abis/MediChain.json')
} catch (error) {
  console.error('❌ Error copying ABI:', error.message)
  process.exit(1)
}

