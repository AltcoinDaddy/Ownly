#!/usr/bin/env node

/**
 * Simple verification script to check sidebar hydration safety
 */

console.log('🔍 Verifying sidebar hydration fixes...')

// Check 1: Verify SafeCookies utility exists
try {
  const fs = require('fs')
  const safeCookiesPath = 'lib/hydration/safe-cookies.ts'
  
  if (fs.existsSync(safeCookiesPath)) {
    console.log('✅ SafeCookies utility exists')
    
    const content = fs.readFileSync(safeCookiesPath, 'utf8')
    if (content.includes('typeof document !== "undefined"')) {
      console.log('✅ SafeCookies has proper client-side checks')
    } else {
      console.log('❌ SafeCookies missing client-side checks')
    }
  } else {
    console.log('❌ SafeCookies utility not found')
  }
} catch (error) {
  console.log('❌ Error checking SafeCookies:', error.message)
}

// Check 2: Verify sidebar component uses hydration-safe patterns
try {
  const fs = require('fs')
  const sidebarPath = 'components/ui/sidebar.tsx'
  
  if (fs.existsSync(sidebarPath)) {
    console.log('✅ Sidebar component exists')
    
    const content = fs.readFileSync(sidebarPath, 'utf8')
    
    // Check for hydration-safe imports
    if (content.includes('useHydrated') && content.includes('SafeCookies') && content.includes('safeRandomWidth')) {
      console.log('✅ Sidebar imports all hydration utilities including safeRandomWidth')
    } else if (content.includes('useHydrated') && content.includes('SafeCookies')) {
      console.log('✅ Sidebar imports hydration utilities')
    } else {
      console.log('❌ Sidebar missing hydration utility imports')
    }
    
    // Check for proper cookie usage
    if (content.includes('SafeCookies.get') && content.includes('SafeCookies.set')) {
      console.log('✅ Sidebar uses SafeCookies for state persistence')
    } else {
      console.log('❌ Sidebar not using SafeCookies properly')
    }
    
    // Check for hydration-safe event listeners
    if (content.includes('useIsomorphicLayoutEffect') && content.includes('isHydrated')) {
      console.log('✅ Sidebar uses hydration-safe event listeners')
    } else {
      console.log('❌ Sidebar event listeners may cause hydration issues')
    }
    
    // Check for consistent skeleton widths
    if (content.includes('safeRandomWidth') && content.includes('useMemo')) {
      console.log('✅ Sidebar skeleton uses safeRandomWidth for consistent widths')
    } else if (content.includes('width = showIcon ? \'75%\' : \'65%\'')) {
      console.log('✅ Sidebar skeleton uses consistent widths')
    } else {
      console.log('❌ Sidebar skeleton may have inconsistent widths')
    }
    
  } else {
    console.log('❌ Sidebar component not found')
  }
} catch (error) {
  console.log('❌ Error checking sidebar component:', error.message)
}

// Check 3: Verify hydration index exports SafeCookies
try {
  const fs = require('fs')
  const indexPath = 'lib/hydration/index.ts'
  
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8')
    if (content.includes('SafeCookies')) {
      console.log('✅ SafeCookies exported from hydration index')
    } else {
      console.log('❌ SafeCookies not exported from hydration index')
    }
  }
} catch (error) {
  console.log('❌ Error checking hydration index:', error.message)
}

console.log('\n🎯 Sidebar hydration fixes verification complete!')
console.log('\nKey improvements made:')
console.log('• Created SafeCookies utility for SSR-safe cookie operations')
console.log('• Updated SidebarProvider to defer cookie loading until after hydration')
console.log('• Fixed event listeners to only attach after hydration')
console.log('• Made skeleton widths consistent to prevent hydration mismatches')
console.log('• Added proper client-side guards for all browser-dependent operations')