import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { Shield, Lock, User, Mail, Phone, Eye, EyeOff, UserPlus } from 'lucide-react'
import './AdminAuth.css'

const AdminRegisterPage = () => {
  const navigate = useNavigate()
  const { register, error: authError } = useAdminAuth()
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: 'Weak' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Check password strength
    if (name === 'password') {
      const strength = calculatePasswordStrength(value)
      setPasswordStrength({ level: strength, text: getPasswordStrengthText(strength) })
    }
  }

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getPasswordStrengthText = (strength) => {
    if (strength <= 1) return 'Weak'
    if (strength <= 2) return 'Fair'
    if (strength <= 3) return 'Good'
    return 'Strong'
  }

  const isFormValid = () => {
    return formData.password === formData.confirmPassword && passwordStrength.level >= 3
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordStrength.level < 3) {
      setError('Please choose a stronger password')
      return
    }

    if (!formData.email && !formData.phone) {
      setError('Please provide either an email or phone number')
      return
    }

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
        role: 'admin' // Always admin for this registration page
      }

      // Remove empty fields
      const cleanData = Object.fromEntries(
        Object.entries(registrationData).filter(([_, value]) => value.trim() !== '')
      )

      await register(cleanData)
      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  return (
    <div className="admin-auth-container admin-register-container">
      <div className="admin-auth-card admin-register-card">
        <div className="admin-auth-header">
          <div className="admin-auth-icon">
            <UserPlus size={32} />
          </div>
          <h1 className="admin-auth-title">Join Our Team</h1>
          <p className="admin-auth-subtitle">Request admin access to manage restaurant operations</p>
        </div>

        {(error || authError) && (
          <div className="error-message">
            <Shield size={16} />
            {error || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="fullName" className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User className="input-icon" size={20} />
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="form-input"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail className="input-icon" size={20} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                placeholder="john@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <div style={{ position: 'relative' }}>
              <Phone className="input-icon" size={20} />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="form-input"
                placeholder="(555) 123-4567"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock className="input-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.password && (
              <div className="password-strength">
                <div className="password-strength-bar">
                  <div className={`password-strength-fill ${passwordStrength.level <= 1 ? 'weak' : passwordStrength.level <= 2 ? 'fair' : passwordStrength.level <= 3 ? 'good' : 'strong'}`}></div>
                </div>
                <div className={`password-strength-text ${passwordStrength.level <= 1 ? 'weak' : passwordStrength.level <= 2 ? 'fair' : passwordStrength.level <= 3 ? 'good' : 'strong'}`}>
                  {passwordStrength.text}
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock className="input-icon" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${formData.confirmPassword && formData.password !== formData.confirmPassword ? 'error' : ''}`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div className="error-message" style={{ marginTop: '8px', marginBottom: '0' }}>
                Passwords do not match
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid()}
            className="submit-btn"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Creating account...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                Request Access
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          <div className="auth-footer-links">
            <Link to="/admin/login" className="auth-footer-link">
              <Shield size={16} />
              Already have an account? Sign in
            </Link>
            <Link to="/" className="auth-footer-link">
              <User size={16} />
              Back to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminRegisterPage