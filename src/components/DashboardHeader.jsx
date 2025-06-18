import React, { useState } from 'react'
import { LogOut, User, Home, BarChart3, Settings as SettingsIcon, Menu as MenuIcon, MapPin, Navigation, TrendingUp, ClipboardList } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useBusinessConfig } from '../context/BusinessContext'
import Logo from './Logo'
import './DashboardHeader.css'

const DashboardHeader = ({ onLogout, activeTab, onTabChange }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { config } = useBusinessConfig()
  const navigate = useNavigate()
  const adminUser = localStorage.getItem('adminUser') || 'Admin'

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