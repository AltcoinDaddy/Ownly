import { MongoClient, Db } from 'mongodb'

// MongoDB connection configuration
export interface DatabaseConfig {
  uri: string
  dbName: string
  options?: {
    maxPoolSize?: number
    minPoolSize?: number
    maxIdleTimeMS?: number
    serverSelectionTimeoutMS?: number
  }
}

class DatabaseConnection {
  private client: MongoClient | null = null
  private db: Db | null = null
  private config: DatabaseConfig

  constructor() {
    this.config = {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
      dbName: process.env.MONGODB_DB_NAME || 'ownly_cache',
      options: {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
      }
    }
  }

  async connect(): Promise<Db> {
    if (this.db) {
      return this.db
    }

    try {
      this.client = new MongoClient(this.config.uri, this.config.options)
      await this.client.connect()
      this.db = this.client.db(this.config.dbName)
      
      console.log(`Connected to MongoDB database: ${this.config.dbName}`)
      return this.db
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error)
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close()
      this.client = null
      this.db = null
      console.log('Disconnected from MongoDB')
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.')
    }
    return this.db
  }

  isConnected(): boolean {
    return this.db !== null
  }
}

// Export singleton instance
export const dbConnection = new DatabaseConnection()

// Helper function to get database instance
export async function getDatabase(): Promise<Db> {
  return await dbConnection.connect()
}