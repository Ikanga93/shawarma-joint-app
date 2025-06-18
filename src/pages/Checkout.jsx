import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useCart } from '../context/CartContext'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import ApiService from '../services/ApiService'

const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder'
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null

const CheckoutForm = () => {
  const { user } = useCustomerAuth()
  const { cartItems, clearCart } = useCart()
  const [customerInfo, setCustomerInfo] = useState({
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
    email: user?.email || '',
    phone: user?.phone || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/menu')
    }
  }, [cartItems, navigate])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create payment intent
      const { clientSecret } = await ApiService.createPaymentIntent({
        amount: Math.round(total * 100), // Convert to cents
        currency: 'usd',
        customerInfo,
        items: cartItems
      })

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone
          }
        }
      })

      if (stripeError) {
        setError(stripeError.message)
      } else if (paymentIntent.status === 'succeeded') {
        // Create order
        const orderData = {
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          items: cartItems,
          total: total,
          payment_intent_id: paymentIntent.id,
          status: 'pending'
        }

        const order = await ApiService.createOrder(orderData)
        clearCart()
        navigate(`/order-confirmation/${order.id}`)
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Payment failed. Please try again.')
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
              }}>Payment Information</h3>
              <div style={{
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: 'white'
              }}>
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                    },
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
              disabled={!stripe || loading}
              style={{
                width: '100%',
                background: loading || !stripe ? '#9ca3af' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                color: 'white',
                padding: '1rem 2rem',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: loading || !stripe ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const Checkout = () => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  )
}

export default Checkout 