import { io } from 'socket.io-client'
import API_BASE_URL from '../config/api.js'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
    this.isConnected = false
  }

  connect() {
    if (!this.socket) {
      this.socket = io(API_BASE_URL, {
        transports: ['websocket', 'polling']
      })

      this.socket.on('connect', () => {
        console.log('Connected to server')
        this.isConnected = true
      })

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server')
        this.isConnected = false
      })

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
      })
    }

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Admin functions
  joinAdmin() {
    if (this.socket) {
      this.socket.emit('join-admin')
    }
  }

  onNewOrder(callback) {
    if (this.socket) {
      this.socket.on('new-order', callback)
    }
  }

  onOrderUpdated(callback) {
    if (this.socket) {
      this.socket.on('order-updated', callback)
    }
  }

  // Customer functions
  joinOrderTracking(orderId) {
    if (this.socket) {
      this.socket.emit('join-customer', orderId)
    }
  }

  onOrderStatusUpdated(callback) {
    if (this.socket) {
      this.socket.on('order-status-updated', callback)
    }
  }

  // Remove listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
    }
  }

  removeListener(event) {
    if (this.socket) {
      this.socket.off(event)
    }
  }
}

export default new SocketService() 