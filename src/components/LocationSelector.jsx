import React, { useState } from 'react'
import { MapPin, Truck, Building, ChevronDown } from 'lucide-react'
import { useBusinessConfig } from '../context/BusinessContext'
import { LOCATION_TYPES } from '../config/businessConfig'
import './LocationSelector.css'

const LocationSelector = () => {
  const { 
    activeLocations, 
    currentLocation, 
    switchLocation, 
    hasMultipleLocations,
    isLocationOpen 
  } = useBusinessConfig()
  
  const [isOpen, setIsOpen] = useState(false)

  if (!hasMultipleLocations) {
    return null // Don't show selector if only one location
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case LOCATION_TYPES.MOBILE:
        return <Truck size={16} />
      case LOCATION_TYPES.FIXED:
        return <Building size={16} />
      case LOCATION_TYPES.HYBRID:
        return <MapPin size={16} />
      default:
        return <MapPin size={16} />
    }
  }

  const getLocationStatus = (location) => {
    if (location.type === LOCATION_TYPES.MOBILE) {
      return { text: 'Mobile', color: 'blue' }
    }
    
    const isOpen = isLocationOpen(location.id)
    if (isOpen === null) {
      return { text: 'Check Schedule', color: 'gray' }
    }
    
    return isOpen 
      ? { text: 'Open Now', color: 'green' }
      : { text: 'Closed', color: 'red' }
  }

  return (
    <div className="location-selector">
      <button 
        className="location-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="current-location">
          {getLocationIcon(currentLocation?.type)}
          <span className="location-name">{currentLocation?.name}</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`chevron ${isOpen ? 'open' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="location-dropdown">
          <div className="dropdown-header">
            <h4>Choose Location</h4>
          </div>
          
          <div className="location-list">
            {activeLocations.map((location) => {
              const status = getLocationStatus(location)
              const isSelected = currentLocation?.id === location.id
              
              return (
                <button
                  key={location.id}
                  className={`location-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    switchLocation(location.id)
                    setIsOpen(false)
                  }}
                >
                  <div className="location-info">
                    <div className="location-header">
                      {getLocationIcon(location.type)}
                      <span className="location-name">{location.name}</span>
                      <span className={`status ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="location-description">
                      {location.description}
                    </p>
                    {location.address && (
                      <p className="location-address">
                        {location.address.street}, {location.address.city}
                      </p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default LocationSelector 