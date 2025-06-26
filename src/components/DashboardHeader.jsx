import React, { useState } from 'react'
import { LogOut, User, Home, BarChart3, Settings as SettingsIcon, Menu as MenuIcon, MapPin, Navigation, TrendingUp, ClipboardList, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useBusinessConfig } from '../context/BusinessContext'
import Logo from './Logo'
import './DashboardHeader.css'

const DashboardHeader = ({ onLogout, activeTab, onTabChange }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { config } = useBusinessConfig()
  const navigate = useNavigate()
  
  // Get admin user data from localStorage
  const getCurrentUser = () => {
    try {
      const userInfo = localStorage.getItem('currentUser')
      if (userInfo) {
        const user = JSON.parse(userInfo)
        // Create display name from available user data
        if (user.firstName && user.lastName) {
          return `${user.firstName} ${user.lastName}`
        } else if (user.firstName) {
          return user.firstName
        } else if (user.name) {
          return user.name
        } else if (user.email) {
          return user.email.split('@')[0] // Use email username as fallback
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
    return 'Admin' // Final fallback
  }
  
  const adminUser = getCurrentUser()

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  return (
    <header className="dashboard-header-nav">
      <div className="dashboard-header-content">
        <div className="dashboard-logo">
          <Logo size={40} />
          <div className="dashboard-logo-text">
            <h2>{config.businessName}</h2>
            <span>Admin Dashboard</span>
          </div>
        </div>

        <nav className="dashboard-nav-links">
          <button 
            className={`dashboard-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => onTabChange('orders')}
          >
            <BarChart3 size={18} />
            All Orders
          </button>
          <button 
            className={`dashboard-nav-btn ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => onTabChange('customers')}
          >
            <Users size={18} />
            Customers
          </button>
          <button 
            className={`dashboard-nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => onTabChange('menu')}
          >
            <MenuIcon size={18} />
            Menu
          </button>
          <button 
            className={`dashboard-nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => onTabChange('analytics')}
          >
            <TrendingUp size={18} />
            Analytics
          </button>
          <button 
            className={`dashboard-nav-btn ${activeTab === 'order-management' ? 'active' : ''}`}
            onClick={() => onTabChange('order-management')}
          >
            <ClipboardList size={18} />
            Order Management
          </button>
          <button 
            className={`dashboard-nav-btn ${activeTab === 'locations' ? 'active' : ''}`}
            onClick={() => onTabChange('locations')}
          >
            <MapPin size={18} />
            Locations
          </button>
          <button 
            className={`dashboard-nav-btn ${activeTab === 'live-locations' ? 'active' : ''}`}
            onClick={() => onTabChange('live-locations')}
          >
            <Navigation size={18} />
            Live Locations
          </button>
          <button 
            className={`dashboard-nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
          >
            <SettingsIcon size={18} />
            Settings
          </button>
        </nav>

        <div className="dashboard-profile">
          <div className="profile-dropdown">
            <button className="profile-btn" onClick={toggleProfileMenu}>
              <User size={20} />
              <span className="profile-name">{adminUser}</span>
            </button>
            {isProfileMenuOpen && (
              <div className="profile-menu">
                <div className="profile-info">
                  <User size={16} />
                  <span>Logged in as {adminUser}</span>
                </div>
                <hr />
                <Link 
                  to="/" 
                  className="profile-menu-item"
                  onClick={() => setIsProfileMenuOpen(false)}
                >
                  <Home size={16} />
                  View Website
                </Link>
                <button 
                  className="profile-menu-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader 