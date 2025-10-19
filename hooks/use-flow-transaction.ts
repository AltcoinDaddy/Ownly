"use client"

import { useState, useCallback } from 'react'
import * as fcl from '@onflow/fcl'
import { useToast } from './use-toast'

export type TransactionStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed'

export interface FlowTransactionState {
  status: TransactionStatus
  transactionId: string | null
  error: string | null
  blockHeight?: number
  events?: any[]
}

export interface UseFlowTransactionOptions {
  onSuccess?: (transactionId: string) => void
  onError?: (error: string) => void
  onStatusUpdate?: (status: any) => void
}

export function useFlowTransaction(options: UseFlowTransactionOptions = {}) {
  const { toast } = useToast()
  const [state, setState] = useState<FlowTransactionState>({
    status: 'idle',
    transactionId: null,
    error: null
  })

  const executeTransaction = useCallback(async (
    cadence: string,
    args: any[] = [],
    limit: number = 9999
  ) => {
    try {
      setState({
        status: 'pending',
        transactionId: null,
        error: null
      })

      // Show wallet signature prompt
      toast({
        title: "Wallet Signature Required",
        description: "Please approve the transaction in your wallet",
      })

      // Execute the transaction
      const transactionId = await fcl.mutate({
        cadence,
        args,
        limit,
        authorizations: [fcl.currentUser().authorization],
      })

      setState(prev => ({
        ...prev,
        status: 'processing',
        transactionId
      }))

      toast({
        title: "Transaction Submitted",
        description: `Transaction ID: ${transactionId.slice(0, 8)}...`,
      })

      // Subscribe to transaction status updates
      const unsubscribe = fcl.tx(transactionId).subscribe((txStatus: any) => {
        console.log('Transaction status update:', txStatus)
        
        setState(prev => ({
          ...prev,
          blockHeight: txStatus.blockHeight,
          events: txStatus.events
        }))

        if (options.onStatusUpdate) {
          options.onStatusUpdate(txStatus)
        }

        // Handle final states
        if (txStatus.status === 4) { // SEALED
          setState(prev => ({
            ...prev,
            status: 'completed'
          }))

          toast({
            title: "Transaction Completed",
            description: "Your transaction has been successfully processed",
          })

          if (options.onSuccess) {
            options.onSuccess(transactionId)
          }

          unsubscribe()
        } else if (txStatus.status === -1) { // FAILED
          const errorMessage = txStatus.errorMessage || 'Transaction failed'
          
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: errorMessage
          }))

          toast({
            title: "Transaction Failed",
            description: errorMessage,
            variant: "destructive"
          })

          if (options.onError) {
            options.onError(errorMessage)
          }

          unsubscribe()
        }
      })

      return transactionId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed'
      
      setState({
        status: 'failed',
        transactionId: null,
        error: errorMessage
      })

      toast({
        title: "Transaction Error",
        description: errorMessage,
        variant: "destructive"
      })

      if (options.onError) {
        options.onError(errorMessage)
      }

      throw error
    }
  }, [toast, options])

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      transactionId: null,
      error: null
    })
  }, [])

  return {
    ...state,
    executeTransaction,
    reset,
    isLoading: state.status === 'pending' || state.status === 'processing'
  }
}