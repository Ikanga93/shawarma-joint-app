import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { Shield, Lock, User, MapPin, Building, Truck, Eye, EyeOff, Mail, Phone } from 'lucide-react'
import ApiService from '../services/ApiService'
import './AdminAuth.css'

const AdminLoginPage = () => {
  const navigate = useNavigate()
  const { login, error: authError } = useAdminAuth()
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginStep, setLoginStep] = useState('credentials') // 'credentials' or 'location'
  const [userLocations, setUserLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [loginResponse, setLoginResponse] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loginMethod, setLoginMethod] = useState('email') // 'email' or 'phone'

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'food_truck':
        return <Truck className="h-5 w-5" />
      case 'restaurant':
        return <Building className="h-5 w-5" />
      default:
        return <MapPin className="h-5 w-5" />
    }
  }

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Prepare credentials based on login method
      const credentials = {
        password: formData.password
      }
      
      if (loginMethod === 'email') {
        credentials.email = formData.email
      } else {
        credentials.phone = formData.phone
      }

      const response = await login(credentials)
      setLoginResponse(response)
      
      // Check if user has multiple locations
      if (response.assignedLocations && response.assignedLocations.length > 1) {
        setUserLocations(response.assignedLocations)
        setLoginStep('location')
        setLoading(false)
      } else if (response.assignedLocations && response.assignedLocations.length === 1) {
        // Auto-select single location and proceed
        await selectLocationAndProceed(response.assignedLocations[0].location_id)
      } else {
        // No locations assigned, proceed to dashboard
        navigate('/dashboard')
      }
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const selectLocationAndProceed = async (locationId) => {
    try {
      setLoading(true)
      // Update user's current location
      await ApiService.updateUserCurrentLocation(loginResponse.user.id, locationId)
      
      // Update localStorage with selected location
      const userInfo = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const selectedLocationData = userLocations.find(loc => loc.location_id === locationId)
      userInfo.currentLocation = {
        id: locationId,
        name: selectedLocationData?.location_name,
        type: selectedLocationData?.type,
        role: selectedLocationData?.role
      }
      localStorage.setItem('currentUser', JSON.stringify(userInfo))
      
      navigate('/dashboard')
    } catch (error) {
      setError('Failed to set working location. Please try again.')
      setLoading(false)
    }
  }

  const handleLocationSubmit = (e) => {
    e.preventDefault()
    if (!selectedLocation) {
      setError('Please select a location to work at today.')
      return
    }
    selectLocationAndProceed(selectedLocation)
  }

  return (
    <div className="admin-auth-container">
      <div className="admin-auth-card">
        <div className="admin-auth-header">
          <div className="admin-auth-icon">
            <Shield size={32} />
          </div>
          <h1 className="admin-auth-title">Admin Portal</h1>
          <p className="admin-auth-subtitle">Restaurant Management Dashboard</p>
        </div>

        {(error || authError) && (
          <div className="error-message">
            <Shield size={16} />
            {error || authError}
          </div>
        )}

        {loginStep === 'credentials' ? (
          <form onSubmit={handleCredentialsSubmit} className="admin-form">
            <div className="login-method-toggle">
              <button
                type="button"
                className={`login-method-btn ${loginMethod === 'email' ? 'active' : ''}`}
                onClick={() => setLoginMethod('email')}
              >
                <Mail size={16} />
                Email
              </button>
              <button
                type="button"
                className={`login-method-btn ${loginMethod === 'phone' ? 'active' : ''}`}
                onClick={() => setLoginMethod('phone')}
              >
                <Phone size={16} />
                Phone
              </button>
            </div>

            {loginMethod === 'email' ? (
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone className="input-icon" size={20} />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock className="input-icon" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Shield size={20} />
                  Access Dashboard
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="location-selection">
            <h2 className="location-selection-title">Choose Your Active Location</h2>
            <p className="location-selection-subtitle">
              Select which location you'll be managing today. You'll only receive orders for the selected location.
            </p>

            <div className="location-info-banner">
              <MapPin size={20} />
              <div>
                <strong>Important:</strong> Orders will only be routed to your selected location. 
                You can change this later from the dashboard.
              </div>
            </div>

            <div className="location-list">
              {userLocations.map((location) => (
                <div
                  key={location.location_id}
                  className={`location-item ${selectedLocation === location.location_id ? 'selected' : ''}`}
                  onClick={() => setSelectedLocation(location.location_id)}
                >
                  <div className={`location-icon ${location.type}`}>
                    {location.type === 'food_truck' ? (
                      <Truck size={20} />
                    ) : (
                      <Building size={20} />
                    )}
                  </div>
                  <div className="location-details">
                    <div className="location-name">{location.location_name}</div>
                    <div className="location-description">
                      {location.type === 'food_truck' ? 'Mobile Food Service' : 'Restaurant Location'}
                    </div>
                    <span className="location-role">{location.role}</span>
                  </div>
                  <div className="location-status">
                    {selectedLocation === location.location_id && (
                      <div className="active-indicator">
                        <div className="pulse-dot"></div>
                        Active
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleLocationSubmit}
              disabled={!selectedLocation || loading}
              className="submit-btn"
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Setting up location...
                </>
              ) : (
                <>
                  <MapPin size={20} />
                  Start Managing {selectedLocation && userLocations.find(l => l.location_id === selectedLocation)?.location_name}
                </>
              )}
            </button>
          </div>
        )}

        <div className="auth-footer">
          <div className="auth-footer-links">
            <Link to="/admin/register" className="auth-footer-link">
              <User size={16} />
              Request admin account
            </Link>
            <Link to="/" className="auth-footer-link">
              <MapPin size={16} />
              Back to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLoginPage