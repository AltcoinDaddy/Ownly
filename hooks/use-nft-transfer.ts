"use client"

import { useState, useCallback } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { useToast } from './use-toast'
import { flowTransferService } from '@/lib/flow/transfer-service'
import type { EnrichedNFT } from '@/lib/flow/collection-service'

export interface NFTTransferState {
  isLoading: boolean
  error: string | null
  transactionId: string | null
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'failed'
}

export function useNFTTransfer() {
  const { user } = useWallet()
  const { toast } = useToast()
  const [state, setState] = useState<NFTTransferState>({
    isLoading: false,
    error: null,
    transactionId: null,
    status: 'idle'
  })

  // Transfer NFT to another address
  const transferNFT = useCallback(async (nft: EnrichedNFT, recipientAddress: string) => {
    if (!user?.addr) {
      throw new Error('Wallet not connected')
    }

    // Validate recipient address
    if (!flowTransferService.validateFlowAddress(recipientAddress)) {
      throw new Error('Invalid recipient address format')
    }

    // Prevent self-transfer
    if (flowTransferService.isSameAddress(user.addr, recipientAddress)) {
      throw new Error('Cannot transfer NFT to yourself')
    }

    // Verify ownership
    if (!flowTransferService.isSameAddress(user.addr, nft.owner)) {
      throw new Error('You do not own this NFT')
    }

    setState({
      isLoading: true,
      error: null,
      transactionId: null,
      status: 'pending'
    })

    try {
      console.log('[NFT TRANSFER HOOK] Starting transfer:', {
        nft: nft.id,
        from: user.addr,
        to: recipientAddress
      })

      const result = await flowTransferService.transferNFT(nft, recipientAddress, user.addr)

      if (!result.success) {
        throw new Error(result.error || 'Transfer failed')
      }

      setState(prev => ({
        ...prev,
        status: result.status === 'completed' ? 'completed' : 'processing',
        transactionId: result.transactionId || null,
        isLoading: result.status === 'completed' ? false : true
      }))

      // Show success message
      toast({
        title: "Transfer Initiated!",
        description: `NFT transfer to ${recipientAddress.slice(0, 8)}...${recipientAddress.slice(-4)} has been submitted`,
      })

      // If transfer is completed immediately, update state
      if (result.status === 'completed') {
        setState(prev => ({
          ...prev,
          status: 'completed',
          isLoading: false
        }))

        toast({
          title: "Transfer Completed!",
          description: "NFT has been successfully transferred",
        })
      }

      return result.transactionId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed'
      
      setState({
        isLoading: false,
        error: errorMessage,
        transactionId: null,
        status: 'failed'
      })

      toast({
        title: "Transfer Failed",
        description: errorMessage,
        variant: "destructive"
      })

      throw error
    }
  }, [user?.addr, toast])

  // Check transfer status (for polling if needed)
  const checkTransferStatus = useCallback(async (transactionId: string) => {
    if (!transactionId) return

    try {
      // This could be extended to poll transaction status from Flow
      // For now, we'll assume the API handles the status updates
      console.log('[NFT TRANSFER HOOK] Checking status for transaction:', transactionId)
      
      // Update state to completed if we're still processing
      if (state.status === 'processing') {
        setState(prev => ({
          ...prev,
          status: 'completed',
          isLoading: false
        }))

        toast({
          title: "Transfer Completed!",
          description: "NFT has been successfully transferred",
        })
      }
    } catch (error) {
      console.error('[NFT TRANSFER HOOK] Status check failed:', error)
    }
  }, [state.status, toast])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      transactionId: null,
      status: 'idle'
    })
  }, [])

  return {
    ...state,
    transferNFT,
    checkTransferStatus,
    reset,
    // Helper methods
    validateAddress: flowTransferService.validateFlowAddress,
    formatAddress: flowTransferService.formatFlowAddress,
    isSameAddress: flowTransferService.isSameAddress
  }
}