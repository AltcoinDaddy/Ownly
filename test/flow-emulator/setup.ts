import { spawn, ChildProcess } from 'child_process'
import { readFileSync } from 'fs'
import { resolve } from 'path'

export class FlowEmulator {
  private process: ChildProcess | null = null
  private isRunning = false

  async start(): Promise<void> {
    if (this.isRunning) {
      return
    }

    // Kill any existing emulator processes
    try {
      await this.executeCommand(['emulator', 'stop'])
    } catch {
      // Ignore errors if no emulator is running
    }

    return new Promise((resolve, reject) => {
      this.process = spawn('flow', ['emulator', 'start', '--verbose'], {
        stdio: 'pipe',
        cwd: process.cwd()
      })

      this.process.stdout?.on('data', (data) => {
        const output = data.toString()
        console.log(`Flow Emulator: ${output}`)
        
        // Check if emulator is ready - look for gRPC server start
        if (output.includes('Starting gRPC server') || 
            output.includes('🌱 Starting gRPC server')) {
          // Give it a moment to fully initialize
          setTimeout(() => {
            this.isRunning = true
            resolve()
          }, 2000)
        }
      })

      this.process.stderr?.on('data', (data) => {
        console.error(`Flow Emulator Error: ${data}`)
      })

      this.process.on('error', (error) => {
        console.error('Failed to start Flow emulator:', error)
        reject(error)
      })

      this.process.on('exit', (code) => {
        console.log(`Flow emulator exited with code ${code}`)
        this.isRunning = false
      })

      // Timeout after 30 seconds
      setTimeout(() => {
        if (!this.isRunning) {
          reject(new Error('Flow emulator failed to start within 30 seconds'))
        }
      }, 30000)
    })
  }

  async stop(): Promise<void> {
    if (this.process && this.isRunning) {
      this.process.kill('SIGTERM')
      this.isRunning = false
      
      // Wait for process to exit
      await new Promise((resolve) => {
        this.process?.on('exit', resolve)
        setTimeout(resolve, 5000) // Force resolve after 5 seconds
      })
    }
  }

  async deployContracts(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Flow emulator is not running')
    }

    // Deploy contracts in order
    const contracts = [
      'NonFungibleToken',
      'MetadataViews', 
      'DapperCollectibles',
      'DapperMarket'
    ]

    for (const contract of contracts) {
      await this.executeCommand(['project', 'deploy', '--network', 'emulator', contract])
    }
  }

  async setupTestAccounts(): Promise<void> {
    // Setup the emulator account first
    await this.executeTransaction('cadence/transactions/setup-test-accounts.cdc', [], 'emulator-account')
  }

  async mintTestNFTs(): Promise<void> {
    const testNFTs = [
      {
        recipient: '0xf8d6e0586b0a20c7', // emulator account
        name: 'Test NFT 1',
        description: 'First test NFT for emulator',
        thumbnail: 'https://example.com/nft1.png'
      },
      {
        recipient: '0xf8d6e0586b0a20c7', // emulator account
        name: 'Test NFT 2',
        description: 'Second test NFT for emulator',
        thumbnail: 'https://example.com/nft2.png'
      }
    ]

    for (const nft of testNFTs) {
      await this.executeTransaction(
        'cadence/transactions/mint-test-nfts.cdc',
        [nft.recipient, nft.name, nft.description, nft.thumbnail],
        'emulator-account'
      )
    }
  }

  private async executeCommand(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const childProcess = spawn('flow', args, {
        stdio: 'pipe',
        cwd: process.cwd()
      })

      let output = ''
      let error = ''

      childProcess.stdout?.on('data', (data) => {
        output += data.toString()
      })

      childProcess.stderr?.on('data', (data) => {
        error += data.toString()
      })

      childProcess.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error(`Command failed with code ${code}: ${error}`))
        }
      })
    })
  }

  private async executeTransaction(scriptPath: string, args: string[], signer: string): Promise<string> {
    const flowArgs = [
      'transactions', 'send',
      '--network', 'emulator',
      '--signer', signer,
      scriptPath,
      ...args
    ]

    return this.executeCommand(flowArgs)
  }

  async executeScript(scriptPath: string, args: string[] = []): Promise<any> {
    const flowArgs = [
      'scripts', 'execute',
      '--network', 'emulator',
      scriptPath,
      ...args
    ]

    const output = await this.executeCommand(flowArgs)
    
    try {
      return JSON.parse(output)
    } catch {
      return output.trim()
    }
  }
}

// Global emulator instance for tests
export const flowEmulator = new FlowEmulator()

// Test utilities
export const TEST_ACCOUNTS = {
  EMULATOR: '0xf8d6e0586b0a20c7',
  USER_1: '0x01cf0e2f2f715450',
  USER_2: '0x179b6b1cb6755e31'
}

export async function setupFlowEmulator() {
  console.log('Starting Flow emulator...')
  await flowEmulator.start()
  
  console.log('Deploying contracts...')
  await flowEmulator.deployContracts()
  
  console.log('Setting up test accounts...')
  await flowEmulator.setupTestAccounts()
  
  console.log('Minting test NFTs...')
  await flowEmulator.mintTestNFTs()
  
  console.log('Flow emulator setup complete!')
}

export async function teardownFlowEmulator() {
  console.log('Stopping Flow emulator...')
  await flowEmulator.stop()
}