import { NFTStorage, File } from "nft.storage"
import { NFT_STORAGE_API_KEY, IPFS_GATEWAY, OWNLY_COLLECTION_ID } from "./config"

// Initialize NFT.Storage client
const client = NFT_STORAGE_API_KEY ? new NFTStorage({ token: NFT_STORAGE_API_KEY }) : null

// Supported file types for NFT media
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/mov']
export const SUPPORTED_MEDIA_TYPES = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES]

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024

export interface OwnlyNFTMetadata {
  name: string
  description: string
  image: File
  category: string
  creator: string
  collection_id: typeof OWNLY_COLLECTION_ID
  attributes?: Array<{ trait_type: string; value: string | number }>
  external_url?: string
  animation_url?: string
}

export interface IPFSUploadResult {
  ipfsHash: string
  metadataUrl: string
  imageUrl: string
  animationUrl?: string
}

export interface ValidationError {
  field: string
  message: string
}

// Validate file type and size
export function validateMediaFile(file: File): ValidationError[] {
  const errors: ValidationError[] = []

  // Check file type
  if (!SUPPORTED_MEDIA_TYPES.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `Unsupported file type. Supported types: ${SUPPORTED_MEDIA_TYPES.join(', ')}`
    })
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push({
      field: 'file',
      message: `File size too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    })
  }

  return errors
}

// Validate metadata fields
export function validateMetadata(metadata: Omit<OwnlyNFTMetadata, 'image'>): ValidationError[] {
  const errors: ValidationError[] = []

  // Required fields validation
  if (!metadata.name || metadata.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (metadata.name.length > 100) {
    errors.push({ field: 'name', message: 'Name must be less than 100 characters' })
  }

  if (!metadata.description || metadata.description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required' })
  } else if (metadata.description.length > 1000) {
    errors.push({ field: 'description', message: 'Description must be less than 1000 characters' })
  }

  if (!metadata.category || metadata.category.trim().length === 0) {
    errors.push({ field: 'category', message: 'Category is required' })
  }

  if (!metadata.creator || metadata.creator.trim().length === 0) {
    errors.push({ field: 'creator', message: 'Creator address is required' })
  }

  // Validate attributes if provided
  if (metadata.attributes) {
    metadata.attributes.forEach((attr, index) => {
      if (!attr.trait_type || attr.trait_type.trim().length === 0) {
        errors.push({ 
          field: `attributes[${index}].trait_type`, 
          message: 'Attribute trait_type is required' 
        })
      }
      if (attr.value === undefined || attr.value === null || attr.value === '') {
        errors.push({ 
          field: `attributes[${index}].value`, 
          message: 'Attribute value is required' 
        })
      }
    })
  }

  return errors
}

// Upload NFT to IPFS with enhanced validation and metadata structure
export async function uploadToIPFS(metadata: OwnlyNFTMetadata): Promise<IPFSUploadResult> {
  if (!client) {
    throw new Error("NFT.Storage API key not configured")
  }

  // Validate metadata
  const metadataErrors = validateMetadata(metadata)
  if (metadataErrors.length > 0) {
    throw new Error(`Metadata validation failed: ${metadataErrors.map(e => e.message).join(', ')}`)
  }

  // Validate media file
  const fileErrors = validateMediaFile(metadata.image)
  if (fileErrors.length > 0) {
    throw new Error(`File validation failed: ${fileErrors.map(e => e.message).join(', ')}`)
  }

  try {
    console.log("[IPFS] Uploading Ownly collectible to IPFS...")

    // Prepare metadata for NFT.Storage
    const nftStorageMetadata = {
      name: metadata.name,
      description: metadata.description,
      image: metadata.image,
      properties: {
        category: metadata.category,
        creator: metadata.creator,
        collection_id: metadata.collection_id,
        ...(metadata.attributes && { attributes: metadata.attributes }),
        ...(metadata.external_url && { external_url: metadata.external_url }),
      },
      ...(metadata.animation_url && { animation_url: metadata.animation_url }),
    }

    // Store the NFT data
    const nftMetadata = await client.store(nftStorageMetadata)

    const ipfsHash = nftMetadata.url.replace("ipfs://", "")
    const metadataUrl = `${IPFS_GATEWAY}${ipfsHash}/metadata.json`
    const imageUrl = nftMetadata.data.image.toString().replace("ipfs://", IPFS_GATEWAY)
    
    const result: IPFSUploadResult = {
      ipfsHash,
      metadataUrl,
      imageUrl,
    }

    // Add animation URL if it exists
    if (nftMetadata.data.animation_url) {
      result.animationUrl = nftMetadata.data.animation_url.toString().replace("ipfs://", IPFS_GATEWAY)
    }

    console.log("[IPFS] Upload complete:", result)

    return result
  } catch (error) {
    console.error("[IPFS] Upload error:", error)
    throw new Error(`IPFS upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Get IPFS URL from hash
export function getIPFSUrl(hash: string): string {
  return `${IPFS_GATEWAY}${hash}`
}

// Convert browser File to NFT.Storage File format
export async function fileToNFTStorageFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer()
  return new File([buffer], file.name, { type: file.type })
}

// Process and validate uploaded file
export async function processUploadedFile(file: File): Promise<{
  processedFile: File
  fileInfo: {
    name: string
    size: number
    type: string
    isVideo: boolean
    isImage: boolean
  }
}> {
  // Validate the file
  const errors = validateMediaFile(file)
  if (errors.length > 0) {
    throw new Error(`File validation failed: ${errors.map(e => e.message).join(', ')}`)
  }

  // Convert to NFT.Storage format
  const processedFile = await fileToNFTStorageFile(file)

  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
    isVideo: SUPPORTED_VIDEO_TYPES.includes(file.type),
    isImage: SUPPORTED_IMAGE_TYPES.includes(file.type),
  }

  return { processedFile, fileInfo }
}

// Create metadata structure for Ownly collectibles
export function createOwnlyMetadata(params: {
  name: string
  description: string
  category: string
  creator: string
  image: File
  attributes?: Array<{ trait_type: string; value: string | number }>
  external_url?: string
}): OwnlyNFTMetadata {
  return {
    name: params.name.trim(),
    description: params.description.trim(),
    category: params.category.trim(),
    creator: params.creator.trim(),
    collection_id: OWNLY_COLLECTION_ID,
    image: params.image,
    attributes: params.attributes || [],
    external_url: params.external_url?.trim(),
  }
}

// Utility to get file type category
export function getFileCategory(file: File): 'image' | 'video' | 'unknown' {
  if (SUPPORTED_IMAGE_TYPES.includes(file.type)) return 'image'
  if (SUPPORTED_VIDEO_TYPES.includes(file.type)) return 'video'
  return 'unknown'
}
