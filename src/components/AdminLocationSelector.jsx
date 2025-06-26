import React, { useState, useEffect } from 'react'
import { MapPin, Truck, Building, ChevronDown, Check } from 'lucide-react'
import ApiService from '../services/ApiService'
import './AdminLocationSelector.css'

const AdminLocationSelector = ({ user, onLocationChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [currentLocation, setCurrentLocation] = useState(user?.currentLocation)

  useEffect(() => {
    fetchUserLocations()
  }, [user?.id])

  const fetchUserLocations = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      const userLocations = await ApiService.getUserLocations(user.id)
      setLocations(userLocations)
    } catch (error) {
      console.error('Error fetching user locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = async (location) => {
    try {
      setLoading(true)
      await ApiService.updateUserCurrentLocation(user.id, location.location_id)
      
      const newCurrentLocation = {
        id: location.location_id,
        name: location.location_name
      }
      
      setCurrentLocation(newCurrentLocation)
      setIsOpen(false)
      
      if (onLocationChange) {
        onLocationChange(newCurrentLocation)
      }
    } catch (error) {
      console.error('Error updating current location:', error)
      alert('Failed to update location. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Truck size={16} />
      case 'fixed':
        return <Building size={16} />
      default:
        return <MapPin size={16} />
    }
  }

  if (!user || user.role !== 'admin' || locations.length <= 1) {
    return null
  }

  return (
    <div className="admin-location-selector">
      <div className="location-selector-label">
        <MapPin size={14} />
        <span>Working Location:</span>
      </div>
      
      <div className="location-selector-dropdown">
        <button 
          className="location-selector-trigger"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
        >
          <div className="current-location">
            {currentLocation ? (
              <>
                {getLocationIcon(locations.find(l => l.location_id === currentLocation.id)?.type)}
                <span className="location-name">{currentLocation.name}</span>
              </>
            ) : (
              <span className="no-location">Select Location</span>
            )}
          </div>
          <ChevronDown 
            size={16} 
            className={`chevron ${isOpen ? 'open' : ''}`}
          />
        </button>

        {isOpen && (
          <div className="location-dropdown">
            <div className="dropdown-header">
              <h4>Select Working Location</h4>
            </div>
            
            <div className="location-list">
              {locations.map((location) => {
                const isSelected = currentLocation?.id === location.location_id
                
                return (
                  <button
                    key={location.location_id}
                    className={`location-option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleLocationSelect(location)}
                    disabled={loading}
                  >
                    <div className="location-info">
                      <div className="location-header">
                        {getLocationIcon(location.type)}
                        <span className="location-name">{location.location_name}</span>
                        {isSelected && <Check size={16} className="check-icon" />}
                      </div>
                      {location.description && (
                        <p className="location-description">
                          {location.description}
                        </p>
                      )}
                      <div className="location-role">
                        Role: <span className="role-badge">{location.role}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminLocationSelector
