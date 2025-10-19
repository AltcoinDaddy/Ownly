"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useWallet } from "@/lib/wallet-context"
import { Upload, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"
import Image from "next/image"
import { 
  validateMediaFile, 
  validateMetadata, 
  getFileCategory,
  SUPPORTED_MEDIA_TYPES,
  MAX_FILE_SIZE,
  type ValidationError 
} from "@/lib/flow/ipfs"
import { toast } from "sonner"
import type { MintFormData } from "@/lib/types"

// Minting progress states
type MintingStep = 'idle' | 'validating' | 'uploading' | 'minting' | 'success' | 'error'

interface MintingState {
  step: MintingStep
  progress: string
  error?: string
  nftId?: string
  transactionHash?: string
}

export default function MintPage() {
  const router = useRouter()
  const { isConnected, user, address } = useWallet()
  
  // Minting state management
  const [mintingState, setMintingState] = useState<MintingState>({
    step: 'idle',
    progress: ''
  })

  // Form data with enhanced validation
  const [formData, setFormData] = useState<MintFormData>({
    name: "",
    description: "",
    category: "",
    file: null,
    attributes: [{ trait_type: "", value: "" }],
    external_url: ""
  })

  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [retryCount, setRetryCount] = useState(0)

  // File handling with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Clear previous errors
    setValidationErrors([])

    // Validate file
    const fileErrors = validateMediaFile(file)
    if (fileErrors.length > 0) {
      setValidationErrors(fileErrors)
      return
    }

    // Update form data and preview
    setFormData({ ...formData, file })
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setFilePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Add/remove attribute fields
  const addAttribute = () => {
    setFormData({
      ...formData,
      attributes: [...formData.attributes, { trait_type: "", value: "" }]
    })
  }

  const removeAttribute = (index: number) => {
    const newAttributes = formData.attributes.filter((_, i) => i !== index)
    setFormData({ ...formData, attributes: newAttributes })
  }

  const updateAttribute = (index: number, field: 'trait_type' | 'value', value: string) => {
    const newAttributes = [...formData.attributes]
    newAttributes[index][field] = value
    setFormData({ ...formData, attributes: newAttributes })
  }

  // Convert file to base64 for API
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  // Enhanced form submission with Dapper Core API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first")
      return
    }

    if (!formData.file) {
      toast.error("Please upload a file")
      return
    }

    // Clear previous errors
    setValidationErrors([])
    setMintingState({ step: 'validating', progress: 'Validating form data...' })

    try {
      // Validate metadata
      const metadataErrors = validateMetadata({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        creator: address,
        collection_id: 'ownly_collectibles',
        attributes: formData.attributes.filter(attr => attr.trait_type && attr.value),
        external_url: formData.external_url
      })

      if (metadataErrors.length > 0) {
        setValidationErrors(metadataErrors)
        setMintingState({ step: 'error', progress: '', error: 'Please fix validation errors' })
        return
      }

      // Validate file again
      const fileErrors = validateMediaFile(formData.file)
      if (fileErrors.length > 0) {
        setValidationErrors(fileErrors)
        setMintingState({ step: 'error', progress: '', error: 'File validation failed' })
        return
      }

      setMintingState({ step: 'uploading', progress: 'Preparing file for upload...' })

      // Convert file to base64
      const fileBase64 = await fileToBase64(formData.file)

      setMintingState({ step: 'minting', progress: 'Minting NFT via Dapper Core API...' })

      // Prepare API request
      const mintRequest = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        creator: address,
        recipient: address,
        file_data: fileBase64,
        file_name: formData.file.name,
        file_type: formData.file.type,
        attributes: formData.attributes.filter(attr => attr.trait_type && attr.value),
        external_url: formData.external_url || undefined
      }

      console.log('[MINT] Calling mint API...')
      
      // Call mint API
      const response = await fetch('/api/nft/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mintRequest)
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Minting failed')
      }

      console.log('[MINT] Mint successful:', result)

      setMintingState({
        step: 'success',
        progress: 'NFT minted successfully!',
        nftId: result.nft_id,
        transactionHash: result.transaction_hash
      })

      toast.success("NFT minted successfully!")

      // Redirect after success
      setTimeout(() => {
        router.push("/profile")
      }, 3000)

    } catch (error) {
      console.error('[MINT] Minting error:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      
      setMintingState({
        step: 'error',
        progress: '',
        error: errorMessage
      })

      toast.error(`Minting failed: ${errorMessage}`)
    }
  }

  // Retry minting
  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setMintingState({ step: 'idle', progress: '' })
    setValidationErrors([])
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center py-16">
              <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="text-muted-foreground mb-8">You need to connect your wallet to mint NFTs</p>
              <Button size="lg">Connect Wallet</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Success state
  if (mintingState.step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center py-16">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-green-500" />
              <h1 className="text-4xl font-bold mb-4">NFT Minted Successfully!</h1>
              <p className="text-muted-foreground mb-6">
                Your NFT has been minted via Dapper Core API and stored on IPFS
              </p>
              
              {mintingState.nftId && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">NFT ID</p>
                  <p className="font-mono text-sm">{mintingState.nftId}</p>
                </div>
              )}
              
              {mintingState.transactionHash && (
                <div className="bg-muted/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground mb-2">Transaction Hash</p>
                  <p className="font-mono text-sm break-all">{mintingState.transactionHash}</p>
                </div>
              )}
              
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push("/profile")}>View in Profile</Button>
                <Button variant="outline" onClick={() => router.push("/marketplace")}>
                  Browse Marketplace
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Create Your NFT</h1>
              <p className="text-lg text-muted-foreground text-balance">
                Mint your digital collectible via Dapper Core API with IPFS storage
              </p>
            </div>

            {/* Display validation errors */}
            {validationErrors.length > 0 && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index}>• {error.message}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Display minting error */}
            {mintingState.step === 'error' && mintingState.error && (
              <Alert className="mb-6" variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{mintingState.error}</span>
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Form */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>NFT Details</CardTitle>
                      <CardDescription>Provide information about your digital collectible</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="e.g. Cosmic Dreams #001"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          maxLength={100}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.name.length}/100 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your NFT..."
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                          required
                          maxLength={1000}
                        />
                        <p className="text-xs text-muted-foreground">
                          {formData.description.length}/1000 characters
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Art">Art</SelectItem>
                            <SelectItem value="Photography">Photography</SelectItem>
                            <SelectItem value="Digital Art">Digital Art</SelectItem>
                            <SelectItem value="3D">3D</SelectItem>
                            <SelectItem value="Music">Music</SelectItem>
                            <SelectItem value="Gaming">Gaming</SelectItem>
                            <SelectItem value="Sports">Sports</SelectItem>
                            <SelectItem value="Collectibles">Collectibles</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="external_url">External URL (Optional)</Label>
                        <Input
                          id="external_url"
                          type="url"
                          placeholder="https://..."
                          value={formData.external_url}
                          onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Link to your website, portfolio, or additional content
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Attributes</CardTitle>
                      <CardDescription>Add custom properties to your NFT</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {formData.attributes.map((attribute, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`trait-${index}`}>Trait Type</Label>
                            <Input
                              id={`trait-${index}`}
                              placeholder="e.g. Color"
                              value={attribute.trait_type}
                              onChange={(e) => updateAttribute(index, 'trait_type', e.target.value)}
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label htmlFor={`value-${index}`}>Value</Label>
                            <Input
                              id={`value-${index}`}
                              placeholder="e.g. Blue"
                              value={attribute.value}
                              onChange={(e) => updateAttribute(index, 'value', e.target.value)}
                            />
                          </div>
                          {formData.attributes.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeAttribute(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAttribute}
                        className="w-full"
                      >
                        Add Attribute
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Upload & Preview */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Upload Media</CardTitle>
                      <CardDescription>
                        Supported: {SUPPORTED_MEDIA_TYPES.join(', ')} up to {MAX_FILE_SIZE / (1024 * 1024)}MB
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {filePreview ? (
                          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                            {formData.file && getFileCategory(formData.file) === 'video' ? (
                              <video
                                src={filePreview}
                                className="w-full h-full object-cover"
                                controls
                                muted
                              />
                            ) : (
                              <Image
                                src={filePreview || "/placeholder.svg"}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            )}
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={() => {
                                setFilePreview(null)
                                setFormData({ ...formData, file: null })
                                setValidationErrors([])
                              }}
                            >
                              Change
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground/50 transition-colors"
                          >
                            <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                            <p className="text-sm font-medium mb-1">Click to upload</p>
                            <p className="text-xs text-muted-foreground">or drag and drop</p>
                            <input
                              id="file-upload"
                              type="file"
                              accept={SUPPORTED_MEDIA_TYPES.join(',')}
                              className="hidden"
                              onChange={handleFileChange}
                              required
                            />
                          </label>
                        )}
                        
                        {formData.file && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <p>File: {formData.file.name}</p>
                            <p>Size: {(formData.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <p>Type: {getFileCategory(formData.file)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-base">Preview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="font-medium">{formData.name || "Untitled"}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Category</p>
                        <Badge variant="secondary">{formData.category || "Not selected"}</Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Creator</p>
                        <p className="text-sm font-mono text-xs">{address}</p>
                      </div>
                      {formData.attributes.filter(attr => attr.trait_type && attr.value).length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">Attributes</p>
                          <div className="space-y-1">
                            {formData.attributes
                              .filter(attr => attr.trait_type && attr.value)
                              .map((attr, index) => (
                                <div key={index} className="flex justify-between text-xs">
                                  <span>{attr.trait_type}:</span>
                                  <span className="font-medium">{attr.value}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Minting progress */}
                  {mintingState.step !== 'idle' && mintingState.step !== 'error' && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">{mintingState.progress}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full" 
                    disabled={mintingState.step !== 'idle' && mintingState.step !== 'error'}
                  >
                    {mintingState.step === 'idle' || mintingState.step === 'error' ? (
                      "Mint NFT"
                    ) : (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {mintingState.progress || "Processing..."}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    By minting, you agree to our Terms of Service and confirm that you own the rights to this content.
                    Your NFT will be uploaded to IPFS and minted via Dapper Core API.
                  </p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}