import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useCart } from '../context/CartContext'
import { supabase } from '../lib/supabase'

const CheckoutForm = () => {
  const { user } = useCustomerAuth()
  const { cartItems, clearCart } = useCart()
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [pickupTime, setPickupTime] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const total = cartItems.reduce((sum, item) => {
    // Calculate item total including option prices
    let itemTotal = item.price * item.quantity
    
    // Add option prices if they exist
    if (item.selectedOptions) {
      Object.values(item.selectedOptions).forEach(option => {
        if (Array.isArray(option)) {
          // Multi-select options
          option.forEach(optionId => {
            // Find the option price (this would need to be stored with the option)
            // For now, we'll assume options don't add cost
          })
        }
      })
    }
    
    return sum + itemTotal
  }, 0)

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/menu')
    }
  }, [cartItems, navigate])

  // Generate pickup time options (next 2 hours in 15-minute intervals)
  const generatePickupTimes = () => {
    const times = []
    const now = new Date()
    const start = new Date(now.getTime() + 30 * 60000) // Start 30 minutes from now
    
    for (let i = 0; i < 8; i++) { // 8 slots = 2 hours
      const time = new Date(start.getTime() + i * 15 * 60000)
      times.push({
        value: time.toISOString(),
        label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })
    }
    
    return times
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to place an order.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create order in Supabase
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          total_amount: total,
          status: 'pending',
          pickup_time: pickupTime || null,
          special_instructions: specialInstructions || null
        })
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        emoji: item.emoji || '🍽️',
        selected_options: item.selectedOptions ? JSON.stringify(item.selectedOptions) : null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        throw itemsError
      }

      // Clear cart and redirect to success page
      clearCart()
      navigate(`/order-confirmation/${orderData.id}`)
      
    } catch (error) {
      console.error('Order creation error:', error)
      setError('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>Checkout</h1>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
          gap: '2rem',
          alignItems: 'start'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>Order Summary</h2>
            <div style={{ marginBottom: '1rem' }}>
              {cartItems.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#dc2626',
              textAlign: 'right',
              paddingTop: '1rem',
              borderTop: '2px solid #e5e7eb'
            }}>
              <strong>Total: ${total.toFixed(2)}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>Customer Information</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Phone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '1rem'
              }}>Pickup Information</h3>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Pickup Time</label>
                <select
                  id="pickupTime"
                  name="pickupTime"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select a pickup time</option>
                  {generatePickupTimes().map((time, index) => (
                    <option key={index} value={time.value}>{time.label}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{
                  display: 'block',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem'
                }}>Special Instructions</label>
                <textarea
                  id="specialInstructions"
                  name="specialInstructions"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!user || loading}
              style={{
                width: '100%',
                background: loading || !user ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: loading || !user ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const Checkout = () => {
  return (
    <CheckoutForm />
  )
}

export default Checkout 