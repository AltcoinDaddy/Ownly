"use client"

import { useState, useCallback } from 'react'
import { useFlowTransaction } from './use-flow-transaction'
import { useWallet } from '@/lib/wallet-context'
import { useToast } from './use-toast'
import { flowMarketplaceService } from '@/lib/flow/marketplace-service'

export interface MarketplaceTransactionState {
  isLoading: boolean
  error: string | null
  transactionId: string | null
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
}

export function useMarketplaceTransaction() {
  const { user } = useWallet()
  const { toast } = useToast()
  const [state, setState] = useState<MarketplaceTransactionState>({
    isLoading: false,
    error: null,
    transactionId: null,
    status: 'idle'
  })

  const flowTransaction = useFlowTransaction({
    onSuccess: (transactionId) => {
      setState(prev => ({
        ...prev,
        status: 'completed',
        transactionId,
        isLoading: false
      }))
    },
    onError: (error) => {
      setState(prev => ({
        ...prev,
        status: 'failed',
        error,
        isLoading: false
      }))
    },
    onStatusUpdate: (status) => {
      // Update state based on Flow transaction status
      if (status.status === 1) { // PENDING
        setState(prev => ({ ...prev, status: 'pending' }))
      } else if (status.status === 2 || status.status === 3) { // FINALIZED or EXECUTED
        setState(prev => ({ ...prev, status: 'processing' }))
      }
    }
  })

  // Purchase NFT
  const purchaseNFT = useCallback(async (nftId: string, seller: string, price: number) => {
    if (!user?.addr) {
      throw new Error('Wallet not connected')
    }

    setState({
      isLoading: true,
      error: null,
      transactionId: null,
      status: 'pending'
    })

    try {
      // Check balance first
      const hasBalance = await flowMarketplaceService.checkFlowBalance(user.addr, price.toString())
      if (!hasBalance) {
        throw new Error('Insufficient FLOW balance for this purchase')
      }

      // Execute Flow transaction
      const result = await flowMarketplaceService.purchaseNFT(
        nftId, 
        seller,
        (status) => {
          if (flowTransaction.status === 'processing') {
            setState(prev => ({ ...prev, status: 'processing' }))
          }
        }
      )

      if (result.status === 'failed') {
        throw new Error(result.error || 'Purchase failed')
      }

      setState(prev => ({
        ...prev,
        status: 'completed',
        transactionId: result.transactionId,
        isLoading: false
      }))

      toast({
        title: "Purchase Successful!",
        description: "NFT has been transferred to your wallet",
      })

      return result.transactionId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed'
      
      setState({
        isLoading: false,
        error: errorMessage,
        transactionId: null,
        status: 'failed'
      })

      toast({
        title: "Purchase Failed",
        description: errorMessage,
        variant: "destructive"
      })

      throw error
    }
  }, [user?.addr, toast, flowTransaction.status])

  // List NFT for sale
  const listNFT = useCallback(async (nftId: string, price: string) => {
    if (!user?.addr) {
      throw new Error('Wallet not connected')
    }

    setState({
      isLoading: true,
      error: null,
      transactionId: null,
      status: 'pending'
    })

    try {
      const result = await flowMarketplaceService.listNFTForSale(
        nftId, 
        price,
        (status) => {
          if (flowTransaction.status === 'processing') {
            setState(prev => ({ ...prev, status: 'processing' }))
          }
        }
      )

      if (result.status === 'failed') {
        throw new Error(result.error || 'Listing failed')
      }

      setState(prev => ({
        ...prev,
        status: 'completed',
        transactionId: result.transactionId,
        isLoading: false
      }))

      toast({
        title: "Listing Created!",
        description: "Your NFT is now available for purchase",
      })

      return result.transactionId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Listing failed'
      
      setState({
        isLoading: false,
        error: errorMessage,
        transactionId: null,
        status: 'failed'
      })

      toast({
        title: "Listing Failed",
        description: errorMessage,
        variant: "destructive"
      })

      throw error
    }
  }, [user?.addr, toast, flowTransaction.status])

  // Remove listing
  const removeListing = useCallback(async (nftId: string) => {
    if (!user?.addr) {
      throw new Error('Wallet not connected')
    }

    setState({
      isLoading: true,
      error: null,
      transactionId: null,
      status: 'pending'
    })

    try {
      const result = await flowMarketplaceService.removeListing(
        nftId,
        (status) => {
          if (flowTransaction.status === 'processing') {
            setState(prev => ({ ...prev, status: 'processing' }))
          }
        }
      )

      if (result.status === 'failed') {
        throw new Error(result.error || 'Remove listing failed')
      }

      setState(prev => ({
        ...prev,
        status: 'completed',
        transactionId: result.transactionId,
        isLoading: false
      }))

      toast({
        title: "Listing Removed!",
        description: "Your NFT is no longer for sale",
      })

      return result.transactionId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Remove listing failed'
      
      setState({
        isLoading: false,
        error: errorMessage,
        transactionId: null,
        status: 'failed'
      })

      toast({
        title: "Remove Listing Failed",
        description: errorMessage,
        variant: "destructive"
      })

      throw error
    }
  }, [user?.addr, toast, flowTransaction.status])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      transactionId: null,
      status: 'idle'
    })
    flowTransaction.reset()
  }, [flowTransaction])

  return {
    ...state,
    purchaseNFT,
    listNFT,
    removeListing,
    reset
  }
}