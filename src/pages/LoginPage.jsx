import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { User, Mail, Phone, Lock, AlertCircle } from 'lucide-react'
import '../styles/auth.css'

const LoginPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, error: authError } = useCustomerAuth()
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Get redirect parameter from URL
  const redirectTo = searchParams.get('redirect')

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
      // Remove empty fields
      const credentials = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value.trim() !== '')
      )

      await login(credentials)
      
      // Redirect based on the redirect parameter or default to menu
      if (redirectTo === 'checkout') {
        // Redirect back to menu with checkout state preserved
        navigate('/menu', { state: { openCheckout: true } })
      } else {
        navigate('/menu')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleContinueAsGuest = () => {
    if (redirectTo === 'checkout') {
      // Redirect back to menu with checkout state preserved
      navigate('/menu', { state: { openCheckout: true } })
    } else {
      navigate('/menu')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-header">
        <div className="auth-logo">
          <User />
        </div>
        <h1 className="auth-title">Welcome back!</h1>
        <p className="auth-subtitle">
          Sign in to your account for faster ordering and exclusive deals
        </p>
      </div>

      <div className="auth-form-container">
        <div className="auth-form-card">
          <form className="auth-form" onSubmit={handleSubmit}>
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
                Phone number (alternative)
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
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="Enter your password"
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
                  Signing in...
                </>
              ) : (
                <>
                  <User size={18} />
                  Sign in
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="auth-button auth-button-secondary"
            >
              Continue as Guest
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Sign up here
              </Link>
            </p>
            <p className="auth-note">
              * Either email or phone number is required to sign in
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage