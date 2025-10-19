import { Db } from 'mongodb'
import { getDatabase } from './config'
import { COLLECTIONS, COLLECTION_INDEXES } from './schemas'

export class DatabaseInitializer {
  private db: Db | null = null

  private async getDb(): Promise<Db> {
    if (!this.db) {
      this.db = await getDatabase()
    }
    return this.db
  }

  // Initialize database with collections and indexes
  async initializeDatabase(): Promise<void> {
    console.log('Initializing database...')
    
    try {
      const db = await this.getDb()
      
      // Create collections if they don't exist
      await this.createCollections(db)
      
      // Create indexes for optimal performance
      await this.createIndexes(db)
      
      console.log('Database initialization completed successfully')
      
    } catch (error) {
      console.error('Error initializing database:', error)
      throw error
    }
  }

  // Create collections
  private async createCollections(db: Db): Promise<void> {
    const existingCollections = await db.listCollections().toArray()
    const existingNames = existingCollections.map(col => col.name)

    for (const collectionName of Object.values(COLLECTIONS)) {
      if (!existingNames.includes(collectionName)) {
        await db.createCollection(collectionName)
        console.log(`Created collection: ${collectionName}`)
      }
    }
  }

  // Create indexes for all collections
  private async createIndexes(db: Db): Promise<void> {
    for (const [collectionName, indexes] of Object.entries(COLLECTION_INDEXES)) {
      const collection = db.collection(collectionName)
      
      try {
        // Get existing indexes
        const existingIndexes = await collection.listIndexes().toArray()
        const existingIndexNames = existingIndexes.map(idx => idx.name)

        for (const indexSpec of indexes) {
          // Generate index name
          const indexName = this.generateIndexName(indexSpec.key)
          
          // Skip if index already exists
          if (existingIndexNames.includes(indexName)) {
            continue
          }

          // Create the index
          await collection.createIndex(indexSpec.key, {
            name: indexName,
            ...indexSpec
          })
          
          console.log(`Created index ${indexName} on collection ${collectionName}`)
        }
        
      } catch (error) {
        console.error(`Error creating indexes for collection ${collectionName}:`, error)
      }
    }
  }

  // Generate index name from key specification
  private generateIndexName(keySpec: Record<string, any>): string {
    return Object.entries(keySpec)
      .map(([field, direction]) => `${field}_${direction}`)
      .join('_')
  }

  // Drop all collections (for testing/reset)
  async dropAllCollections(): Promise<void> {
    console.log('Dropping all collections...')
    
    const db = await this.getDb()
    
    for (const collectionName of Object.values(COLLECTIONS)) {
      try {
        await db.collection(collectionName).drop()
        console.log(`Dropped collection: ${collectionName}`)
      } catch (error) {
        // Collection might not exist, ignore error
        console.log(`Collection ${collectionName} does not exist or already dropped`)
      }
    }
  }

  // Get database statistics
  async getDatabaseStats(): Promise<any> {
    const db = await this.getDb()
    
    const stats = {
      collections: {},
      totalSize: 0,
      totalDocuments: 0
    }

    for (const collectionName of Object.values(COLLECTIONS)) {
      try {
        const collection = db.collection(collectionName)
        const collectionStats = await collection.stats()
        
        stats.collections[collectionName] = {
          documents: collectionStats.count,
          size: collectionStats.size,
          indexes: collectionStats.nindexes
        }
        
        stats.totalDocuments += collectionStats.count
        stats.totalSize += collectionStats.size
        
      } catch (error) {
        // Collection might not exist
        stats.collections[collectionName] = {
          documents: 0,
          size: 0,
          indexes: 0
        }
      }
    }

    return stats
  }

  // Health check for database connection
  async healthCheck(): Promise<{ status: string; message: string; timestamp: Date }> {
    try {
      const db = await this.getDb()
      
      // Simple ping to check connection
      await db.admin().ping()
      
      return {
        status: 'healthy',
        message: 'Database connection is working',
        timestamp: new Date()
      }
      
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown database error',
        timestamp: new Date()
      }
    }
  }
}

// Export singleton instance
export const dbInitializer = new DatabaseInitializer()

// Convenience function to initialize database
export async function initializeDatabase(): Promise<void> {
  return await dbInitializer.initializeDatabase()
}