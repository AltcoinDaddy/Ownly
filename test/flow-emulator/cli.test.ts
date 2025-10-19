import { describe, it, expect } from 'vitest'
import { spawn } from 'child_process'

// Helper function to execute Flow CLI commands
async function executeFlowCommand(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const childProcess = spawn('flow', args, {
      stdio: 'pipe',
      cwd: process.cwd()
    })

    let stdout = ''
    let stderr = ''

    childProcess.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    childProcess.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    childProcess.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code || 0
      })
    })
  })
}

describe('Flow CLI Integration Tests', () => {
  it('should have Flow CLI installed and working', async () => {
    const result = await executeFlowCommand(['version'])
    
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Version:')
  })

  it('should validate flow.json configuration', async () => {
    const result = await executeFlowCommand(['project', 'validate'])
    
    expect(result.exitCode).toBe(0)
  })

  it('should be able to check contract syntax', async () => {
    // Test MetadataViews contract syntax
    const result = await executeFlowCommand([
      'cadence', 'lint', 
      'cadence/contracts/MetadataViews.cdc'
    ])
    
    if (result.exitCode !== 0) {
      console.log('STDOUT:', result.stdout)
      console.log('STDERR:', result.stderr)
    }
    
    expect(result.exitCode).toBe(0)
  })

  it('should be able to check DapperCollectibles contract syntax', async () => {
    const result = await executeFlowCommand([
      'cadence', 'lint',
      'cadence/contracts/DapperCollectibles.cdc'
    ])
    
    expect(result.exitCode).toBe(0)
  })

  it('should be able to check script syntax', async () => {
    const result = await executeFlowCommand([
      'cadence', 'lint',
      'cadence/scripts/get-collection.cdc'
    ])
    
    expect(result.exitCode).toBe(0)
  })
}, 30000) // 30 second timeout for CLI operations