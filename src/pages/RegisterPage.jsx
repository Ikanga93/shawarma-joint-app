import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { UserPlus, Mail, Phone, Lock, User, AlertCircle } from 'lucide-react'
import '../styles/auth.css'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, error: authError } = useCustomerAuth()
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    fullName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Split full name into first and last name for backend compatibility
      const nameParts = formData.fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      // Prepare registration data
      const registrationData = {
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        firstName,
        lastName,
        role: 'customer' // Always customer for this registration page
      }

      // Remove empty fields
      const cleanData = Object.fromEntries(
        Object.entries(registrationData).filter(([_, value]) => value.trim() !== '')
      )

      await register(cleanData)
      // Always redirect customers to menu
      navigate('/menu')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-logo">
          <UserPlus />
        </div>
        <h1 className="auth-title">Join Shawarma Joint Family!</h1>
        <p className="auth-subtitle">
          Create your account for faster ordering and exclusive deals
        </p>
      </div>

      <div className="auth-form-container">
        <div className="auth-form-card">
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullName" className="form-label">
                <User size={16} />
                Full name <span className="required">*</span>
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <Mail size={16} />
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                <Phone size={16} />
                Phone number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                <Lock size={16} />
                Password <span className="required">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Create a secure password"
              />
            </div>

            {(error || authError) && (
              <div className="error-message">
                <AlertCircle size={16} />
                {error || authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-button auth-button-primary"
            >
              {loading ? (
                <>
                  <div className="loading-spinner"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
            <p className="auth-note">
              * Required fields. Either email or phone number must be provided.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage