import { describe, it, expect, beforeEach } from 'vitest'
import { generateId } from '@/lib/utils'
import { safeDateNow, safeDateFromNow, safeRandom, safeGenerateId, initializeSafeRandom, resetIdCounter } from '@/lib/hydration/safe-random'

describe('Dynamic Content Generation Fixes', () => {
  beforeEach(() => {
    // Reset the random generator and ID counter for consistent tests
    initializeSafeRandom(12345)
    resetIdCounter()
  })

  describe('generateId function', () => {
    it('should generate consistent IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).toBeDefined()
      expect(id2).toBeDefined()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
    })

    it('should generate IDs in a predictable sequence', () => {
      resetIdCounter()
      const id1 = generateId()
      const id2 = generateId()
      const id3 = generateId()
      
      expect(id1).toBe('id-1')
      expect(id2).toBe('id-2')
      expect(id3).toBe('id-3')
    })
  })

  describe('safeDateNow function', () => {
    it('should return a consistent timestamp during SSR', () => {
      const timestamp1 = safeDateNow()
      const timestamp2 = safeDateNow()
      
      expect(timestamp1).toBe(timestamp2)
      expect(typeof timestamp1).toBe('number')
    })
  })

  describe('safeDateFromNow function', () => {
    it('should create consistent future dates', () => {
      const offset = 24 * 60 * 60 * 1000 // 1 day
      const futureDate1 = safeDateFromNow(offset)
      const futureDate2 = safeDateFromNow(offset)
      
      expect(futureDate1.getTime()).toBe(futureDate2.getTime())
      expect(futureDate1).toBeInstanceOf(Date)
    })
  })

  describe('safeRandom function', () => {
    it('should generate consistent random numbers', () => {
      initializeSafeRandom(12345)
      const random1 = safeRandom()
      
      initializeSafeRandom(12345)
      const random2 = safeRandom()
      
      expect(random1).toBe(random2)
      expect(random1).toBeGreaterThanOrEqual(0)
      expect(random1).toBeLessThan(1)
    })

    it('should generate different numbers in sequence', () => {
      initializeSafeRandom(12345)
      const random1 = safeRandom()
      const random2 = safeRandom()
      const random3 = safeRandom()
      
      expect(random1).not.toBe(random2)
      expect(random2).not.toBe(random3)
      expect(random1).not.toBe(random3)
    })
  })
})