import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

const CustomerProtectedRoute = ({ children }) => {
  const { user, loading } = useCustomerAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    // Redirect to customer login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (user.role !== 'customer') {
    // If somehow a non-customer got here, redirect to home
    return <Navigate to="/" replace />
  }
  
  return children
}

export default CustomerProtectedRoute 