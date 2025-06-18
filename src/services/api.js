import API_BASE_URL from '../config/api.js'

const API_URL = `${API_BASE_URL}/api`

class ApiService {
  // Create order and get Stripe checkout URL
  async createOrder(orderData) {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }

  // Verify payment after Stripe checkout
  async verifyPayment(sessionId, orderId) {
    try {
      const response = await fetch(`${API_URL}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, orderId }),
      })

      if (!response.ok) {
        throw new Error('Failed to verify payment')
      }

      return await response.json()
    } catch (error) {
      console.error('Error verifying payment:', error)
      throw error
    }
  }

  // Get all orders (admin)
  async getOrders() {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching orders:', error)
      throw error
    }
  }

  // Get specific order
  async getOrder(orderId) {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching order:', error)
      throw error
    }
  }

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update order status')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  // Update payment status
  async updatePaymentStatus(orderId, paymentStatus) {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update payment status')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating payment status:', error)
      throw error
    }
  }

  // Menu Items API Methods

  // Get all menu items
  async getMenuItems() {
    try {
      const response = await fetch(`${API_URL}/menu`)

      if (!response.ok) {
        throw new Error('Failed to fetch menu items')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching menu items:', error)
      throw error
    }
  }

  // Add new menu item
  async addMenuItem(menuItem) {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(menuItem),
      })

      if (!response.ok) {
        throw new Error('Failed to add menu item')
      }

      return await response.json()
    } catch (error) {
      console.error('Error adding menu item:', error)
      throw error
    }
  }

  // Update menu item
  async updateMenuItem(itemId, updates) {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/menu/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update menu item')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating menu item:', error)
      throw error
    }
  }

  // Delete menu item
  async deleteMenuItem(itemId) {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/menu/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete menu item')
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting menu item:', error)
      throw error
    }
  }

  // Locations API Methods

  // Get all locations
  async getLocations() {
    try {
      const response = await fetch(`${API_URL}/locations`)

      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching locations:', error)
      throw error
    }
  }

  // Add new location
  async addLocation(location) {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(location),
      })

      if (!response.ok) {
        throw new Error('Failed to add location')
      }

      return await response.json()
    } catch (error) {
      console.error('Error adding location:', error)
      throw error
    }
  }

  // Update location
  async updateLocation(locationId, updates) {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update location')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating location:', error)
      throw error
    }
  }

  // Delete location
  async deleteLocation(locationId) {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`${API_URL}/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete location')
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting location:', error)
      throw error
    }
  }
}

export default new ApiService() 