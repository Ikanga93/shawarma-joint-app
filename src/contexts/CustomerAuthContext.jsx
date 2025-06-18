import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/api'

const CustomerAuthContext = createContext(null)

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext)
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  }
  return context
}

export const CustomerAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for stored customer tokens on mount
    const accessToken = localStorage.getItem('customerAccessToken')
    const refreshToken = localStorage.getItem('customerRefreshToken')

    if (accessToken) {
      fetchUser(accessToken)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const userData = await response.json()
      
      // Only set user if they are a customer
      if (userData.role === 'customer') {
        setUser(userData)
      } else {
        // If not a customer, clear tokens
        localStorage.removeItem('customerAccessToken')
        localStorage.removeItem('customerRefreshToken')
      }
    } catch (error) {
      console.error('Error fetching customer user:', error)
      // If token is invalid, clear storage
      localStorage.removeItem('customerAccessToken')
      localStorage.removeItem('customerRefreshToken')
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      
      // Ensure role is customer
      const customerData = {
        ...userData,
        role: 'customer'
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Verify the registered user is a customer
      if (data.user.role !== 'customer') {
        throw new Error('Invalid registration - not a customer account')
      }

      // Store customer tokens
      localStorage.setItem('customerAccessToken', data.accessToken)
      localStorage.setItem('customerRefreshToken', data.refreshToken)
      setUser(data.user)

      return data
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const login = async (credentials) => {
    try {
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      // Verify the logged in user is a customer
      if (data.user.role !== 'customer') {
        throw new Error('Access denied. Customer credentials required.')
      }

      // Store customer tokens
      localStorage.setItem('customerAccessToken', data.accessToken)
      localStorage.setItem('customerRefreshToken', data.refreshToken)
      setUser(data.user)

      return data
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('customerRefreshToken')
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('customerAccessToken')}`
          },
          body: JSON.stringify({ refreshToken })
        })
      }
    } catch (error) {
      console.error('Customer logout error:', error)
    } finally {
      // Clear customer storage and state regardless of API call success
      localStorage.removeItem('customerAccessToken')
      localStorage.removeItem('customerRefreshToken')
      setUser(null)
    }
  }

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('customerRefreshToken')
      if (!refreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed')
      }

      // Verify refreshed user is still a customer
      if (data.user.role !== 'customer') {
        throw new Error('Invalid user role after refresh')
      }

      localStorage.setItem('customerAccessToken', data.accessToken)
      setUser(data.user)

      return data.accessToken
    } catch (error) {
      console.error('Customer token refresh error:', error)
      // If refresh fails, logout
      logout()
      throw error
    }
  }

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshAccessToken
  }

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  )
} 