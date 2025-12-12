import { BrowserProvider, Contract } from 'ethers'
// ABI will be copied here after compilation: npm run setup-contract
// If you see an error, run: npm run compile && npm run copy-abi
import mediChainAbi from '../abis/MediChain.json'

const CONTRACT_ADDRESS = import.meta.env.VITE_MEDICHAIN_ADDRESS

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error('MetaMask not found')
  }
  const provider = new BrowserProvider(window.ethereum)
  const accounts = await provider.send('eth_requestAccounts', [])
  const address = accounts[0]
  return { provider, address }
}

export async function getContractInstance(provider) {
  if (!provider) {
    throw new Error('Provider is required to create contract instance')
  }
  
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not set. Please check VITE_MEDICHAIN_ADDRESS in .env file')
  }
  
  if (!mediChainAbi || !mediChainAbi.abi || !Array.isArray(mediChainAbi.abi)) {
    throw new Error('Contract ABI not found. Please run: npm run setup-contract')
  }
  
  const signer = await provider.getSigner()
  return new Contract(CONTRACT_ADDRESS, mediChainAbi.abi, signer)
}

export async function createBatchOnChain(contract, batchId, pointer) {
  if (!contract) {
    throw new Error('Contract instance is required. Please connect your wallet first.')
  }
  if (!batchId || !pointer) {
    throw new Error('Batch ID and pointer are required')
  }
  const tx = await contract.createBatch(batchId, pointer)
  await tx.wait()
  return tx
}

export async function transferBatchOnChain(contract, batchId, to, pointer) {
  if (!contract) {
    throw new Error('Contract instance is required. Please connect your wallet first.')
  }
  if (!batchId || !to || !pointer) {
    throw new Error('Batch ID, recipient address, and pointer are required')
  }
  const tx = await contract.transferBatch(batchId, to, pointer)
  await tx.wait()
  return tx
}

export async function addPrescriptionOnChain(contract, batchId, prescriptionPointer) {
  if (!contract) {
    throw new Error('Contract instance is required. Please connect your wallet first.')
  }
  if (!batchId || !prescriptionPointer) {
    throw new Error('Batch ID and prescription pointer are required')
  }
  const tx = await contract.addPrescription(batchId, prescriptionPointer)
  await tx.wait()
  return tx
}

export async function getHistory(contract, batchId) {
  if (!contract) return []
  // Using view function that returns in-contract events list
  const events = await contract.getEvents(batchId)
  return events.map((e) => ({
    eventType: e.eventType,
    actor: e.actor,
    timestamp: Number(e.timestamp),
    pointer: e.pointer,
  }))
}

// Check if an address has a specific blockchain role
export async function hasRoleOnChain(contract, role, address) {
  if (!contract || !address) {
    console.log('hasRoleOnChain: Missing contract or address', { contract: !!contract, address })
    return false
  }
  
  try {
    // Normalize address to checksum format
    const normalizedAddress = address.toLowerCase()
    
    let roleBytes32
    if (role === 'manufacturer') {
      roleBytes32 = await contract.MANUFACTURER_ROLE()
    } else if (role === 'distributor') {
      roleBytes32 = await contract.DISTRIBUTOR_ROLE()
    } else if (role === 'pharmacy') {
      roleBytes32 = await contract.PHARMACY_ROLE()
    } else {
      console.log('hasRoleOnChain: Invalid role', role)
      return false
    }
    
    // Use the original address format (contract expects checksum or lowercase)
    const hasRole = await contract.hasRole(roleBytes32, address)
    console.log('hasRoleOnChain result:', { role, address, hasRole, roleBytes32 })
    return hasRole
  } catch (err) {
    console.error('Error checking role:', err)
    return false
  }
}

// Grant blockchain role to an address (admin only)
export async function grantRoleOnChain(contract, role, address) {
  if (!contract) {
    throw new Error('Contract instance is required. Please connect your wallet first.')
  }
  if (!role || !address) {
    throw new Error('Role and address are required')
  }

  // Normalize address (Ethereum addresses are case-insensitive for comparison)
  const normalizedAddress = address.toLowerCase()

  // Get the role constant from the contract
  let roleBytes32
  if (role === 'manufacturer') {
    roleBytes32 = await contract.MANUFACTURER_ROLE()
  } else if (role === 'distributor') {
    roleBytes32 = await contract.DISTRIBUTOR_ROLE()
  } else if (role === 'pharmacy') {
    roleBytes32 = await contract.PHARMACY_ROLE()
  } else {
    throw new Error(`Invalid role: ${role}. Must be manufacturer, distributor, or pharmacy`)
  }

  console.log('Granting role:', { role, roleBytes32, address, normalizedAddress, contractAddress: contract.target })

  // Check if address already has the role (use original address format)
  const hasRole = await contract.hasRole(roleBytes32, address)
  console.log('Current role status:', { address, hasRole })
  if (hasRole) {
    return { hash: null, message: 'Address already has this role' }
  }

  // Grant the role (use original address format as contract expects)
  console.log('Sending grantRole transaction...')
  const tx = await contract.grantRole(roleBytes32, address)
  console.log('Transaction sent:', tx.hash)
  
  // Wait for confirmation
  const receipt = await tx.wait()
  console.log('Transaction confirmed:', receipt)
  
  // Verify the role was granted
  const hasRoleAfter = await contract.hasRole(roleBytes32, address)
  console.log('Role after grant:', { address, hasRoleAfter })
  
  if (!hasRoleAfter) {
    console.warn('⚠️ Role grant transaction succeeded but role check still returns false. This may be a timing issue.')
  }
  
  return tx
}


