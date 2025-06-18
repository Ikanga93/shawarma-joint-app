import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, Clock, MapPin, Phone } from 'lucide-react'
import ApiService from '../services/ApiService'
import './OrderSuccessPage.css'

const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const sessionId = searchParams.get('session_id')
  const orderId = searchParams.get('order_id')

  useEffect(() => {
    const verifyPaymentAndGetOrder = async () => {
      try {
        if (!sessionId || !orderId) {
          throw new Error('Missing payment session or order ID')
        }

        // Verify payment with Stripe
        await ApiService.verifyPayment(sessionId, orderId)

        // Get order details
        const orderData = await ApiService.getOrder(orderId)
        setOrder(orderData)
      } catch (err) {
        console.error('Error verifying payment:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    verifyPaymentAndGetOrder()
  }, [sessionId, orderId])

  if (loading) {
    return (
      <div className="order-success-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Verifying your payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="order-success-page">
        <div className="error-container">
          <h2>Payment Verification Failed</h2>
          <p>{error}</p>
          <Link to="/" className="btn btn-primary">Return Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="order-success-page">
      <div className="success-container">
        <div className="success-header">
          <CheckCircle className="success-icon" />
          <h1>Payment Successful!</h1>
          <p>Thank you for your order. Your payment has been processed.</p>
        </div>

        {order && (
          <div className="order-details">
            <div className="order-info">
              <h2>Order Details</h2>
              <div className="order-meta">
                <div className="order-id">
                  <strong>Order ID:</strong> {order.id}
                </div>
                <div className="order-status">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div className="estimated-time">
                  <Clock className="icon" />
                  <span>Estimated time: {order.estimated_time} minutes</span>
                </div>
              </div>
            </div>

            <div className="customer-info">
              <h3>Customer Information</h3>
              <div className="customer-details">
                <p><strong>Name:</strong> {order.customer_name}</p>
                <p><Phone className="icon" /> {order.customer_phone}</p>
                {order.customer_email && (
                  <p><strong>Email:</strong> {order.customer_email}</p>
                )}
              </div>
            </div>

            <div className="order-items">
              <h3>Order Items</h3>
              <div className="items-list">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">x{item.quantity}</span>
                    </div>
                    <span className="item-price">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Tax:</span>
                  <span>${parseFloat(order.tax).toFixed(2)}</span>
                </div>
                <div className="total-row total-final">
                  <span>Total:</span>
                  <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <Link to={`/order-tracking/${order.id}`} className="btn btn-primary">
                Track Your Order
              </Link>
              <Link to="/menu" className="btn btn-secondary">
                Order Again
              </Link>
              <Link to="/" className="btn btn-outline">
                Return Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrderSuccessPage 