'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { 
  LoadingOverlay, 
  LoadingButton, 
  useNotificationSystem,
  ErrorBoundary,
  InlineError
} from '@/components/feedback'
import { ErrorHandler, ErrorFactory } from '@/lib/errors'

// Form validation schema
const mintFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
  category: z.string().min(1, 'Category is required'),
  file: z.instanceof(File, { message: 'Please select a file' })
})

type MintFormData = z.infer<typeof mintFormSchema>

interface EnhancedMintFormProps {
  onSuccess?: (nftId: string) => void
  onError?: (error: Error) => void
}

export function EnhancedMintForm({ onSuccess, onError }: EnhancedMintFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState<number>()
  const { showSuccess, showError, showTransactionNotification } = useNotificationSystem()

  const form = useForm<MintFormData>({
    resolver: zodResolver(mintFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    }
  })

  const handleMint = async (data: MintFormData) => {
    setIsLoading(true)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev === undefined) return 10
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Convert file to base64
      const fileBase64 = await ErrorHandler.handleAsync(
        () => fileToBase64(data.file),
        {
          context: { operation: 'file_conversion', fileName: data.file.name }
        }
      )

      setUploadProgress(100)
      clearInterval(progressInterval)

      // Show transaction pending notification
      showTransactionNotification({
        operation: 'mint',
        status: 'pending'
      })

      // Call mint API
      const response = await ErrorHandler.handleApiCall(
        async () => {
          const res = await fetch('/api/nft/mint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: data.name,
              description: data.description,
              category: data.category,
              file_data: fileBase64,
              file_name: data.file.name,
              file_type: data.file.type,
              recipient: '0x1234567890123456' // This would come from wallet context
            })
          })

          if (!res.ok) {
            const errorData = await res.json()
            throw ErrorFactory.fromError(new Error(errorData.error), {
              endpoint: '/api/nft/mint',
              statusCode: res.status,
              details: errorData
            })
          }

          return res.json()
        },
        '/api/nft/mint',
        {
          operation: 'mint_nft',
          nftName: data.name
        }
      )

      // Show success notification
      showTransactionNotification({
        operation: 'mint',
        status: 'success',
        nftId: response.nft_id,
        transactionId: response.transaction_hash
      })

      // Reset form
      form.reset()
      onSuccess?.(response.nft_id)

    } catch (error) {
      console.error('Mint error:', error)
      
      // Show error notification
      showTransactionNotification({
        operation: 'mint',
        status: 'failed',
        error: error instanceof Error ? ErrorHandler.handle(error) : undefined
      })

      onError?.(error instanceof Error ? error : new Error('Unknown error'))
    } finally {
      setIsLoading(false)
      setUploadProgress(undefined)
    }
  }

  return (
    <ErrorBoundary>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Mint New NFT</CardTitle>
        </CardHeader>
        
        <LoadingOverlay 
          isLoading={isLoading} 
          type="mint" 
          message="Creating your NFT..."
          progress={uploadProgress}
        >
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleMint)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter NFT name" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                      {fieldState.error && (
                        <InlineError error={fieldState.error.message} />
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your NFT" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                      {fieldState.error && (
                        <InlineError error={fieldState.error.message} />
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Art, Music, Gaming" 
                          {...field} 
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                      {fieldState.error && (
                        <InlineError error={fieldState.error.message} />
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="file"
                  render={({ field: { onChange, value, ...field }, fieldState }) => (
                    <FormItem>
                      <FormLabel>File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              // Validate file size (10MB limit)
                              if (file.size > 10 * 1024 * 1024) {
                                form.setError('file', {
                                  message: 'File size must be less than 10MB'
                                })
                                return
                              }
                              onChange(file)
                            }
                          }}
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {fieldState.error && (
                        <InlineError error={fieldState.error.message} />
                      )}
                    </FormItem>
                  )}
                />

                <LoadingButton
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Minting NFT..."
                  className="w-full"
                  disabled={!form.formState.isValid}
                >
                  Mint NFT
                </LoadingButton>
              </form>
            </Form>
          </CardContent>
        </LoadingOverlay>
      </Card>
    </ErrorBoundary>
  )
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to convert file to base64'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}