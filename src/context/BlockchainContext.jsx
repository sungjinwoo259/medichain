import { createContext, useContext, useEffect, useState } from 'react'
import {
  connectWallet as connectWalletService,
  getContractInstance,
} from '../services/web3Service.js'

const BlockchainContext = createContext(null)

export function BlockchainProvider({ children }) {
  const [wallet, setWallet] = useState(null)
  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)

  useEffect(() => {
    if (!wallet) return

    async function init() {
      try {
        const { provider: p } = await connectWalletService()
        const c = await getContractInstance(p)
        setProvider(p)
        setContract(c)
      } catch (err) {
        console.error('Failed to initialize contract:', err)
      }
    }

    init()
  }, [wallet])

  const connectWallet = async () => {
    try {
      const { address, provider: p } = await connectWalletService()
      setWallet(address)
      const c = await getContractInstance(p)
      setProvider(p)
      setContract(c)
    } catch (err) {
      console.error('Failed to connect wallet:', err)
      throw err
    }
  }

  return (
    <BlockchainContext.Provider
      value={{
        wallet,
        provider,
        contract,
        connectWallet,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  )
}

export function useBlockchain() {
  const ctx = useContext(BlockchainContext)
  if (!ctx) throw new Error('useBlockchain must be used within BlockchainProvider')
  return ctx
}


