import hre from 'hardhat'
import dotenv from 'dotenv'

dotenv.config()

async function main() {
  const contractAddress = process.env.VITE_MEDICHAIN_ADDRESS
  if (!contractAddress) {
    throw new Error('VITE_MEDICHAIN_ADDRESS not set in .env')
  }

  // Default address to grant all roles
  const defaultAddress = '0x8bbb8fb9bdf8cc3b2a447a34868e406ce42fd6aa'
  
  const [signer] = await hre.ethers.getSigners()
  console.log('Using account (must be admin):', signer.address)
  console.log('Granting all roles to:', defaultAddress)
  console.log('Contract address:', contractAddress)
  console.log('')

  const MediChain = await hre.ethers.getContractFactory('MediChain')
  const contract = MediChain.attach(contractAddress)

  // Get all role constants
  const MANUFACTURER_ROLE = await contract.MANUFACTURER_ROLE()
  const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE()
  const PHARMACY_ROLE = await contract.PHARMACY_ROLE()
  const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE()

  console.log('=== Checking current roles ===')
  const hasManufacturer = await contract.hasRole(MANUFACTURER_ROLE, defaultAddress)
  const hasDistributor = await contract.hasRole(DISTRIBUTOR_ROLE, defaultAddress)
  const hasPharmacy = await contract.hasRole(PHARMACY_ROLE, defaultAddress)
  const hasAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, defaultAddress)

  console.log(`MANUFACTURER_ROLE: ${hasManufacturer ? '✅' : '❌'}`)
  console.log(`DISTRIBUTOR_ROLE: ${hasDistributor ? '✅' : '❌'}`)
  console.log(`PHARMACY_ROLE: ${hasPharmacy ? '✅' : '❌'}`)
  console.log(`DEFAULT_ADMIN_ROLE: ${hasAdmin ? '✅' : '❌'}`)
  console.log('')

  // Grant MANUFACTURER_ROLE
  if (!hasManufacturer) {
    console.log('Granting MANUFACTURER_ROLE...')
    try {
      const tx = await contract.grantRole(MANUFACTURER_ROLE, defaultAddress)
      console.log('  Transaction sent:', tx.hash)
      await tx.wait()
      console.log('  ✅ MANUFACTURER_ROLE granted')
    } catch (err) {
      console.error('  ❌ Failed to grant MANUFACTURER_ROLE:', err.message)
    }
  } else {
    console.log('  ℹ️  MANUFACTURER_ROLE already granted')
  }

  // Grant DISTRIBUTOR_ROLE
  if (!hasDistributor) {
    console.log('Granting DISTRIBUTOR_ROLE...')
    try {
      const tx = await contract.grantRole(DISTRIBUTOR_ROLE, defaultAddress)
      console.log('  Transaction sent:', tx.hash)
      await tx.wait()
      console.log('  ✅ DISTRIBUTOR_ROLE granted')
    } catch (err) {
      console.error('  ❌ Failed to grant DISTRIBUTOR_ROLE:', err.message)
    }
  } else {
    console.log('  ℹ️  DISTRIBUTOR_ROLE already granted')
  }

  // Grant PHARMACY_ROLE
  if (!hasPharmacy) {
    console.log('Granting PHARMACY_ROLE...')
    try {
      const tx = await contract.grantRole(PHARMACY_ROLE, defaultAddress)
      console.log('  Transaction sent:', tx.hash)
      await tx.wait()
      console.log('  ✅ PHARMACY_ROLE granted')
    } catch (err) {
      console.error('  ❌ Failed to grant PHARMACY_ROLE:', err.message)
    }
  } else {
    console.log('  ℹ️  PHARMACY_ROLE already granted')
  }

  // Grant DEFAULT_ADMIN_ROLE
  if (!hasAdmin) {
    console.log('Granting DEFAULT_ADMIN_ROLE...')
    try {
      const tx = await contract.grantRole(DEFAULT_ADMIN_ROLE, defaultAddress)
      console.log('  Transaction sent:', tx.hash)
      await tx.wait()
      console.log('  ✅ DEFAULT_ADMIN_ROLE granted')
    } catch (err) {
      console.error('  ❌ Failed to grant DEFAULT_ADMIN_ROLE:', err.message)
    }
  } else {
    console.log('  ℹ️  DEFAULT_ADMIN_ROLE already granted')
  }

  console.log('')
  console.log('=== Final Role Status ===')
  const finalManufacturer = await contract.hasRole(MANUFACTURER_ROLE, defaultAddress)
  const finalDistributor = await contract.hasRole(DISTRIBUTOR_ROLE, defaultAddress)
  const finalPharmacy = await contract.hasRole(PHARMACY_ROLE, defaultAddress)
  const finalAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, defaultAddress)

  console.log(`MANUFACTURER_ROLE: ${finalManufacturer ? '✅' : '❌'}`)
  console.log(`DISTRIBUTOR_ROLE: ${finalDistributor ? '✅' : '❌'}`)
  console.log(`PHARMACY_ROLE: ${finalPharmacy ? '✅' : '❌'}`)
  console.log(`DEFAULT_ADMIN_ROLE: ${finalAdmin ? '✅' : '❌'}`)
  console.log('')
  console.log('🎉 Role granting complete!')
  console.log(`Default address: ${defaultAddress}`)
  console.log('You can now use this address for all roles (Manufacturer, Distributor, Pharmacy, Admin)')
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
