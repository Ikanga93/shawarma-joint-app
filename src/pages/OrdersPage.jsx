import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Bell, 
  Package, 
  RefreshCw, 
  Eye, 
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useCart } from '../context/CartContext'
import ApiService from '../services/ApiService'
import './OrdersPage.css'

const OrdersPage = () => {
  const { user } = useCustomerAuth()
  const { addToCart } = useCart()
  const [orders, setOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')

  useEffect(() => {
    loadOrders()
  }, [user])

  useEffect(() => {
    filterAndSortOrders()
  }, [orders, filterStatus, searchTerm, sortBy])

  const loadOrders = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      console.log('Fetching orders for user:', user.id)
      const customerOrders = await ApiService.getCustomerOrders(user.id)
      console.log('Customer orders received:', customerOrders)
      setOrders(customerOrders)
      setError(null)
    } catch (error) {
      console.error('Error loading orders:', error)
      setError('Failed to load your orders. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortOrders = () => {
    let filtered = [...orders]

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toString().includes(searchTerm) ||
        order.items.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Sort orders
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.order_time) - new Date(a.order_time)
        case 'oldest':
          return new Date(a.order_time) - new Date(b.order_time)
        case 'amount_high':
          return b.total - a.total
        case 'amount_low':
          return a.total - b.total
        default:
          return new Date(b.order_time) - new Date(a.order_time)
      }
    })

    setFilteredOrders(filtered)
  }

  const getStatusInfo = (status) => {
    const statusMap = {
      'pending_payment': { 
        label: 'Awaiting Payment', 
        icon: <Clock size={16} />, 
        color: '#ff9800',
        description: 'Payment is being processed'
      },
      'pending': { 
        label: 'Order Received', 
        icon: <CheckCircle size={16} />, 
        color: '#2196f3',
        description: 'Your order has been confirmed'
      },
      'confirmed': { 
        label: 'Confirmed', 
        icon: <CheckCircle size={16} />, 
        color: '#2196f3',
        description: 'Order confirmed and queued'
      },
      'cooking': { 
        label: 'Preparing', 
        icon: <ChefHat size={16} />, 
        color: '#ff5722',
        description: 'Your food is being prepared'
      },
      'ready': { 
        label: 'Ready for Pickup', 
        icon: <Bell size={16} />, 
        color: '#4caf50',
        description: 'Your order is ready!'
      },
      'completed': { 
        label: 'Completed', 
        icon: <Package size={16} />, 
        color: '#9e9e9e',
        description: 'Order completed'
      },
      'cancelled': { 
        label: 'Cancelled', 
        icon: <AlertCircle size={16} />, 
        color: '#f44336',
        description: 'Order was cancelled'
      }
    }
    return statusMap[status] || statusMap['pending']
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Chicago'
    })
  }

  const handleReorder = async (order) => {
    try {
      // Add all items from the order to cart
      for (const item of order.items) {
        await addToCart({
          id: item.id || Math.random(), // Fallback ID if not available
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          emoji: item.emoji || '🍽️'
        })
      }
      
      // Show success message or redirect to cart
      alert(`${order.items.length} items added to your cart!`)
    } catch (error) {
      console.error('Error reordering:', error)
      alert('Failed to add items to cart. Please try again.')
    }
  }

  const getOrderSummary = (order) => {
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
    const mainItems = order.items.slice(0, 2)
    const remainingCount = order.items.length - 2

    return {
      itemCount,
      mainItems,
      remainingCount: remainingCount > 0 ? remainingCount : 0
    }
  }

  if (isLoading) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Loading your orders...</h2>
            <p>Please wait while we fetch your order history.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={48} />
            <h2>Unable to Load Orders</h2>
            <p>{error}</p>
            <button onClick={loadOrders} className="retry-btn">
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <div className="header-content">
            <h1>My Orders</h1>
            <p>Track your orders and reorder your favorites</p>
          </div>
          
          <div className="orders-stats">
            <div className="stat-card">
              <div className="stat-number">{orders.length}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{orders.filter(o => o.status === 'completed').length}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">
                ${orders.reduce((sum, order) => sum + order.total, 0).toFixed(0)}
              </div>
              <div className="stat-label">Total Spent</div>
            </div>
          </div>
        </div>

        <div className="orders-controls">
          <div className="search-filter-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search orders by ID or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-controls">
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="cooking">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Highest Amount</option>
                <option value="amount_low">Lowest Amount</option>
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <Package size={64} />
            <h3>
              {orders.length === 0 
                ? "No orders yet" 
                : "No orders match your filters"
              }
            </h3>
            <p>
              {orders.length === 0 
                ? "Start by exploring our delicious menu!" 
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {orders.length === 0 && (
              <Link to="/menu" className="cta-button">
                Browse Menu
              </Link>
            )}
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map((order) => {
              const statusInfo = getStatusInfo(order.status)
              const summary = getOrderSummary(order)
              
              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-meta">
                      <div className="order-number">Order #{order.id}</div>
                      <div className="order-date">
                        <Calendar size={14} />
                        {formatDate(order.order_time)} at {formatTime(order.order_time)}
                      </div>
                    </div>
                    
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      {statusInfo.icon}
                      {statusInfo.label}
                    </div>
                  </div>

                  <div className="order-content">
                    <div className="order-items-preview">
                      <div className="items-list">
                        {summary.mainItems.map((item, index) => (
                          <div key={index} className="item-preview">
                            <span className="item-emoji">{item.emoji || '🍽️'}</span>
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">×{item.quantity}</span>
                          </div>
                        ))}
                        {summary.remainingCount > 0 && (
                          <div className="more-items">
                            +{summary.remainingCount} more item{summary.remainingCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      <div className="order-summary">
                        <div className="item-count">
                          {summary.itemCount} item{summary.itemCount > 1 ? 's' : ''}
                        </div>
                        <div className="order-total">
                          <DollarSign size={16} />
                          ${order.total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="order-actions">
                      <Link 
                        to={`/order-tracking/${order.id}`}
                        className="action-btn view-btn"
                      >
                        <Eye size={16} />
                        View Details
                      </Link>
                      
                      {order.status === 'completed' && (
                        <button 
                          onClick={() => handleReorder(order)}
                          className="action-btn reorder-btn"
                        >
                          <RefreshCw size={16} />
                          Reorder
                        </button>
                      )}
                    </div>
                  </div>

                  {(order.status === 'ready' || order.status === 'cooking') && (
                    <div className="order-alert">
                      <div className="alert-content">
                        {order.status === 'ready' ? (
                          <>
                            <Bell size={16} />
                            <span>Ready for pickup!</span>
                          </>
                        ) : (
                          <>
                            <ChefHat size={16} />
                            <span>Being prepared now</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pickup Location Info */}
        <div className="pickup-info-section">
          <h3>Pickup Location</h3>
          <div className="location-card">
            <div className="location-details">
              <div className="location-item">
                <MapPin size={20} />
                <div>
                  <strong>Fernando's Food Truck</strong>
                  <p>Campus Town - Green & Wright</p>
                </div>
              </div>
              <div className="location-item">
                <Phone size={20} />
                <div>
                  <strong>Contact</strong>
                  <p>(217) 255-0210</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrdersPage 