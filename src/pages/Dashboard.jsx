import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import DashboardPage from './DashboardPage.jsx'

const Dashboard = () => {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Even if logout fails, redirect to login
      navigate('/admin/login')
    }
  }

  return <DashboardPage onLogout={handleLogout} />
}

export default Dashboard 