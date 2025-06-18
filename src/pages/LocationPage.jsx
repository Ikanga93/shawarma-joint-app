import React from 'react'
import { ArrowLeft, MapPin, Navigation, Clock, Phone, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import ApiService from '../services/ApiService'
import './LocationPage.css'

const LocationPage = () => {
  // State for locations from admin dashboard
  const [scheduledLocations, setScheduledLocations] = React.useState([])
  const [liveLocations, setLiveLocations] = React.useState([])
  const [isLoadingScheduled, setIsLoadingScheduled] = React.useState(true)
  const [isLoadingLive, setIsLoadingLive] = React.useState(true)

  // Fetch both scheduled and live locations on component mount
  React.useEffect(() => {
    const fetchLocations = async () => {
      try {
        // Fetch scheduled locations from admin dashboard
        const scheduledData = await ApiService.getLocations()
        setScheduledLocations(scheduledData.filter(location => location.status === 'active'))
      } catch (error) {
        console.warn('Scheduled locations not available:', error)
        setScheduledLocations([])
      } finally {
        setIsLoadingScheduled(false)
      }
    }

    const fetchLiveLocations = async () => {
      try {
        // Fetch live locations from admin dashboard
        const liveData = await ApiService.getLiveLocations()
        setLiveLocations(liveData.filter(location => location.is_active))
      } catch (error) {
        console.warn('Live locations not available:', error)
        setLiveLocations([])
      } finally {
        setIsLoadingLive(false)
      }
    }

    fetchLocations()
    fetchLiveLocations()
  }, [])

  const openInMaps = (coordinates, address) => {
    // Check if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (coordinates && coordinates.lat && coordinates.lng) {
      if (isMobile) {
        // For mobile devices, use the universal maps URL that works with both iOS and Android
        const mapsUrl = `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&ll=${coordinates.lat},${coordinates.lng}&z=17`
        window.open(mapsUrl, '_blank')
      } else {
        // For desktop, open Google Maps in a new tab
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
        window.open(mapsUrl, '_blank')
      }
    } else {
      // Fallback to address search if no coordinates
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      window.open(mapsUrl, '_blank')
    }
  }

  const getCurrentDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[new Date().getDay()]
  }

  // Update today's location based on actual current day
  const currentDay = getCurrentDayName()
  const actualTodayLocation = scheduledLocations.find(schedule => schedule.day === currentDay)

  return (
    <div className="location-page">
      <div className="location-hero">
        <div className="container">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="location-page-title">Find Our Locations</h1>
          <p className="location-subtitle">
            Find us at our current locations and check our schedule for upcoming stops
          </p>
        </div>
      </div>

      {/* Live Locations Section */}
      {!isLoadingLive && liveLocations.length > 0 && (
        <div className="live-locations">
          <div className="container">
            <h2 className="live-locations-title">🚚 Food Trucks Right Now!</h2>
            <p className="live-locations-subtitle">
              Our trucks are currently at these locations
            </p>
            
            <div className="live-locations-grid">
              {liveLocations.map((liveLocation) => (
                <div key={liveLocation.id} className="live-location-card">
                  <div className="live-location-header">
                    <div className="live-badge">
                      <span className="live-indicator">●</span>
                      LIVE NOW
                    </div>
                    <h3 className="live-truck-name">{liveLocation.truck_name}</h3>
                  </div>
                  
                  <div className="live-location-content">
                    <div className="live-location-info">
                      <div className="info-item">
                        <MapPin className="info-icon" />
                        <span>{liveLocation.current_address}</span>
                      </div>
                      {liveLocation.hours_today && (
                        <div className="info-item">
                          <Clock className="info-icon" />
                          <span>{liveLocation.hours_today}</span>
                        </div>
                      )}
                      {liveLocation.description && (
                        <div className="info-item">
                          <span className="description">{liveLocation.description}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="live-location-actions">
                      {liveLocation.latitude && liveLocation.longitude ? (
                        <button 
                          className="btn btn-primary gps-btn"
                          onClick={() => openInMaps(
                            { lat: parseFloat(liveLocation.latitude), lng: parseFloat(liveLocation.longitude) }, 
                            liveLocation.current_address
                          )}
                        >
                          <Navigation size={20} />
                          Get Directions
                        </button>
                      ) : (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(liveLocation.current_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary gps-btn"
                        >
                          <Navigation size={20} />
                          Find on Maps
                        </a>
                      )}
                      <a href="tel:+12176078131" className="btn btn-secondary">
                        <Phone size={20} />
                        Call Us
                      </a>
                    </div>
                  </div>
                  
                  <div className="live-location-time">
                    Last updated: {new Date(liveLocation.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Locations */}
      {!isLoadingScheduled && scheduledLocations.length > 0 && (
        <div className="weekly-schedule">
          <div className="container">
            <h2 className="schedule-title">Our Locations</h2>
            <p className="schedule-subtitle">
              Find us at these scheduled locations
            </p>
            
            <div className="schedule-grid">
              {scheduledLocations.map((location) => (
                <div key={location.id} className="schedule-card">
                  <div className="schedule-header">
                    <h3 className="schedule-day">{location.name}</h3>
                    <span className="location-type">{location.type}</span>
                  </div>
                  
                  <div className="schedule-content">
                    {location.description && (
                      <p className="location-description">{location.description}</p>
                    )}
                    <div className="schedule-details">
                      {location.current_location && (
                        <div className="detail-item">
                          <MapPin size={16} />
                          <span>{location.current_location}</span>
                        </div>
                      )}
                      {location.schedule && (
                        <div className="detail-item">
                          <Clock size={16} />
                          <span>{location.schedule}</span>
                        </div>
                      )}
                      {location.phone && (
                        <div className="detail-item">
                          <Phone size={16} />
                          <span>{location.phone}</span>
                        </div>
                      )}
                    </div>
                    
                    {location.current_location && (
                      <button 
                        className="directions-btn"
                        onClick={() => openInMaps(null, location.current_location)}
                      >
                        <Navigation size={16} />
                        Directions
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(isLoadingScheduled || isLoadingLive) && (
        <div className="loading-section">
          <div className="container">
            <div className="loading-message">
              <p>Loading location information...</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingScheduled && !isLoadingLive && scheduledLocations.length === 0 && liveLocations.length === 0 && (
        <div className="empty-locations">
          <div className="container">
            <div className="empty-message">
              <MapPin size={48} />
              <h3>No locations available</h3>
              <p>We're currently updating our location information. Please check back soon or call us for current locations.</p>
              <a href="tel:+12176078131" className="btn btn-primary">
                <Phone size={20} />
                Call for Locations
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Contact Note */}
      <div className="schedule-note">
        <div className="container">
          <div className="note-content">
            <h3>📍 Can't find us?</h3>
            <p>
              Our schedule may change due to weather or special events. 
              Follow us on social media or call us for real-time updates!
            </p>
            <div className="contact-info">
              <a href="tel:+12176078131" className="contact-link">
                <Phone size={16} />
                (217) 607-8131
              </a>
              <a href="https://www.facebook.com/profile.php?id=100066724737090" target="_blank" rel="noopener noreferrer" className="contact-link">
                📱 Mo's Burritos Restaurant
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationPage 