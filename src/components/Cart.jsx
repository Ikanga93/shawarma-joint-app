import React, { useState, useEffect } from 'react'
import { X, Plus, Minus, ShoppingCart, CreditCard, MapPin, Truck, Building, LogIn, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApiService from '../services/ApiService'
import API_BASE_URL from '../config/api.js'
import { useCart } from '../context/CartContext'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import './Cart.css'

const Cart = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart()
  const { user, loading: authLoading } = useCustomerAuth()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkoutMode, setCheckoutMode] = useState(null) // 'login' or 'guest'
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  })

  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      loadLocations()
      // Reset checkout state when cart opens
      setIsCheckingOut(false)
      setCheckoutMode(null)
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && cartItems.length > 0 && !isCheckingOut) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(() => {
        setIsCheckingOut(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen, cartItems.length, isCheckingOut])

  // Separate effect to handle checkout mode based on auth state
  useEffect(() => {
    if (isCheckingOut && checkoutMode === null) {
      // Check if user is logged in when entering checkout mode
      console.log('Cart: checking auth state for checkout', { user, authLoading })
      console.log('Cart: user object details:', user)
      
      if (!authLoading) {
        if (user) {
          console.log('Cart: User is logged in, setting checkout mode to logged-in')
          setCheckoutMode('logged-in')
          // Pre-fill customer info if available
          setCustomerInfo({
            name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.firstName || '',
            phone: user.phone || user.phoneNumber || '',
            email: user.email || ''
          })
        } else {
          console.log('Cart: User not logged in, keeping checkout mode null for login/guest choice')
        }
      }
    }
  }, [isCheckingOut, checkoutMode, user, authLoading])

  // Handle user login during checkout (when user becomes available)
  useEffect(() => {
    if (isCheckingOut && user && !authLoading && checkoutMode === null) {
      console.log('Cart: User became available during checkout, switching to logged-in mode')
      setCheckoutMode('logged-in')
      // Pre-fill customer info
      setCustomerInfo({
        name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.firstName || '',
        phone: user.phone || user.phoneNumber || '',
        email: user.email || ''
      })
    }
  }, [user, authLoading, isCheckingOut, checkoutMode])

  useEffect(() => {
    if (!user && !authLoading && checkoutMode === 'logged-in') {
      setCheckoutMode(null)
    }
  }, [user, authLoading, checkoutMode])

  const loadLocations = async () => {
    try {
      const locationsData = await ApiService.getLocations()
      // Only show active locations to customers
      const activeLocations = locationsData.filter(location => location.status === 'active')
      setLocations(activeLocations)
      
      // Auto-select first location if only one available
      if (activeLocations.length === 1) {
        setSelectedLocation(activeLocations[0].id)
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      setError('Failed to load pickup locations')
    }
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const itemPrice = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + (itemPrice * quantity);
  }, 0)
  const tax = subtotal * 0.0875 // 8.75% tax
  const total = subtotal + tax

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    })
  }

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value)
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Truck size={16} />
      case 'fixed':
        return <Building size={16} />
      default:
        return <MapPin size={16} />
    }
  }

  const selectedLocationObj = locations.find(loc => loc.id === selectedLocation)

  const handleCheckout = async (e) => {
    e.preventDefault()
    
    if (!selectedLocation) {
      alert('Please select a pickup location')
      return
    }

    // For logged-in users, use their info; for guests, use form data
    const orderCustomerInfo = checkoutMode === 'logged-in' && user ? {
      name: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.firstName || '',
      phone: user.phone || user.phoneNumber || '',
      email: user.email
    } : customerInfo

    if (!orderCustomerInfo.name.trim() || !orderCustomerInfo.phone.trim()) {
      if (checkoutMode === 'logged-in') {
        alert('Your profile is missing required information (name or phone). Please update your profile.')
      } else {
        alert('Please fill in all required fields')
      }
      return
    }

    setIsProcessing(true)

    try {
      // Create order and get Stripe checkout URL
      const orderData = {
        customerName: orderCustomerInfo.name,
        customerPhone: orderCustomerInfo.phone,
        customerEmail: orderCustomerInfo.email,
        items: cartItems,
        subtotal,
        tax,
        total,
        locationId: selectedLocation
      }

      const response = await ApiService.createOrder(orderData)
      
      // Store order ID for tracking
      localStorage.setItem('currentOrderId', response.orderId)
      
      // Redirect to Stripe Checkout
      window.location.href = response.checkoutUrl
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="cart-overlay">
      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>
            <ShoppingCart size={24} />
            Your Order
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-content">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-emoji">🌮</div>
              <p>Your cart is empty</p>
              <span>Add some delicious items to get started!</span>
            </div>
          ) : (
            <div className="cart-with-items">
              <div className="cart-items">
                {cartItems.map(item => {
                  // Calculate item price including any option surcharges
                  let itemBasePrice = parseFloat(item.price) || 0;
                  let optionsSurcharge = 0;
                  let selectedOptionDetails = [];
                  
                  // Process selected options if they exist
                  if (item.selectedOptions && item.options) {
                    item.options.forEach(optionGroup => {
                      const selectedIds = item.selectedOptions[optionGroup.id];
                      
                      if (selectedIds) {
                        // Handle both single-select (string id) and multi-select (array of ids)
                        const selectedIdArray = Array.isArray(selectedIds) ? selectedIds : [selectedIds];
                        
                        selectedIdArray.forEach(choiceId => {
                          const selectedChoice = optionGroup.choices.find(c => c.id === choiceId);
                          if (selectedChoice) {
                            // Add option price to surcharge
                            optionsSurcharge += parseFloat(selectedChoice.price_modifier) || 0;
                            
                            // Add to details for display
                            selectedOptionDetails.push({
                              groupName: optionGroup.name,
                              choiceName: selectedChoice.name,
                              price: parseFloat(selectedChoice.price_modifier) || 0
                            });
                          }
                        });
                      }
                    });
                  }
                  
                  // Calculate total price for this item including options
                  const totalItemPrice = itemBasePrice + optionsSurcharge;
                  
                  return (
                    <div key={`${item.id}-${JSON.stringify(item.selectedOptions || {})}`} className="cart-item">
                      <div className="cart-item-info">
                        <div className="cart-item-image">
                          {item.image_url ? (
                            <img 
                              src={item.image_url.startsWith('data:') ? item.image_url : `${API_BASE_URL}${item.image_url}`} 
                              alt={item.name}
                              className="cart-image"
                            />
                          ) : (
                            <div className="cart-item-emoji">{item.emoji}</div>
                          )}
                        </div>
                        <div className="cart-item-details">
                          <h4>{item.name}</h4>
                          <p className="cart-item-description">{item.description}</p>
                          <p className="cart-item-price">${totalItemPrice.toFixed(2)} each</p>
                          
                          {/* Display selected options */}
                          {selectedOptionDetails.length > 0 && (
                            <div className="cart-item-options">
                              {selectedOptionDetails.map((option, index) => (
                                <div key={index} className="cart-item-option">
                                  <span className="option-label">{option.groupName}:</span>
                                  <span className="option-value">{option.choiceName}</span>
                                  {option.price > 0 && (
                                    <span className="option-price">+${(parseFloat(option.price) || 0).toFixed(2)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="cart-item-controls">
                        <div className="quantity-controls">
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedOptions)}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="quantity">{item.quantity}</span>
                          <button 
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedOptions)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="cart-item-total">
                          ${(totalItemPrice * item.quantity).toFixed(2)}
                        </div>
                        <button 
                          className="remove-btn"
                          onClick={() => removeFromCart(item.id, item.selectedOptions)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary">
                <div className="summary-line">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>Tax (8.75%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="summary-line total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {!isCheckingOut ? (
                <button 
                  className="checkout-btn"
                  onClick={() => setIsCheckingOut(true)}
                >
                  <ShoppingCart size={18} />
                  Proceed to Checkout
                </button>
              ) : checkoutMode === null ? (
                <div className="checkout-options">
                  <h3>Choose how to continue</h3>
                  <button 
                    className="login-checkout-btn"
                    onClick={() => window.location.href = '/login?redirect=checkout'}
                  >
                    <LogIn size={18} />
                    Login to Checkout
                  </button>
                  <div className="checkout-divider">
                    <span>OR</span>
                  </div>
                  <button 
                    className="guest-checkout-btn"
                    onClick={() => setCheckoutMode('guest')}
                  >
                    <User size={18} />
                    Continue as Guest
                  </button>
                  <button 
                    className="back-to-cart-btn"
                    onClick={() => setIsCheckingOut(false)}
                  >
                    ← Back to Cart
                  </button>
                </div>
              ) : (checkoutMode === 'guest' || checkoutMode === 'logged-in') ? (
                <form className="checkout-form" onSubmit={handleCheckout}>
                  {checkoutMode === 'logged-in' && user && (
                    <div className="customer-info-display">
                      <h3>Customer Information</h3>
                      <div className="user-info-card">
                        <div className="info-row">
                          <span className="info-label">Name:</span>
                          <span className="info-value">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name || user.firstName || 'Not provided'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Email:</span>
                          <span className="info-value">{user.email}</span>
                        </div>
                        {(user.phone || user.phoneNumber) && (
                          <div className="info-row">
                            <span className="info-label">Phone:</span>
                            <span className="info-value">{user.phone || user.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <h3>Pickup Location</h3>
                  
                  {loading ? (
                    <div className="loading-locations">
                      <div className="spinner"></div>
                      <p>Loading locations...</p>
                    </div>
                  ) : (
                    <div className="form-group location-selection">
                      {locations.map((location) => (
                        <label key={location.id} className="location-option">
                          <input
                            type="radio"
                            name="location"
                            value={location.id}
                            checked={selectedLocation === location.id}
                            onChange={handleLocationChange}
                          />
                          <div className="location-info">
                            <div className="location-header">
                              {getLocationIcon(location.type)}
                              <span className="location-name">{location.name}</span>
                            </div>
                            <div className="location-details">
                              <p className="location-description">{location.description}</p>
                              {location.current_location && (
                                <p className="location-address">
                                  📍 {location.current_location}
                                </p>
                              )}
                            </div>
                            {location.schedule && (
                              <p className="location-note">🕒 {location.schedule}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {checkoutMode === 'guest' ? (
                    <div className="customer-info-form">
                      <h3>Customer Information</h3>
                      
                      <div className="form-group">
                        <input
                          type="text"
                          name="name"
                          placeholder="Your Name *"
                          value={customerInfo.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Phone Number *"
                          value={customerInfo.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <input
                          type="email"
                          name="email"
                          placeholder="Email (optional)"
                          value={customerInfo.email}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="checkout-buttons">
                    <button 
                      type="button" 
                      className="back-btn"
                      onClick={() => {
                        if (checkoutMode === 'logged-in') {
                          setIsCheckingOut(false);
                        } else {
                          setCheckoutMode(null);
                        }
                      }}
                      disabled={isProcessing}
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      className="place-order-btn"
                      disabled={isProcessing || loading}
                    >
                      {isProcessing ? (
                        <>
                          <div className="spinner"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} />
                          Pay Now
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Cart