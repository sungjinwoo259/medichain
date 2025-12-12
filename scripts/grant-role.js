import hre from 'hardhat'

async function main() {
  const contractAddress = process.env.VITE_MEDICHAIN_ADDRESS
  if (!contractAddress) {
    throw new Error('VITE_MEDICHAIN_ADDRESS not set in .env')
  }

  // Get role and address from hardhat config or environment
  // For hardhat run, we'll use environment variables
  const roleName = process.env.ROLE || process.argv[2]
  const addressToGrant = process.env.ADDRESS || process.argv[3]

  if (!roleName || !addressToGrant) {
    console.log('Usage: hardhat run scripts/grant-role.js --network sepolia -- --role MANUFACTURER_ROLE --address 0x...')
    console.log('Or set environment variables: ROLE=MANUFACTURER_ROLE ADDRESS=0x...')
    console.log('Roles: MANUFACTURER_ROLE, DISTRIBUTOR_ROLE, PHARMACY_ROLE')
    process.exit(1)
  }

  const [signer] = await hre.ethers.getSigners()
  console.log('Using account:', signer.address)

  const MediChain = await hre.ethers.getContractFactory('MediChain')
  const contract = MediChain.attach(contractAddress)

  // Map role names to role constants
  const roleMap = {
    MANUFACTURER_ROLE: await contract.MANUFACTURER_ROLE(),
    DISTRIBUTOR_ROLE: await contract.DISTRIBUTOR_ROLE(),
    PHARMACY_ROLE: await contract.PHARMACY_ROLE(),
  }

  const role = roleMap[roleName]
  if (!role) {
    throw new Error(`Invalid role: ${roleName}. Must be one of: ${Object.keys(roleMap).join(', ')}`)
  }

  console.log(`Granting ${roleName} to ${addressToGrant}...`)

  const tx = await contract.grantRole(role, addressToGrant)
  console.log('Transaction sent:', tx.hash)
  await tx.wait()
  console.log('Role granted successfully!')

  // Verify the role was granted
  const hasRole = await contract.hasRole(role, addressToGrant)
  console.log(`Verification: ${addressToGrant} has ${roleName}: ${hasRole}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})

