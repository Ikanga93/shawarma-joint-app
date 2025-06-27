import React, { useState } from 'react'
import { MapPin, Truck, Building, ChevronDown, Clock } from 'lucide-react'
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

  const formatHours = (location) => {
    if (location.type === LOCATION_TYPES.MOBILE) {
      return 'Check social media for schedule'
    }
    
    if (location.hours) {
      // Simple format for now - can be enhanced based on your hours data structure
      return location.hours.general || 'Mon-Sun: 11AM-9PM'
    }
    
    return 'Mon-Sun: 11AM-9PM'
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
            <h4>Choose Your Location</h4>
            <p>Select the location nearest to you</p>
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
                  <div className="location-card">
                    <div className="location-header">
                      <div className="location-title">
                        {getLocationIcon(location.type)}
                        <h5 className="restaurant-name">{location.name}</h5>
                      </div>
                      <span className={`status ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    
                    <div className="location-details">
                      {location.address && (
                        <div className="address-section">
                          <MapPin size={14} />
                          <span className="address-text">
                            {location.address.street}<br />
                            {location.address.city}, {location.address.state} {location.address.zip}
                          </span>
                        </div>
                      )}
                      
                      <div className="hours-section">
                        <Clock size={14} />
                        <span className="hours-text">
                          {formatHours(location)}
                        </span>
                      </div>
                      
                      {location.description && (
                        <div className="description-section">
                          <p className="location-description">
                            {location.description}
                          </p>
                        </div>
                      )}
                    </div>
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