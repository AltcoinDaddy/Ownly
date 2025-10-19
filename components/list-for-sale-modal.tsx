"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { EnrichedNFT } from "@/lib/flow/collection-service"
import { 
  Tag, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Loader2,
  TrendingUp,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

interface ListForSaleModalProps {
  nft: EnrichedNFT | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onListForSale?: (nft: EnrichedNFT, price: number, currency: string, duration?: number) => Promise<void>
}

export function ListForSaleModal({
  nft,
  open,
  onOpenChange,
  onListForSale
}: ListForSaleModalProps) {
  const [price, setPrice] = useState("")
  const [currency, setCurrency] = useState("FLOW")
  const [duration, setDuration] = useState("30") // days
  const [isListing, setIsListing] = useState(false)
  const [priceError, setPriceError] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)

  if (!nft) return null

  // Validate price input
  const validatePrice = (priceValue: string): boolean => {
    if (!priceValue.trim()) {
      setPriceError("Price is required")
      return false
    }

    const numPrice = parseFloat(priceValue)
    if (isNaN(numPrice) || numPrice <= 0) {
      setPriceError("Price must be a positive number")
      return false
    }

    if (numPrice < 0.001) {
      setPriceError("Minimum price is 0.001 FLOW")
      return false
    }

    if (numPrice > 1000000) {
      setPriceError("Maximum price is 1,000,000 FLOW")
      return false
    }

    setPriceError("")
    return true
  }

  const handlePriceChange = (value: string) => {
    // Only allow numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '')
    
    // Prevent multiple decimal points
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      return
    }
    
    // Limit decimal places to 6
    if (parts[1] && parts[1].length > 6) {
      return
    }

    setPrice(sanitized)
    if (priceError) {
      validatePrice(sanitized)
    }
  }

  const handleNext = () => {
    if (validatePrice(price)) {
      setShowConfirmation(true)
    }
  }

  const handleConfirmListing = async () => {
    if (!onListForSale) {
      toast.error("List for sale function not available")
      return
    }

    setIsListing(true)
    try {
      const numPrice = parseFloat(price)
      const numDuration = parseInt(duration)
      await onListForSale(nft, numPrice, currency, numDuration)
      toast.success("NFT listed for sale successfully!")
      onOpenChange(false)
      resetModal()
    } catch (error) {
      console.error("Listing failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to list NFT for sale")
    } finally {
      setIsListing(false)
    }
  }

  const resetModal = () => {
    setPrice("")
    setCurrency("FLOW")
    setDuration("30")
    setPriceError("")
    setShowConfirmation(false)
    setIsListing(false)
  }

  const handleClose = () => {
    if (!isListing) {
      onOpenChange(false)
      resetModal()
    }
  }

  const estimatedFees = parseFloat(price) * 0.025 // 2.5% marketplace fee

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            List NFT for Sale
          </DialogTitle>
          <DialogDescription>
            {showConfirmation 
              ? "Review and confirm the listing details"
              : "Set your price and listing duration"
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
            /* Pricing Step */
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="price"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className={`pl-10 pr-16 ${priceError ? 'border-destructive' : ''}`}
                    disabled={isListing}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Select value={currency} onValueChange={setCurrency} disabled={isListing}>
                      <SelectTrigger className="w-16 h-6 border-0 bg-transparent p-0 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FLOW">FLOW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {priceError && (
                  <p className="text-sm text-destructive">{priceError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Listing Duration</Label>
                <Select value={duration} onValueChange={setDuration} disabled={isListing}>
                  <SelectTrigger>
                    <Clock className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {price && !priceError && (
                <div className="space-y-2 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Listing price</span>
                    <span>{price} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Marketplace fee (2.5%)</span>
                    <span>-{estimatedFees.toFixed(6)} {currency}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span>You'll receive</span>
                    <span>{(parseFloat(price) - estimatedFees).toFixed(6)} {currency}</span>
                  </div>
                </div>
              )}

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Your NFT will be available for purchase immediately after listing.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isListing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1"
                  disabled={!price.trim() || !!priceError || isListing}
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
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">{price} {currency}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{duration} days</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Marketplace fee:</span>
                  <span>-{estimatedFees.toFixed(6)} {currency}</span>
                </div>

                <div className="flex items-center justify-between text-sm font-medium border-t pt-2">
                  <span>You'll receive:</span>
                  <span>{(parseFloat(price) - estimatedFees).toFixed(6)} {currency}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Expires:</span>
                  <span>
                    {new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  This listing will be recorded on the Flow blockchain and will incur gas fees.
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1"
                  disabled={isListing}
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmListing}
                  className="flex-1"
                  disabled={isListing}
                >
                  {isListing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Listing...
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4 mr-2" />
                      Confirm Listing
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