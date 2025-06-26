/**
 * Storage utilities to handle localStorage/sessionStorage operations safely
 * and prevent QuotaExceededError
 */

// Helper function to safely store data in sessionStorage
export const safeSessionStorageSet = (key, data) => {
  try {
    // Create a version of the data without base64 images to save space
    const dataToCache = Array.isArray(data) ? data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          ...item,
          image_url: item.image_url && item.image_url.startsWith('data:') ? null : item.image_url
        }
      }
      return item
    }) : data
    
    sessionStorage.setItem(key, JSON.stringify(dataToCache))
    console.log(`✅ Successfully cached ${key} in sessionStorage`)
    return true
  } catch (error) {
    console.warn(`Failed to cache data in sessionStorage for key "${key}":`, error.message)
    
    // If storage is full, clear old cache and try again
    if (error.name === 'QuotaExceededError') {
      try {
        clearMenuCache()
        console.log('Cleared old menu cache due to storage quota')
        
        // Try again after clearing cache
        sessionStorage.setItem(key, JSON.stringify(dataToCache))
        console.log(`✅ Successfully cached ${key} in sessionStorage after clearing cache`)
        return true
      } catch (retryError) {
        console.warn('Failed to store data even after clearing cache:', retryError.message)
      }
    }
    return false
  }
}

// Helper function to safely get data from sessionStorage
export const safeSessionStorageGet = (key) => {
  try {
    const data = sessionStorage.getItem(key)
    const result = data ? JSON.parse(data) : null
    if (result) {
      console.log(`✅ Successfully retrieved ${key} from sessionStorage`)
    }
    return result
  } catch (error) {
    console.warn(`Failed to retrieve data from sessionStorage for key "${key}":`, error.message)
    return null
  }
}

// Helper function to safely store data in localStorage
export const safeLocalStorageSet = (key, data) => {
  try {
    // Create a version of the data without base64 images to save space
    const dataToCache = Array.isArray(data) ? data.map(item => {
      if (typeof item === 'object' && item !== null) {
        return {
          ...item,
          image_url: item.image_url && item.image_url.startsWith('data:') ? null : item.image_url
        }
      }
      return item
    }) : data
    
    localStorage.setItem(key, JSON.stringify(dataToCache))
    console.log(`✅ Successfully cached ${key} in localStorage`)
    return true
  } catch (error) {
    console.warn(`Failed to cache data in localStorage for key "${key}":`, error.message)
    
    // If storage is full, clear old cache and try again
    if (error.name === 'QuotaExceededError') {
      try {
        clearStorageCache()
        console.log('Cleared old storage cache due to storage quota')
        
        // Try again after clearing cache
        localStorage.setItem(key, JSON.stringify(dataToCache))
        console.log(`✅ Successfully cached ${key} in localStorage after clearing cache`)
        return true
      } catch (retryError) {
        console.warn('Failed to store data even after clearing cache:', retryError.message)
      }
    }
    return false
  }
}

// Helper function to safely get data from localStorage
export const safeLocalStorageGet = (key) => {
  try {
    const data = localStorage.getItem(key)
    const result = data ? JSON.parse(data) : null
    if (result) {
      console.log(`✅ Successfully retrieved ${key} from localStorage`)
    }
    return result
  } catch (error) {
    console.warn(`Failed to retrieve data from localStorage for key "${key}":`, error.message)
    return null
  }
}

// Clear menu-related cache from sessionStorage
export const clearMenuCache = () => {
  try {
    sessionStorage.removeItem('menuItems')
    sessionStorage.removeItem('menuItemsTimestamp')
    console.log('🧹 Menu cache cleared from sessionStorage')
  } catch (error) {
    console.warn('Failed to clear menu cache:', error.message)
  }
}

// Clear all non-essential cache from localStorage and sessionStorage
export const clearStorageCache = () => {
  try {
    // Clear menu cache
    clearMenuCache()
    
    // Clear other non-essential cached data (but preserve user auth data)
    const keysToPreserve = ['authToken', 'refreshToken', 'userData', 'cartItems', 'cart', 'adminAccessToken', 'adminRefreshToken', 'customerAccessToken', 'customerRefreshToken', 'currentUser']
    
    // Clear sessionStorage (except preserved keys)
    Object.keys(sessionStorage).forEach(key => {
      if (!keysToPreserve.includes(key)) {
        sessionStorage.removeItem(key)
      }
    })
    
    // Clear localStorage (except preserved keys)
    Object.keys(localStorage).forEach(key => {
      if (!keysToPreserve.includes(key)) {
        localStorage.removeItem(key)
      }
    })
    
    console.log('🧹 Storage cache cleared (preserved essential data)')
  } catch (error) {
    console.warn('Failed to clear storage cache:', error.message)
  }
}

// Get storage usage information
export const getStorageInfo = () => {
  try {
    const localStorageSize = new Blob(Object.values(localStorage)).size
    const sessionStorageSize = new Blob(Object.values(sessionStorage)).size
    
    return {
      localStorage: {
        size: localStorageSize,
        sizeFormatted: formatBytes(localStorageSize),
        itemCount: Object.keys(localStorage).length
      },
      sessionStorage: {
        size: sessionStorageSize,
        sizeFormatted: formatBytes(sessionStorageSize),
        itemCount: Object.keys(sessionStorage).length
      }
    }
  } catch (error) {
    console.warn('Failed to get storage info:', error.message)
    return null
  }
}

// Monitor and log storage usage (useful for debugging)
export const logStorageUsage = () => {
  const info = getStorageInfo()
  if (info) {
    console.log('📊 Storage Usage:')
    console.log(`  localStorage: ${info.localStorage.sizeFormatted} (${info.localStorage.itemCount} items)`)
    console.log(`  sessionStorage: ${info.sessionStorage.sizeFormatted} (${info.sessionStorage.itemCount} items)`)
    
    // Log individual items if storage is getting large
    if (info.localStorage.size > 1024 * 1024) { // > 1MB
      console.log('📋 Large localStorage items:')
      Object.keys(localStorage).forEach(key => {
        const itemSize = new Blob([localStorage.getItem(key)]).size
        if (itemSize > 100 * 1024) { // > 100KB
          console.log(`  ${key}: ${formatBytes(itemSize)}`)
        }
      })
    }
    
    if (info.sessionStorage.size > 1024 * 1024) { // > 1MB
      console.log('📋 Large sessionStorage items:')
      Object.keys(sessionStorage).forEach(key => {
        const itemSize = new Blob([sessionStorage.getItem(key)]).size
        if (itemSize > 100 * 1024) { // > 100KB
          console.log(`  ${key}: ${formatBytes(itemSize)}`)
        }
      })
    }
  }
}

// Format bytes to human readable format
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
} 