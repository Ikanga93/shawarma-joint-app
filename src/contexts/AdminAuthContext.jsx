import React, { createContext, useContext, useState } from 'react'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const register = async (userData) => {
    setError('Admin registration is being rebuilt for Supabase. Please use Supabase dashboard for admin management.')
    throw new Error('Admin registration temporarily unavailable')
  }

  const login = async (credentials) => {
    setError('Admin login is being rebuilt for Supabase. Please use Supabase dashboard for admin management.')
    throw new Error('Admin login temporarily unavailable')
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('adminAccessToken')
    localStorage.removeItem('adminRefreshToken')
    localStorage.removeItem('currentUser')
  }

  const refreshAccessToken = async () => {
    throw new Error('Token refresh temporarily unavailable')
  }

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    refreshAccessToken,
    setError
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
} 