import API_BASE_URL from '../config/api.js'

class ApiService {
  static BASE_URL = `${API_BASE_URL}/api`

  // Helper method to get authentication headers
  static getAuthHeaders() {
    // Try admin token first (for admin operations)
    const adminToken = localStorage.getItem('adminAccessToken')
    if (adminToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }

    // Fall back to customer token (for customer operations)
    const customerToken = localStorage.getItem('customerAccessToken')
    if (customerToken) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      }
    }

    // No authentication
    return {
      'Content-Type': 'application/json'
    }
  }

  // Helper method specifically for admin operations
  static getAdminAuthHeaders() {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (!adminToken) {
      throw new Error('Admin authentication required')
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }

  // Helper method to refresh admin token
  static async refreshAdminToken() {
    const refreshToken = localStorage.getItem('adminRefreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await fetch(`${this.BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()
    localStorage.setItem('adminAccessToken', data.accessToken)
    return data.accessToken
  }

  // Helper method to make authenticated requests with automatic retry
  static async makeAuthenticatedRequest(url, options = {}) {
    try {
      // First attempt
      const response = await fetch(url, options)
      
      // If 403/401 and we have admin refresh token, try to refresh
      if ((response.status === 403 || response.status === 401) && 
          localStorage.getItem('adminRefreshToken') && 
          options.headers?.Authorization?.includes('Bearer')) {
        
        console.log('Access token expired, attempting refresh...')
        try {
          const newToken = await this.refreshAdminToken()
          
          // Update headers with new token
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`
            }
          }
          
          // Retry request with new token
          const retryResponse = await fetch(url, newOptions)
          return retryResponse
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          // Clear tokens on refresh failure
          localStorage.removeItem('adminAccessToken')
          localStorage.removeItem('adminRefreshToken')
          throw new Error('Session expired. Please log in again.')
        }
      }
      
      return response
    } catch (error) {
      throw error
    }
  }

  // Helper method to safely parse JSON response
  static async parseResponse(response) {
    const text = await response.text()
    if (!text) {
      throw new Error('Empty response from server')
    }
    try {
      return JSON.parse(text)
    } catch (error) {
      console.error('Failed to parse JSON response:', text)
      throw new Error('Invalid JSON response from server')
    }
  }

  // Orders
  static async getOrders() {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/orders`, {
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch orders')
    return this.parseResponse(response)
  }

  static async getCustomerOrders(customerId) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/orders/customer/${customerId}`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch customer orders')
    return this.parseResponse(response)
  }

  static async createOrder(orderData) {
    // Get customer authentication info to include user_id for registered customers
    const customerToken = localStorage.getItem('customerAccessToken')
    let userId = null
    
    if (customerToken) {
      try {
        // Decode the token to get user ID (simple JWT decode)
        const tokenPayload = JSON.parse(atob(customerToken.split('.')[1]))
        userId = tokenPayload.id
        console.log('🔍 Creating order for registered customer:', userId)
      } catch (error) {
        console.warn('Could not decode customer token:', error)
      }
    }

    // Include userId in order data if available
    const orderDataWithUser = {
      ...orderData,
      userId: userId
    }

    console.log('📦 Creating order with data:', {
      ...orderDataWithUser,
      items: `[${orderDataWithUser.items?.length || 0} items]` // Don't log full items for brevity
    })

    const response = await fetch(`${this.BASE_URL}/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderDataWithUser)
    })
    if (!response.ok) throw new Error('Failed to create order')
    return this.parseResponse(response)
  }

  static async updateOrderStatus(orderId, status) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify({ status })
    })
    if (!response.ok) throw new Error('Failed to update order status')
    return this.parseResponse(response)
  }

  static async getOrder(orderId) {
    const response = await fetch(`${this.BASE_URL}/orders/${orderId}`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to fetch order')
    return this.parseResponse(response)
  }

  static async deleteOrder(orderId) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/orders/${orderId}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete order')
    return this.parseResponse(response)
  }

  static async resetOrderToCooking(orderId, timeRemaining = 15) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/orders/${orderId}/reset-to-cooking`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify({ timeRemaining })
    })
    if (!response.ok) throw new Error('Failed to reset order to cooking')
    return this.parseResponse(response)
  }

  static async updateOrder(orderId, orderData) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/orders/${orderId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(orderData)
    })
    if (!response.ok) throw new Error('Failed to update order')
    return this.parseResponse(response)
  }

  // Menu items
  static async getMenuItems() {
    const response = await fetch(`${this.BASE_URL}/menu`)
    if (!response.ok) throw new Error('Failed to fetch menu items')
    return this.parseResponse(response)
  }

  static async addMenuItem(menuData) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/menu`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(menuData)
    })
    if (!response.ok) throw new Error('Failed to add menu item')
    return this.parseResponse(response)
  }

  static async updateMenuItem(itemId, updates) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/menu/${itemId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update menu item')
    return this.parseResponse(response)
  }

  static async deleteMenuItem(itemId) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/menu/${itemId}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete menu item')
    return this.parseResponse(response)
  }

  // Locations
  static async getLocations() {
    const response = await fetch(`${this.BASE_URL}/locations`)
    if (!response.ok) throw new Error('Failed to fetch locations')
    return this.parseResponse(response)
  }

  static async addLocation(locationData) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/locations`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(locationData)
    })
    if (!response.ok) throw new Error('Failed to add location')
    return this.parseResponse(response)
  }

  static async updateLocation(locationId, updates) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/locations/${locationId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update location')
    return this.parseResponse(response)
  }

  static async deleteLocation(locationId) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/locations/${locationId}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete location')
    return this.parseResponse(response)
  }

  // Live Locations (New functionality for real-time truck locations)
  static async getLiveLocations() {
    const response = await fetch(`${this.BASE_URL}/live-locations`)
    if (!response.ok) throw new Error('Failed to fetch live locations')
    return this.parseResponse(response)
  }

  static async addLiveLocation(liveLocationData) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/live-locations`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(liveLocationData)
    })
    if (!response.ok) throw new Error('Failed to add live location')
    return this.parseResponse(response)
  }

  static async updateLiveLocation(liveLocationId, updates) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/live-locations/${liveLocationId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update live location')
    return this.parseResponse(response)
  }

  static async deleteLiveLocation(liveLocationId) {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/live-locations/${liveLocationId}`, {
      method: 'DELETE',
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) throw new Error('Failed to delete live location')
    return this.parseResponse(response)
  }

  // Stripe payment
  static async createPaymentIntent(orderData) {
    const response = await fetch(`${this.BASE_URL}/create-payment-intent`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(orderData)
    })
    if (!response.ok) throw new Error('Failed to create payment intent')
    return this.parseResponse(response)
  }

  // Verify payment
  static async verifyPayment(sessionId, orderId) {
    // Validate input parameters
    if (!sessionId || !orderId) {
      throw new Error('Session ID and Order ID are required for payment verification')
    }
    
    // Basic validation for Stripe session ID format
    if (!sessionId.startsWith('cs_') && sessionId !== 'test') {
      console.warn('Invalid Stripe session ID format:', sessionId)
      throw new Error('Invalid payment session format')
    }
    
    try {
      const response = await fetch(`${this.BASE_URL}/verify-payment`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ sessionId, orderId })
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        console.error('Payment verification failed:', errorData)
        throw new Error(`Payment verification failed: ${response.status}`)
      }
      
      return this.parseResponse(response)
    } catch (error) {
      console.error('Payment verification error:', error)
      throw error
    }
  }

  // Location Management Methods

  // Get all locations
  static async getLocations() {
    const response = await fetch(`${this.BASE_URL}/locations`)
    if (!response.ok) {
      throw new Error('Failed to fetch locations')
    }
    return response.json()
  }

  // Create new location (admin only)
  static async createLocation(locationData) {
    const response = await fetch(`${this.BASE_URL}/locations`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(locationData)
    })
    if (!response.ok) {
      throw new Error('Failed to create location')
    }
    return response.json()
  }

  // Update location (admin only)
  static async updateLocation(locationId, locationData) {
    const response = await fetch(`${this.BASE_URL}/locations/${locationId}`, {
      method: 'PUT',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify(locationData)
    })
    if (!response.ok) {
      throw new Error('Failed to update location')
    }
    return response.json()
  }

  // User Location Management Methods

  // Get user's assigned locations
  static async getUserLocations(userId) {
    const response = await fetch(`${this.BASE_URL}/users/${userId}/locations`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to fetch user locations')
    }
    return response.json()
  }

  // Assign user to location (admin only)
  static async assignUserToLocation(userId, locationId, role = 'staff') {
    const response = await fetch(`${this.BASE_URL}/users/${userId}/locations`, {
      method: 'POST',
      headers: this.getAdminAuthHeaders(),
      body: JSON.stringify({ locationId, role })
    })
    if (!response.ok) {
      throw new Error('Failed to assign user to location')
    }
    return response.json()
  }

  // Update user's current location
  static async updateUserCurrentLocation(userId, locationId) {
    const response = await fetch(`${this.BASE_URL}/users/${userId}/current-location`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ locationId })
    })
    if (!response.ok) {
      throw new Error('Failed to update current location')
    }
    return response.json()
  }

  // Get orders for specific location
  static async getLocationOrders(locationId) {
    const response = await fetch(`${this.BASE_URL}/locations/${locationId}/orders`, {
      headers: this.getAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to fetch location orders')
    }
    return response.json()
  }

  // Get all users with location assignments (admin only)
  static async getAllUsers() {
    const response = await fetch(`${this.BASE_URL}/admin/users`, {
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }
    return response.json()
  }

  // Get all customers (registered + guest customers from orders) - admin only
  static async getAllCustomers() {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/admin/customers`, {
      headers: this.getAdminAuthHeaders()
    })
    if (!response.ok) {
      throw new Error('Failed to fetch customers')
    }
    return this.parseResponse(response)
  }

  // Order Management Methods
}

export default ApiService