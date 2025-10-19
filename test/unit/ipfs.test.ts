import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  uploadToIPFS,
  validateMediaFile,
  validateMetadata,
  processUploadedFile,
  createOwnlyMetadata,
  getFileCategory,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_VIDEO_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/flow/ipfs'
import { NFTStorage, File } from 'nft.storage'

// Mock NFT.Storage
vi.mock('nft.storage', () => ({
  NFTStorage: vi.fn(),
  File: vi.fn().mockImplementation((data, name, options) => ({
    name,
    type: options?.type || 'application/octet-stream',
    size: data.length || data.byteLength || 0,
    arrayBuffer: () => Promise.resolve(data),
  })),
}))

// Mock Flow config
vi.mock('@/lib/flow/config', () => ({
  NFT_STORAGE_API_KEY: 'test-api-key',
  IPFS_GATEWAY: 'https://nftstorage.link/ipfs/',
  OWNLY_COLLECTION_ID: 'ownly_collectibles',
}))

describe('IPFS Upload Service', () => {
  let mockNFTStorageInstance: any
  let mockStore: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockStore = vi.fn()
    mockNFTStorageInstance = {
      store: mockStore,
    }
    vi.mocked(NFTStorage).mockReturnValue(mockNFTStorageInstance)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('validateMediaFile', () => {
    it('should validate supported image files', () => {
      const validImageFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(validImageFile, 'size', { value: 1024 * 1024 }) // 1MB

      const errors = validateMediaFile(validImageFile)
      expect(errors).toHaveLength(0)
    })

    it('should validate supported video files', () => {
      const validVideoFile = new File(['test'], 'test.mp4', { type: 'video/mp4' })
      Object.defineProperty(validVideoFile, 'size', { value: 5 * 1024 * 1024 }) // 5MB

      const errors = validateMediaFile(validVideoFile)
      expect(errors).toHaveLength(0)
    })

    it('should reject unsupported file types', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(invalidFile, 'size', { value: 1024 })

      const errors = validateMediaFile(invalidFile)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('file')
      expect(errors[0].message).toContain('Unsupported file type')
    })

    it('should reject files that are too large', () => {
      const largeFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1 })

      const errors = validateMediaFile(largeFile)
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('file')
      expect(errors[0].message).toContain('File size too large')
    })

    it('should return multiple errors for invalid file', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      Object.defineProperty(invalidFile, 'size', { value: MAX_FILE_SIZE + 1 })

      const errors = validateMediaFile(invalidFile)
      expect(errors).toHaveLength(2)
      expect(errors.some(e => e.message.includes('Unsupported file type'))).toBe(true)
      expect(errors.some(e => e.message.includes('File size too large'))).toBe(true)
    })
  })

  describe('validateMetadata', () => {
    const validMetadata = {
      name: 'Test NFT',
      description: 'Test Description',
      category: 'Art',
      creator: '0x1234567890abcdef',
      collection_id: 'ownly_collectibles' as const,
    }

    it('should validate correct metadata', () => {
      const errors = validateMetadata(validMetadata)
      expect(errors).toHaveLength(0)
    })

    it('should require name field', () => {
      const errors = validateMetadata({ ...validMetadata, name: '' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('name')
      expect(errors[0].message).toBe('Name is required')
    })

    it('should limit name length', () => {
      const longName = 'a'.repeat(101)
      const errors = validateMetadata({ ...validMetadata, name: longName })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('name')
      expect(errors[0].message).toBe('Name must be less than 100 characters')
    })

    it('should require description field', () => {
      const errors = validateMetadata({ ...validMetadata, description: '' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('description')
      expect(errors[0].message).toBe('Description is required')
    })

    it('should limit description length', () => {
      const longDescription = 'a'.repeat(1001)
      const errors = validateMetadata({ ...validMetadata, description: longDescription })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('description')
      expect(errors[0].message).toBe('Description must be less than 1000 characters')
    })

    it('should require category field', () => {
      const errors = validateMetadata({ ...validMetadata, category: '' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('category')
      expect(errors[0].message).toBe('Category is required')
    })

    it('should require creator field', () => {
      const errors = validateMetadata({ ...validMetadata, creator: '' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('creator')
      expect(errors[0].message).toBe('Creator address is required')
    })

    it('should validate attributes if provided', () => {
      const metadataWithAttributes = {
        ...validMetadata,
        attributes: [
          { trait_type: 'Color', value: 'Blue' },
          { trait_type: '', value: 'Invalid' }, // Invalid trait_type
          { trait_type: 'Size', value: '' }, // Invalid value
        ],
      }

      const errors = validateMetadata(metadataWithAttributes)
      expect(errors).toHaveLength(2)
      expect(errors.some(e => e.field.includes('trait_type'))).toBe(true)
      expect(errors.some(e => e.field.includes('value'))).toBe(true)
    })
  })

  describe('uploadToIPFS', () => {
    const validFile = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' })
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 })

    const validMetadata = {
      name: 'Test NFT',
      description: 'Test Description',
      category: 'Art',
      creator: '0x1234567890abcdef',
      collection_id: 'ownly_collectibles' as const,
      image: validFile,
    }

    const mockNFTStorageResponse = {
      url: 'ipfs://QmTestHash123',
      data: {
        image: 'ipfs://QmImageHash456',
        animation_url: undefined,
      },
    }

    it('should successfully upload to IPFS', async () => {
      mockStore.mockResolvedValue(mockNFTStorageResponse)

      const result = await uploadToIPFS(validMetadata)

      expect(result).toEqual({
        ipfsHash: 'QmTestHash123',
        metadataUrl: 'https://nftstorage.link/ipfs/QmTestHash123/metadata.json',
        imageUrl: 'https://nftstorage.link/ipfs/QmImageHash456',
      })

      expect(mockStore).toHaveBeenCalledWith({
        name: validMetadata.name,
        description: validMetadata.description,
        image: validMetadata.image,
        properties: {
          category: validMetadata.category,
          creator: validMetadata.creator,
          collection_id: validMetadata.collection_id,
        },
      })
    })

    it('should include animation URL if present', async () => {
      const responseWithAnimation = {
        ...mockNFTStorageResponse,
        data: {
          ...mockNFTStorageResponse.data,
          animation_url: 'ipfs://QmAnimationHash789',
        },
      }
      mockStore.mockResolvedValue(responseWithAnimation)

      const result = await uploadToIPFS(validMetadata)

      expect(result.animationUrl).toBe('https://nftstorage.link/ipfs/QmAnimationHash789')
    })

    it('should include attributes in metadata if provided', async () => {
      const metadataWithAttributes = {
        ...validMetadata,
        attributes: [{ trait_type: 'Color', value: 'Blue' }],
      }
      mockStore.mockResolvedValue(mockNFTStorageResponse)

      await uploadToIPFS(metadataWithAttributes)

      expect(mockStore).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            attributes: [{ trait_type: 'Color', value: 'Blue' }],
          }),
        })
      )
    })

    it('should include external URL if provided', async () => {
      const metadataWithExternalUrl = {
        ...validMetadata,
        external_url: 'https://example.com/nft',
      }
      mockStore.mockResolvedValue(mockNFTStorageResponse)

      await uploadToIPFS(metadataWithExternalUrl)

      expect(mockStore).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            external_url: 'https://example.com/nft',
          }),
        })
      )
    })

    it('should throw error for invalid metadata', async () => {
      const invalidMetadata = {
        ...validMetadata,
        name: '', // Invalid name
      }

      await expect(uploadToIPFS(invalidMetadata)).rejects.toThrow(
        'Metadata validation failed: Name is required'
      )

      expect(mockStore).not.toHaveBeenCalled()
    })

    it('should throw error for invalid file', async () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const invalidMetadata = {
        ...validMetadata,
        image: invalidFile,
      }

      await expect(uploadToIPFS(invalidMetadata)).rejects.toThrow(
        'File validation failed: Unsupported file type'
      )

      expect(mockStore).not.toHaveBeenCalled()
    })

    it('should handle NFT.Storage errors', async () => {
      mockStore.mockRejectedValue(new Error('IPFS upload failed'))

      await expect(uploadToIPFS(validMetadata)).rejects.toThrow(
        'IPFS upload failed: IPFS upload failed'
      )
    })

    it('should throw error when NFT.Storage is not configured', async () => {
      // Mock missing API key
      vi.doMock('@/lib/flow/config', () => ({
        NFT_STORAGE_API_KEY: '',
        IPFS_GATEWAY: 'https://nftstorage.link/ipfs/',
        OWNLY_COLLECTION_ID: 'ownly_collectibles',
      }))

      // Re-import to get the mocked config
      const { uploadToIPFS: uploadWithoutKey } = await import('@/lib/flow/ipfs')

      await expect(uploadWithoutKey(validMetadata)).rejects.toThrow(
        'NFT.Storage API key not configured'
      )
    })
  })

  describe('processUploadedFile', () => {
    it('should process valid image file', async () => {
      const file = new File(['test image'], 'test.jpg', { type: 'image/jpeg' })
      Object.defineProperty(file, 'size', { value: 1024 })

      const result = await processUploadedFile(file)

      expect(result.fileInfo).toEqual({
        name: 'test.jpg',
        size: 1024,
        type: 'image/jpeg',
        isVideo: false,
        isImage: true,
      })
      expect(result.processedFile).toBeDefined()
    })

    it('should process valid video file', async () => {
      const file = new File(['test video'], 'test.mp4', { type: 'video/mp4' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const result = await processUploadedFile(file)

      expect(result.fileInfo).toEqual({
        name: 'test.mp4',
        size: 5 * 1024 * 1024,
        type: 'video/mp4',
        isVideo: true,
        isImage: false,
      })
    })

    it('should reject invalid file', async () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })

      await expect(processUploadedFile(file)).rejects.toThrow(
        'File validation failed: Unsupported file type'
      )
    })
  })

  describe('createOwnlyMetadata', () => {
    it('should create proper metadata structure', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const params = {
        name: '  Test NFT  ',
        description: '  Test Description  ',
        category: '  Art  ',
        creator: '  0x1234567890abcdef  ',
        image: file,
        attributes: [{ trait_type: 'Color', value: 'Blue' }],
        external_url: '  https://example.com  ',
      }

      const metadata = createOwnlyMetadata(params)

      expect(metadata).toEqual({
        name: 'Test NFT',
        description: 'Test Description',
        category: 'Art',
        creator: '0x1234567890abcdef',
        collection_id: 'ownly_collectibles',
        image: file,
        attributes: [{ trait_type: 'Color', value: 'Blue' }],
        external_url: 'https://example.com',
      })
    })

    it('should handle optional fields', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const params = {
        name: 'Test NFT',
        description: 'Test Description',
        category: 'Art',
        creator: '0x1234567890abcdef',
        image: file,
      }

      const metadata = createOwnlyMetadata(params)

      expect(metadata.attributes).toEqual([])
      expect(metadata.external_url).toBeUndefined()
    })
  })

  describe('getFileCategory', () => {
    it('should categorize image files correctly', () => {
      SUPPORTED_IMAGE_TYPES.forEach(type => {
        const file = new File(['test'], 'test', { type })
        expect(getFileCategory(file)).toBe('image')
      })
    })

    it('should categorize video files correctly', () => {
      SUPPORTED_VIDEO_TYPES.forEach(type => {
        const file = new File(['test'], 'test', { type })
        expect(getFileCategory(file)).toBe('video')
      })
    })

    it('should return unknown for unsupported files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      expect(getFileCategory(file)).toBe('unknown')
    })
  })

  describe('constants', () => {
    it('should define supported file types', () => {
      expect(SUPPORTED_IMAGE_TYPES).toContain('image/jpeg')
      expect(SUPPORTED_IMAGE_TYPES).toContain('image/png')
      expect(SUPPORTED_IMAGE_TYPES).toContain('image/gif')
      expect(SUPPORTED_IMAGE_TYPES).toContain('image/webp')

      expect(SUPPORTED_VIDEO_TYPES).toContain('video/mp4')
      expect(SUPPORTED_VIDEO_TYPES).toContain('video/webm')
      expect(SUPPORTED_VIDEO_TYPES).toContain('video/mov')
    })

    it('should define reasonable file size limit', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024) // 10MB
    })
  })
})