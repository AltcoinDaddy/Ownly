// NFT Transfer Service - Handles peer-to-peer NFT transfers

import type { EnrichedNFT } from './collection-service'

export interface TransferResult {
  success: boolean
  transactionId?: string
  status: 'pending' | 'completed' | 'failed'
  error?: string
}

export interface TransferRequest {
  nft_id: string
  from: string
  to: string
}

export interface TransferResponse {
  success: boolean
  transaction_hash?: string
  status?: 'pending' | 'completed' | 'failed'
  transferred_at?: string
  error?: string
  type?: string
  details?: any
  retry_after?: number
}

class FlowTransferService {
  private baseUrl = '/api/nft'

  // Transfer NFT via API
  async transferNFT(nft: EnrichedNFT, recipientAddress: string, fromAddress: string): Promise<TransferResult> {
    try {
      const request: TransferRequest = {
        nft_id: nft.id,
        from: fromAddress,
        to: recipientAddress
      }

      console.log('[TRANSFER SERVICE] Initiating transfer:', request)

      const response = await fetch(`${this.baseUrl}/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })

      const data: TransferResponse = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Transfer failed with status ${response.status}`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Transfer failed')
      }

      console.log('[TRANSFER SERVICE] Transfer successful:', data)

      return {
        success: true,
        transactionId: data.transaction_hash,
        status: data.status || 'pending'
      }
    } catch (error) {
      console.error('[TRANSFER SERVICE] Transfer failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed'
      
      return {
        success: false,
        status: 'failed',
        error: errorMessage
      }
    }
  }

  // Validate Flow address format
  validateFlowAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{16}$/.test(address)
  }

  // Format Flow address (ensure 0x prefix)
  formatFlowAddress(address: string): string {
    if (!address) return ''
    return address.startsWith('0x') ? address : `0x${address}`
  }

  // Check if addresses are the same
  isSameAddress(address1: string, address2: string): boolean {
    return address1.toLowerCase() === address2.toLowerCase()
  }
}

// Export singleton instance
export const flowTransferService = new FlowTransferService()