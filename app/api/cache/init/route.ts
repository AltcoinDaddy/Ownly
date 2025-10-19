import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase, dbInitializer } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    // Initialize database with collections and indexes
    await initializeDatabase()
    
    // Get database statistics
    const stats = await dbInitializer.getDatabaseStats()
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      stats
    })
    
  } catch (error) {
    console.error('Error initializing database:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Health check
    const health = await dbInitializer.healthCheck()
    
    // Get database statistics
    const stats = await dbInitializer.getDatabaseStats()
    
    return NextResponse.json({
      health,
      stats
    })
    
  } catch (error) {
    console.error('Error checking database status:', error)
    
    return NextResponse.json({
      health: {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      },
      stats: null
    }, { status: 500 })
  }
}