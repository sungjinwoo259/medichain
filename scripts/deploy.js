import hre from 'hardhat'

async function main() {
  const [deployer] = await hre.ethers.getSigners()
  console.log('Deploying contracts with account:', deployer.address)

  // Default address to grant all roles after deployment
  const defaultAddress = '0x8bbb8fb9bdf8cc3b2a447a34868e406ce42fd6aa'
  console.log('Default address for all roles:', defaultAddress)

  const MediChain = await hre.ethers.getContractFactory('MediChain')
  const contract = await MediChain.deploy(deployer.address)
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('MediChain deployed to:', address)

  // Grant all roles to default address if deployer is admin
  console.log('\n=== Granting all roles to default address ===')
  try {
    const MANUFACTURER_ROLE = await contract.MANUFACTURER_ROLE()
    const DISTRIBUTOR_ROLE = await contract.DISTRIBUTOR_ROLE()
    const PHARMACY_ROLE = await contract.PHARMACY_ROLE()
    const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE()

    // Grant MANUFACTURER_ROLE
    console.log('Granting MANUFACTURER_ROLE...')
    const tx1 = await contract.grantRole(MANUFACTURER_ROLE, defaultAddress)
    await tx1.wait()
    console.log('  ✅ MANUFACTURER_ROLE granted')

    // Grant DISTRIBUTOR_ROLE
    console.log('Granting DISTRIBUTOR_ROLE...')
    const tx2 = await contract.grantRole(DISTRIBUTOR_ROLE, defaultAddress)
    await tx2.wait()
    console.log('  ✅ DISTRIBUTOR_ROLE granted')

    // Grant PHARMACY_ROLE
    console.log('Granting PHARMACY_ROLE...')
    const tx3 = await contract.grantRole(PHARMACY_ROLE, defaultAddress)
    await tx3.wait()
    console.log('  ✅ PHARMACY_ROLE granted')

    // Grant DEFAULT_ADMIN_ROLE
    console.log('Granting DEFAULT_ADMIN_ROLE...')
    const tx4 = await contract.grantRole(DEFAULT_ADMIN_ROLE, defaultAddress)
    await tx4.wait()
    console.log('  ✅ DEFAULT_ADMIN_ROLE granted')

    console.log('\n🎉 All roles granted to default address:', defaultAddress)
  } catch (err) {
    console.error('Error granting roles:', err.message)
    console.log('You can grant roles manually using: npm run grant-all-roles')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})


