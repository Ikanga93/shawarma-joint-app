import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'

const AdminProtectedRoute = ({ children }) => {
  const { user, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-white mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    // Redirect to admin login
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  if (user.role !== 'admin') {
    // If somehow a non-admin got here, redirect to admin login
    return <Navigate to="/admin/login" replace />
  }
  
  return children
}

export default AdminProtectedRoute 