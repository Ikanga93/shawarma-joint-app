import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/api'

const AdminAuthContext = createContext(null)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check for stored admin tokens on mount
    const accessToken = localStorage.getItem('adminAccessToken')
    const refreshToken = localStorage.getItem('adminRefreshToken')

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

      if (response.status === 403 || response.status === 401) {
        // Token might be expired, try to refresh
        console.log('Access token expired, attempting refresh...')
        try {
          const newToken = await refreshAccessToken()
          // Retry with new token
          const retryResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          })
          
          if (!retryResponse.ok) {
            throw new Error('Failed to fetch user after token refresh')
          }
          
          const userData = await retryResponse.json()
          
          // Only set user if they are an admin
          if (userData.role === 'admin') {
            setUser(userData)
          } else {
            // If not an admin, clear tokens
            localStorage.removeItem('adminAccessToken')
            localStorage.removeItem('adminRefreshToken')
          }
          return
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          // Clear tokens and continue with error handling
          localStorage.removeItem('adminAccessToken')
          localStorage.removeItem('adminRefreshToken')
          throw new Error('Session expired. Please log in again.')
        }
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const userData = await response.json()
      
      // Only set user if they are an admin
      if (userData.role === 'admin') {
        setUser(userData)
      } else {
        // If not an admin, clear tokens
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
      }
    } catch (error) {
      console.error('Error fetching admin user:', error)
      // Only clear storage if it's a session/auth error
      if (error.message.includes('Session expired') || error.message.includes('authentication')) {
        localStorage.removeItem('adminAccessToken')
        localStorage.removeItem('adminRefreshToken')
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setError(null)
      
      // Ensure role is admin
      const adminData = {
        ...userData,
        role: 'admin'
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(adminData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      // Verify the registered user is an admin
      if (data.user.role !== 'admin') {
        throw new Error('Invalid registration - not an admin account')
      }

      // Store admin tokens
      localStorage.setItem('adminAccessToken', data.accessToken)
      localStorage.setItem('adminRefreshToken', data.refreshToken)
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

      // Verify the logged in user is an admin
      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin credentials required.')
      }

      // Store admin tokens
      localStorage.setItem('adminAccessToken', data.accessToken)
      localStorage.setItem('adminRefreshToken', data.refreshToken)
      setUser(data.user)

      return data
    } catch (error) {
      setError(error.message)
      throw error
    }
  }

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken')
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminAccessToken')}`
          },
          body: JSON.stringify({ refreshToken })
        })
      }
    } catch (error) {
      console.error('Admin logout error:', error)
    } finally {
      // Clear admin storage and state regardless of API call success
      localStorage.removeItem('adminAccessToken')
      localStorage.removeItem('adminRefreshToken')
      setUser(null)
    }
  }

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken')
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

      // Verify refreshed user is still an admin
      if (data.user.role !== 'admin') {
        throw new Error('Invalid user role after refresh')
      }

      localStorage.setItem('adminAccessToken', data.accessToken)
      setUser(data.user)

      return data.accessToken
    } catch (error) {
      console.error('Admin token refresh error:', error)
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
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
} 