import React, { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { CreditCard, Lock, ArrowLeft } from 'lucide-react'
import ApiService from '../services/api'
import './StripeCheckout.css'

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key')

const CheckoutForm = ({ orderData, onSuccess, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    // Create payment intent when component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await ApiService.createPaymentIntent(
          orderData.total,
          orderData.tempOrderId
        )
        setClientSecret(response.clientSecret)
      } catch (error) {
        setError('Failed to initialize payment. Please try again.')
      }
    }

    createPaymentIntent()
  }, [orderData.total, orderData.tempOrderId])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    try {
      // Confirm payment
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: orderData.customerName,
              email: orderData.customerEmail,
              phone: orderData.customerPhone,
            },
          },
        }
      )

      if (paymentError) {
        setError(paymentError.message)
        setIsProcessing(false)
        return
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order in database
        const orderResponse = await ApiService.createOrder({
          ...orderData,
          paymentIntentId: paymentIntent.id
        })

        onSuccess(orderResponse.orderId, orderResponse.order)
      }
    } catch (error) {
      setError('Payment failed. Please try again.')
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'Fredoka, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <div className="checkout-form-container">
      <div className="checkout-header">
        <button className="back-btn" onClick={onCancel}>
          <ArrowLeft size={20} />
          Back to Cart
        </button>
        <h2>
          <Lock size={24} />
          Secure Payment
        </h2>
      </div>

      <div className="order-summary">
        <h3>Order Summary</h3>
        <div className="summary-items">
          {orderData.items.map((item, index) => (
            <div key={index} className="summary-item">
              <span>{item.quantity}x {item.name}</span>
              <span>${(item.quantity * item.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="summary-totals">
          <div className="summary-line">
            <span>Subtotal:</span>
            <span>${orderData.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-line">
            <span>Tax:</span>
            <span>${orderData.tax.toFixed(2)}</span>
          </div>
          <div className="summary-line total">
            <span>Total:</span>
            <span>${orderData.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="payment-form">
        <div className="form-section">
          <h3>
            <CreditCard size={20} />
            Payment Information
          </h3>
          
          <div className="card-element-container">
            <CardElement options={cardElementOptions} />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>

        <div className="customer-info">
          <h3>Customer Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <strong>Name:</strong> {orderData.customerName}
            </div>
            <div className="info-item">
              <strong>Phone:</strong> {orderData.customerPhone}
            </div>
            <div className="info-item">
              <strong>Email:</strong> {orderData.customerEmail || 'Not provided'}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="pay-button"
        >
          {isProcessing ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            <>
              <Lock size={18} />
              Pay ${orderData.total.toFixed(2)}
            </>
          )}
        </button>

        <div className="security-notice">
          <Lock size={16} />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </form>
    </div>
  )
}

const StripeCheckout = ({ orderData, onSuccess, onCancel }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        orderData={orderData}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  )
}

export default StripeCheckout 