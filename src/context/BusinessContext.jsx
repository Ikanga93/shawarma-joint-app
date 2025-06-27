import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  businessConfig, 
  getActiveLocations, 
  getPrimaryLocation,
  hasMultipleLocations,
  isFoodTruckBusiness,
  isRestaurantBusiness 
} from '../config/businessConfig'

const BusinessContext = createContext()

export const useBusinessConfig = () => {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusinessConfig must be used within a BusinessProvider')
  }
  return context
}

export const BusinessProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [selectedLocationId, setSelectedLocationId] = useState(null)

  useEffect(() => {
    // Set primary location as default
    const primaryLocation = getPrimaryLocation()
    if (primaryLocation) {
      setCurrentLocation(primaryLocation)
      setSelectedLocationId(primaryLocation.id)
    }
  }, [])

  const switchLocation = (locationId) => {
    const activeLocations = getActiveLocations()
    const location = activeLocations.find(loc => loc.id === locationId)
    if (location) {
      setCurrentLocation(location)
      setSelectedLocationId(locationId)
    }
  }

  const value = {
    // Business configuration
    config: businessConfig,
    
    // Location management
    currentLocation,
    selectedLocationId,
    activeLocations: getActiveLocations(),
    switchLocation,
    
    // Business type helpers
    hasMultipleLocations: hasMultipleLocations(),
    isFoodTruckBusiness: isFoodTruckBusiness(),
    isRestaurantBusiness: isRestaurantBusiness(),
    
    // Utility functions
    getLocationHours: (locationId) => {
      const location = getActiveLocations().find(loc => loc.id === locationId)
      return location?.schedule?.hours || null
    },
    
    isLocationOpen: (locationId) => {
      const location = getActiveLocations().find(loc => loc.id === locationId)
      if (!location || location.schedule.type === 'variable') return null
      
      // Get current time in Central Time (America/Chicago)
      const now = new Date()
      const centralTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}))
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      const day = dayNames[centralTime.getDay()]
      const hours = location.schedule.hours[day]
      
      if (hours?.closed) return false
      
      const currentTime = centralTime.getHours() * 100 + centralTime.getMinutes()
      const openTime = parseInt(hours?.open?.replace(':', ''))
      const closeTime = parseInt(hours?.close?.replace(':', ''))
      
      return currentTime >= openTime && currentTime <= closeTime
    },
    
    getContactInfo: (locationId = null) => {
      if (locationId) {
        const location = getActiveLocations().find(loc => loc.id === locationId)
        return location?.contact || businessConfig.contact
      }
      return currentLocation?.contact || businessConfig.contact
    }
  }

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
} 