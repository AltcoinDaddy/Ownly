"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useNFTTransfer } from "@/hooks/use-nft-transfer"
import type { EnrichedNFT } from "@/lib/flow/collection-service"
import { 
  Send, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  Copy,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { SafeNavigator } from "@/lib/hydration"
import Image from "next/image"

interface TransferNFTModalProps {
  nft: EnrichedNFT | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTransfer?: (nft: EnrichedNFT, recipientAddress: string) => Promise<void>
  onTransferComplete?: () => void
}

export function TransferNFTModal({
  nft,
  open,
  onOpenChange,
  onTransfer,
  onTransferComplete
}: TransferNFTModalProps) {
  const [recipientAddress, setRecipientAddress] = useState("")
  const [addressError, setAddressError] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  
  const { transferNFT, isLoading: isTransferring, error } = useNFTTransfer()

  if (!nft) return null

  // Validate Flow address format
  const validateAddress = (address: string): boolean => {
    if (!address.trim()) {
      setAddressError("Address is required")
      return false
    }

    // Basic Flow address validation (0x prefix + 16 hex characters)
    const flowAddressRegex = /^0x[a-fA-F0-9]{16}$/
    if (!flowAddressRegex.test(address.trim())) {
      setAddressError("Invalid Flow address format (should be 0x followed by 16 hex characters)")
      return false
    }

    // Check if trying to transfer to self
    if (address.trim().toLowerCase() === nft.owner.toLowerCase()) {
      setAddressError("Cannot transfer to yourself")
      return false
    }

    setAddressError("")
    return true
  }

  const handleAddressChange = (value: string) => {
    setRecipientAddress(value)
    if (addressError) {
      validateAddress(value)
    }
  }

  const handleNext = () => {
    if (validateAddress(recipientAddress)) {
      setShowConfirmation(true)
    }
  }

  const handleConfirmTransfer = async () => {
    if (!nft) return

    try {
      // Use the provided transfer function or fallback to hook
      if (onTransfer) {
        await onTransfer(nft, recipientAddress.trim())
      } else {
        await transferNFT(nft, recipientAddress.trim())
      }
      
      // Call completion callback if provided
      if (onTransferComplete) {
        onTransferComplete()
      }
      
      // Close modal and reset
      onOpenChange(false)
      resetModal()
    } catch (error) {
      // Error handling is done in the hook or parent component
      console.error("Transfer failed:", error)
    }
  }

  const resetModal = () => {
    setRecipientAddress("")
    setAddressError("")
    setShowConfirmation(false)
  }

  const handleClose = () => {
    if (!isTransferring) {
      onOpenChange(false)
      resetModal()
    }
  }

  const copyAddress = async () => {
    const success = await SafeNavigator.copyToClipboard(recipientAddress)
    if (success) {
      toast.success("Address copied to clipboard")
    } else {
      toast.error("Failed to copy address")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Transfer NFT
          </DialogTitle>
          <DialogDescription>
            {showConfirmation 
              ? "Review and confirm the transfer details"
              : "Enter the recipient's Flow wallet address"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* NFT Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={nft.image || nft.thumbnail || "/placeholder.svg"}
                    alt={nft.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{nft.name}</h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {nft.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      #{nft.id}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {nft.collection_id}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {!showConfirmation ? (
            /* Address Input Step */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="recipient"
                    placeholder="0x1234567890abcdef"
                    value={recipientAddress}
                    onChange={(e) => handleAddressChange(e.target.value)}
                    className={`pl-10 ${addressError ? 'border-destructive' : ''}`}
                    disabled={isTransferring}
                  />
                </div>
                {addressError && (
                  <p className="text-sm text-destructive">{addressError}</p>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Make sure the recipient address is correct. NFT transfers cannot be reversed.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isTransferring}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1"
                  disabled={!recipientAddress.trim() || !!addressError || isTransferring}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : (
            /* Confirmation Step */
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">From:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {nft.owner.slice(0, 8)}...{nft.owner.slice(-6)}
                    </code>
                    <span className="text-xs text-muted-foreground">(You)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">To:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyAddress}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network:</span>
                  <Badge variant="secondary">Flow Blockchain</Badge>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  This transfer will be recorded on the Flow blockchain and cannot be undone.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1"
                  disabled={isTransferring}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmTransfer}
                  className="flex-1"
                  disabled={isTransferring}
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Confirm Transfer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Transaction Info */}
          <div className="text-xs text-muted-foreground text-center">
            <p>Gas fees will be paid by your connected wallet</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}