import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ShoppingCart, User, ChevronDown, LogOut } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import Logo from './Logo'
import './Header.css'

const Header = ({ onCartOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { cartItems } = useCart()
  const { user, logout } = useCustomerAuth()
  const location = useLocation()

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsUserMenuOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-trigger') && !event.target.closest('.user-dropdown')) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <div className="logo-text">
              <div className="logo-brand">
                <Logo size={40} />
                <div className="brand-text">
                  <h1>Shawarma Joint</h1>
                  <span>Mediterranean Kitchen</span>
                </div>
              </div>
            </div>
          </Link>
          
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link 
              to="/" 
              className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/menu" 
              className={location.pathname === '/menu' ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              Menu
            </Link>
            <Link 
              to="/about" 
              className={location.pathname === '/about' ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/catering" 
              className={location.pathname === '/catering' ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              Catering
            </Link>
            <Link 
              to="/location" 
              className={location.pathname === '/location' ? 'nav-link active' : 'nav-link'}
              onClick={() => setIsMenuOpen(false)}
            >
              Find Us
            </Link>

            {/* Mobile Authentication */}
            <div className="mobile-auth">
              {user ? (
                <div className="mobile-user-menu">
                  <div className="mobile-user-info">
                    <User className="h-5 w-5" />
                    <span>{user.firstName || user.email}</span>
                  </div>
                  <Link
                    to="/orders"
                    onClick={() => setIsMenuOpen(false)}
                    className="mobile-menu-item"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mobile-menu-item mobile-logout"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="mobile-login-btn"
                  >
                    Log in
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="header-actions">
            {/* Desktop Authentication */}
            <div className="desktop-auth">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="user-menu-trigger"
                  >
                    <User className="h-5 w-5" />
                    <span className="user-name">
                      {user.firstName || user.email}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="user-dropdown">
                      <Link
                        to="/orders"
                        className="dropdown-item"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        My Orders
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false)
                          handleLogout()
                        }}
                        className="dropdown-item dropdown-logout"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="desktop-auth-buttons">
                  <Link to="/login" className="login-btn">
                    <span className="login-text">Log in</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <button 
              className="cart-btn"
              onClick={onCartOpen}
              aria-label="Open cart"
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="cart-count">{totalItems}</span>
              )}
            </button>

            {/* Mobile Menu Toggle - moved to the far right */}
            <button 
              className="menu-toggle"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 