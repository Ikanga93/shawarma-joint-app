import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, ChefHat, Bell, MapPin, AlertCircle } from 'lucide-react'
import { useSearchParams, useParams } from 'react-router-dom'
import ApiService from '../services/api'
import SocketService from '../services/socket'
import './OrderTrackingPage.css'

const OrderTrackingPage = () => {
  const [searchParams] = useSearchParams()
  const { orderId: urlOrderId } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Get order ID from URL path parameter, query parameter, or localStorage
  const orderId = urlOrderId || searchParams.get('order_id') || searchParams.get('orderId') || localStorage.getItem('currentOrderId')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('No order ID provided')
        setIsLoading(false)
        return
      }

      try {
        // If we have a session ID, verify payment first
        if (sessionId && !paymentVerified) {
          console.log('Verifying payment for session:', sessionId)
          try {
            await ApiService.verifyPayment(sessionId, orderId)
            setPaymentVerified(true)
            console.log('Payment verified successfully')
          } catch (paymentError) {
            console.error('Payment verification failed:', paymentError)
            // Continue loading order even if payment verification fails
          }
        }

        // Connect to Socket.IO for real-time updates
        SocketService.connect()
        SocketService.joinOrderTracking(orderId)

        // Load order data
        const orderData = await ApiService.getOrder(orderId)
        setOrder(orderData)
        setIsLoading(false)

        // Set up real-time listener for order updates
        SocketService.onOrderStatusUpdated((updatedOrder) => {
          if (updatedOrder.id === orderId) {
            console.log('Order status updated:', updatedOrder)
            setOrder(updatedOrder)
          }
        })

      } catch (error) {
        console.error('Error loading order:', error)
        setError('Failed to load order. Please check your order ID.')
        setIsLoading(false)
      }
    }

    loadOrder()

    // Cleanup on unmount
    return () => {
      SocketService.removeListener('order-status-updated')
      SocketService.disconnect()
    }
  }, [orderId, sessionId, paymentVerified])

  // Helper function to get current time in Central Time
  const getCurrentCentralTime = () => {
    const now = new Date()
    // Convert UTC to Central Time (CST/CDT)
    const centralTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}))
    return centralTime
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Chicago'
    })
  }

  const getEstimatedTimeRemaining = (order) => {
    if (!order) return null
    
    // Use time_remaining from server if available (admin dashboard sets this)
    if (order.time_remaining !== undefined && order.time_remaining !== null && order.time_remaining > 0) {
      const minutes = Math.floor(order.time_remaining)
      const seconds = Math.floor((order.time_remaining % 1) * 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    
    const estimatedTime = order.estimated_time || 25 // Default to 25 minutes to match confirmation
    
    // For different statuses, calculate differently
    if (order.status === 'confirmed') {
      // Order is confirmed but not cooking yet - show full estimated time
      return `${estimatedTime}:00`
    } else if (order.status === 'cooking') {
      // Calculate based on order date for cooking status using currentTime for real-time updates
      const orderTime = new Date(order.order_date || order.orderTime || order.order_time)
      const now = currentTime // Use currentTime state for real-time updates
      const estimatedReady = new Date(orderTime.getTime() + estimatedTime * 60000)
      const remaining = Math.max(0, Math.floor((estimatedReady.getTime() - now.getTime()) / 1000))
      
      if (remaining <= 0) return 'Ready now!'
      
      const minutes = Math.floor(remaining / 60)
      const seconds = remaining % 60
      
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    } else if (order.status === 'ready') {
      return 'Ready now!'
    } else {
      // For other statuses, show estimated time
      return `${estimatedTime}:00`
    }
  }

  const getProgressPercentage = (order) => {
    if (!order) return 0
    
    // Base progress on order status
    switch (order.status) {
      case 'pending_payment':
        return 0
      case 'confirmed':
        return 10 // Order is confirmed, minimal progress
      case 'cooking': {
        // Calculate progress based on cooking time using currentTime for real-time updates
        const estimatedTime = order.estimated_time || 25 // Default to 25 minutes
        const orderTime = new Date(order.order_date || order.orderTime || order.order_time)
        const now = currentTime // Use currentTime state for real-time updates
        const elapsed = Math.max(0, (now.getTime() - orderTime.getTime()) / 1000 / 60) // elapsed time in minutes
        
        // Start progress at 10% (confirmed) and go to 90% (almost ready)
        const cookingProgress = Math.min(80, Math.max(0, (elapsed / estimatedTime) * 80))
        return Math.round(10 + cookingProgress) // 10% to 90%
      }
      case 'ready':
        return 100
      case 'completed':
        return 100
      default:
        return 0
    }
  }

  const getElapsedTime = (order) => {
    if (!order) return null
    
    const orderTime = new Date(order.order_date || order.orderTime || order.order_time)
    const now = new Date()
    const elapsed = Math.max(0, Math.floor((now.getTime() - orderTime.getTime()) / 1000 / 60)) // in minutes
    
    if (elapsed < 60) {
      return `${elapsed} minutes ago`
    } else {
      const hours = Math.floor(elapsed / 60)
      const minutes = elapsed % 60
      return `${hours}h ${minutes}m ago`
    }
  }

  const formatPrice = (price) => {
    const numPrice = parseFloat(price || 0)
    return isNaN(numPrice) ? '$0.00' : `$${numPrice.toFixed(2)}`
  }

  // Timer effect for live updates
  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date()
      setCurrentTime(newTime)
      // Debug logging to verify timer is working
      if (order && (order.status === 'cooking' || order.status === 'confirmed')) {
        console.log('Timer update:', newTime.toLocaleTimeString())
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [order])

  // Initialize current time
  useEffect(() => {
    setCurrentTime(new Date())
  }, [])

  // Add a simple counter to force re-renders and verify updates are happening
  const [updateCounter, setUpdateCounter] = useState(0)
  
  useEffect(() => {
    const counterTimer = setInterval(() => {
      setUpdateCounter(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(counterTimer)
  }, [])

  // Force re-render when current time changes to update progress
  useEffect(() => {
    // This ensures the progress calculations are updated every second
    if (order && (order.status === 'cooking' || order.status === 'confirmed')) {
      // This effect will trigger re-render when currentTime changes
      console.log('Progress update triggered - Status:', order.status, 'Time:', currentTime.toLocaleTimeString())
    }
  }, [currentTime, order, updateCounter])

  if (isLoading) {
    return (
      <div className="order-tracking-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Loading your order...</h2>
            <p>Please wait while we fetch your order details.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="order-tracking-page">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={48} />
            <h2>Order Not Found</h2>
            <p>{error || 'We couldn\'t find your order. Please check your order ID.'}</p>
            <button onClick={() => window.location.href = '/'}>
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'cooking':
        return <ChefHat size={24} />
      case 'ready':
        return <Bell size={24} />
      case 'confirmed':
        return <CheckCircle size={24} />
      case 'completed':
        return <CheckCircle size={24} />
      default:
        return <Clock size={24} />
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'Awaiting Payment'
      case 'confirmed':
        return 'Order Confirmed'
      case 'cooking':
        return 'Cooking Your Order'
      case 'ready':
        return 'Ready for Pickup'
      case 'completed':
        return 'Order Complete'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="order-tracking-page">
      <div className="container">
        <div className="tracking-header">
          <h1>Order Tracking</h1>
          <div className="order-info">
            <span className="order-id">Order #{order.id}</span>
            <span className="order-time">Placed {getElapsedTime(order)}</span>
          </div>
        </div>

        {/* Payment Success Message */}
        {sessionId && order.payment_status === 'completed' && (
          <div className="payment-success-banner">
            <CheckCircle size={20} />
            <span>Payment successful! Your order is confirmed.</span>
          </div>
        )}

        {/* Main Status Card */}
        <div className="status-card">
          <div className="status-header">
            <div className="status-icon">
              {getStatusIcon(order.status)}
            </div>
            <div className="status-content">
              <h2 className="status-title">{getStatusLabel(order.status)}</h2>
              <p className="status-subtitle">
                {order.status === 'cooking' && 'Our chefs are preparing your delicious meal'}
                {order.status === 'confirmed' && 'Your order has been confirmed and will be prepared soon'}
                {order.status === 'ready' && 'Your order is ready for pickup!'}
                {order.status === 'completed' && 'Thank you for your order!'}
                {order.status === 'pending_payment' && 'Please complete your payment to proceed'}
              </p>
            </div>
          </div>

          {/* Live Timer and Progress for Active Orders */}
          {(order.status === 'cooking' || order.status === 'confirmed') && (
            <div className="progress-section">
              <div className="timer-display">
                <div className="countdown-timer">
                  <span className="timer-value">{getEstimatedTimeRemaining(order)}</span>
                  <span className="timer-label">estimated remaining</span>
                </div>
                <div className="progress-details">
                  <span className="progress-percentage">{getProgressPercentage(order)}% complete</span>
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage(order)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Debug information - remove this after testing */}
              <div style={{ 
                marginTop: '10px', 
                padding: '10px', 
                background: '#f5f5f5', 
                borderRadius: '8px', 
                fontSize: '0.8rem',
                fontFamily: 'monospace' 
              }}>
                <div>Current Time: {currentTime.toLocaleTimeString()}</div>
                <div>Order Time: {new Date(order.order_date || order.orderTime || order.order_time).toLocaleTimeString()}</div>
                <div>Estimated Time: {order.estimated_time || 25} minutes</div>
                <div>Status: {order.status}</div>
                <div>Update Counter: {updateCounter}</div>
                <div>Progress: {getProgressPercentage(order)}%</div>
                <div>Time Remaining: {getEstimatedTimeRemaining(order)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Restaurant Location */}
        <div className="pickup-info-card">
          <div className="pickup-header">
            <MapPin size={20} />
            <h3>Restaurant Location</h3>
          </div>
          <div className="pickup-details">
            <p className="location-name">
              {order.location?.name || "Fernando's Food Truck"}
            </p>
            {order.location?.current_location ? (
              <p className="location-address">{order.location.current_location}</p>
            ) : (
              <p className="location-address">Check our social media for current location</p>
            )}
            {order.location?.phone && (
              <p className="location-phone">📞 {order.location.phone}</p>
            )}
            {order.location?.schedule && (
              <p className="location-schedule">🕒 {order.location.schedule}</p>
            )}
            <p className="pickup-instructions">
              Please have your order number ready when you arrive
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderTrackingPage