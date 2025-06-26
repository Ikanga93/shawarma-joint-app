import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  MapPin, 
  Clock, 
  Menu as MenuIcon, 
  ShoppingBag, 
  Users, 
  Edit3, 
  Save, 
  Plus, 
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Timer,
  Truck,
  Building,
  Phone,
  Navigation,
  Mail,
  Calendar,
  Target,
  Upload,
  Edit2,
  XCircle,
  RotateCcw,
  Trash
} from 'lucide-react'
import { useBusinessConfig } from '../context/BusinessContext'
import DashboardHeader from '../components/DashboardHeader'
import AdminLocationSelector from '../components/AdminLocationSelector'
import ApiService from '../services/ApiService'
import io from 'socket.io-client'
import API_BASE_URL from '../config/api.js'
import './DashboardPage.css'

const DashboardPage = ({ onLogout }) => {
  const { config } = useBusinessConfig()
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [socket, setSocket] = useState(null)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // User and location state
  const [currentUser, setCurrentUser] = useState(null)
  const [currentLocation, setCurrentLocation] = useState(null)
  const [userLocations, setUserLocations] = useState([])
  const [selectedLocationFilter, setSelectedLocationFilter] = useState('all')

  // Analytics state
  const [customerAnalytics, setCustomerAnalytics] = useState({
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
    topCustomers: []
  })
  
  // Persistent customer database - maintains customers even when orders are deleted
  const [customerDatabase, setCustomerDatabase] = useState(new Map())
  
  const [orderAnalytics, setOrderAnalytics] = useState({
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersByStatus: {},
    popularItems: [],
    revenueByDay: [],
    ordersByHour: []
  })

  // Order Management state
  const [selectedOrderStatus, setSelectedOrderStatus] = useState('all')
  const [allOrdersFilter, setAllOrdersFilter] = useState('all') // New filter state for All Orders tab
  const [expandedSections, setExpandedSections] = useState({
    'section-pending': true,
    'section-cooking': true,
    'section-ready': true,
    'section-completed': false,
    'section-canceled': false
  })

  const [businessSettings, setBusinessSettings] = useState({
    businessName: config.businessName,
    tagline: config.tagline,
    phone: config.contact.phone,
    email: config.contact.email,
    facebook: config.contact.facebook
  })

  // Dynamic menu items from database
  const [menuItems, setMenuItems] = useState([])
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)

  // Dynamic locations from database
  const [locations, setLocations] = useState([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

  // Live locations state (New functionality)
  const [liveLocations, setLiveLocations] = useState([])
  const [isLoadingLiveLocations, setIsLoadingLiveLocations] = useState(false)

  // Modal states
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showLiveLocationModal, setShowLiveLocationModal] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  // Form states
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_available: true,
    image_url: '',
    imageFile: null
  })
  
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    hours: '',
    is_active: true
  })
  
  const [liveLocationForm, setLiveLocationForm] = useState({
    truck_name: '',
    current_address: '',
    latitude: '',
    longitude: '',
    description: '',
    hours_today: '',
    is_active: true
  })

  // Editing states
  const [editingMenuItem, setEditingMenuItem] = useState(null)
  const [editingLocation, setEditingLocation] = useState(null)
  const [editingLiveLocation, setEditingLiveLocation] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false)

  // Geolocation state
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')

  // Initialize Socket.IO and load data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true)
        
        // Initialize current user from localStorage
        const adminToken = localStorage.getItem('adminAccessToken')
        if (adminToken) {
          try {
            // Decode user info from token or get from API
            const userInfo = JSON.parse(localStorage.getItem('currentUser') || '{}')
            setCurrentUser(userInfo)
            setCurrentLocation(userInfo.currentLocation)
          } catch (error) {
            console.error('Error loading user info:', error)
          }
        }
        
        // Load initial data in parallel
        await Promise.all([
          loadOrders(),
          loadMenuItems(),
          loadLocations()
        ])

        // Load live locations (New functionality) - don't fail if this errors
        try {
          await loadLiveLocations()
        } catch (liveLocationError) {
          console.warn('Live locations not available yet:', liveLocationError.message)
          // This is okay - live locations is a new feature that admins will populate
        }

        // Try to connect to Socket.IO for real-time updates (optional)
        try {
          const newSocket = io(API_BASE_URL)
          setSocket(newSocket)

          // Join admin room for real-time notifications
          newSocket.emit('join-admin')

          // Listen for real-time order updates
          newSocket.on('orderUpdate', (updatedOrder) => {
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            )
          })

          // Listen for new orders
          newSocket.on('new-order', (newOrder) => {
            setOrders(prevOrders => [newOrder, ...prevOrders])
          })

          // Listen for order status updates  
          newSocket.on('order-updated', (updatedOrder) => {
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            )
          })

          // Listen for order deletions
          newSocket.on('orderDeleted', (deletedOrderId) => {
            setOrders(prevOrders =>
              prevOrders.filter(order => order.id !== deletedOrderId)
            )
          })
        } catch (socketError) {
          console.warn('Socket.IO connection failed, continuing without real-time updates:', socketError)
        }

        setError(null)
      } catch (error) {
        console.error('Error initializing dashboard:', error)
        setError('Failed to load dashboard data. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    initializeDashboard()

    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [])

  // Location change handler
  const handleLocationChange = (newLocation) => {
    setCurrentLocation(newLocation)
    // Update localStorage
    const userInfo = JSON.parse(localStorage.getItem('currentUser') || '{}')
    userInfo.currentLocation = newLocation
    localStorage.setItem('currentUser', JSON.stringify(userInfo))
    
    // Reload orders for new location if location filtering is active
    if (selectedLocationFilter !== 'all') {
      loadOrders()
    }
  }

  // Load functions
  const loadOrders = async () => {
    try {
      console.log('🔄 Loading orders from API...')
      
      let ordersData
      if (currentLocation && selectedLocationFilter === 'current') {
        // Load orders for current location only
        ordersData = await ApiService.getLocationOrders(currentLocation.id)
      } else {
        // Load all orders
        ordersData = await ApiService.getOrders()
      }
      
      console.log('✅ Orders loaded successfully:', {
        count: ordersData.length,
        sample: ordersData[0],
        allOrderIds: ordersData.map(o => o.id),
        location: currentLocation?.name || 'All locations'
      })
      setOrders(ordersData)
    } catch (error) {
      console.error('❌ Error loading orders:', error)
      if (error.message.includes('authentication') || error.message.includes('401')) {
        console.log('🔐 Authentication error - redirecting to login')
        navigate('/admin/login')
      } else {
        console.error('📡 API Error details:', error)
        setOrders([]) // Set empty array on error to prevent crashes
      }
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const loadMenuItems = async () => {
    try {
      setIsLoadingMenu(true)
      const menuData = await ApiService.getMenuItems()
      setMenuItems(menuData)
    } catch (error) {
      console.error('Error loading menu items:', error)
      throw error // Re-throw to be caught by the main error handler
    } finally {
      setIsLoadingMenu(false)
    }
  }

  const loadLocations = async () => {
    try {
      setIsLoadingLocations(true)
      const locationsData = await ApiService.getLocations()
      setLocations(locationsData)
    } catch (error) {
      console.error('Error loading locations:', error)
      throw error // Re-throw to be caught by the main error handler
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const loadLiveLocations = async () => {
    try {
      setIsLoadingLiveLocations(true)
      const liveLocationsData = await ApiService.getLiveLocations()
      setLiveLocations(liveLocationsData)
    } catch (error) {
      console.error('Error loading live locations:', error)
      // Don't throw error - just set empty array and continue
      setLiveLocations([])
    } finally {
      setIsLoadingLiveLocations(false)
    }
  }

  // Analytics calculation functions
  const calculateCustomerAnalytics = (orders) => {
    console.log('🔍 calculateCustomerAnalytics called with orders:', orders.length)
    console.log('📊 Sample order structure:', orders[0])
    
    if (!orders || orders.length === 0) {
      console.log('⚠️ No orders provided to calculateCustomerAnalytics')
      // Don't reset customer database when no orders - customers should persist
      const customers = Array.from(customerDatabase.values())
      setCustomerAnalytics({
        totalCustomers: customers.length,
        newCustomers: 0,
        returningCustomers: 0,
        topCustomers: customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10)
      })
      return
    }
    
    // Start with existing customer database to preserve customers
    const updatedCustomerMap = new Map(customerDatabase)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let processedOrders = 0
    let skippedOrders = 0

    // Reset order counts and spending for recalculation
    updatedCustomerMap.forEach(customer => {
      customer.totalOrders = 0
      customer.totalSpent = 0
    })

    orders.forEach((order, index) => {
      console.log(`🔄 Processing order ${index + 1}/${orders.length}:`, {
        id: order.id,
        order_time: order.order_time,
        order_date: order.order_date,
        orderTime: order.orderTime,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_name: order.customer_name,
        total_amount: order.total_amount,
        status: order.status
      })

      // Try different date field names
      const orderTimeField = order.order_time || order.order_date || order.orderTime
      
      // Skip orders without valid order_time or customer identifier
      if (!orderTimeField || (!order.customer_email && !order.customer_phone)) {
        console.log(`⏭️ Skipping order ${index + 1}: missing order_time or customer info`)
        skippedOrders++
        return
      }

      let orderDate
      try {
        orderDate = new Date(orderTimeField)
        // Check if date is valid
        if (isNaN(orderDate.getTime())) {
          console.warn('❌ Invalid order_time format:', orderTimeField)
          skippedOrders++
          return
        }
      } catch (error) {
        console.warn('❌ Error parsing order_time:', orderTimeField, error)
        skippedOrders++
        return
      }

      const customerKey = order.customer_email || order.customer_phone
      
      if (!updatedCustomerMap.has(customerKey)) {
        updatedCustomerMap.set(customerKey, {
          name: order.customer_name || 'Unknown Customer',
          email: order.customer_email,
          phone: order.customer_phone,
          firstOrder: orderDate,
          totalOrders: 0,
          totalSpent: 0,
          isNew: orderDate >= thirtyDaysAgo
        })
      }
      
      const customer = updatedCustomerMap.get(customerKey)
      customer.totalOrders += 1
      customer.totalSpent += parseFloat(order.total_amount) || 0
      
      // Update customer info if it's more complete
      if (!customer.name || customer.name === 'Unknown Customer') {
        customer.name = order.customer_name || customer.name
      }
      if (!customer.email && order.customer_email) {
        customer.email = order.customer_email
      }
      if (!customer.phone && order.customer_phone) {
        customer.phone = order.customer_phone
      }
      
      if (orderDate < customer.firstOrder) {
        customer.firstOrder = orderDate
        customer.isNew = orderDate >= thirtyDaysAgo
      }
      
      processedOrders++
    })

    const customers = Array.from(updatedCustomerMap.values())
    const newCustomers = customers.filter(c => c.isNew).length
    const returningCustomers = customers.filter(c => c.totalOrders > 1).length
    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)

    console.log('📈 Customer analytics calculated:', {
      totalOrders: orders.length,
      processedOrders,
      skippedOrders,
      totalCustomers: customers.length,
      newCustomers,
      returningCustomers,
      topCustomers: topCustomers.length,
      sampleCustomer: customers[0]
    })

    setCustomerAnalytics({
      totalCustomers: customers.length,
      newCustomers,
      returningCustomers,
      topCustomers
    })
    setCustomerDatabase(updatedCustomerMap)
  }

  const calculateOrderAnalytics = (orders) => {
    console.log('📊 calculateOrderAnalytics called with orders:', orders.length)
    
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
    
    console.log('💸 Revenue calculated:', { totalRevenue, averageOrderValue })
    
    // Orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

    console.log('📊 Orders by status:', ordersByStatus)

    // Popular items
    const itemMap = new Map()
    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const key = item.name
          if (!itemMap.has(key)) {
            itemMap.set(key, { name: item.name, quantity: 0, revenue: 0 })
          }
          const itemData = itemMap.get(key)
          itemData.quantity += item.quantity || 1
          itemData.revenue += (item.quantity || 1) * (parseFloat(item.price) || 0)
        })
      }
    })
    
    const popularItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    console.log('📈 Popular items calculated:', popularItems.length)

    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const revenueByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayOrders = orders.filter(order => {
        try {
          // Try different date field names
          const orderTimeField = order.order_time || order.order_date || order.orderTime
          if (!orderTimeField) return false
          const orderDate = new Date(orderTimeField)
          return orderDate.toISOString().split('T')[0] === dateStr
        } catch (error) {
          console.warn('❌ Error parsing order_time:', order.order_time, error)
          return false
        }
      })
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
      
      revenueByDay.push({
        date: dateStr,
        revenue: dayRevenue,
        orders: dayOrders.length
      })
    }

    console.log('📊 Revenue by day calculated:', revenueByDay)

    // Orders by hour
    const ordersByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: orders.filter(order => {
        try {
          // Try different date field names
          const orderTimeField = order.order_time || order.order_date || order.orderTime
          if (!orderTimeField) return false
          
          const orderHour = new Date(orderTimeField).getHours()
          return orderHour === hour
        } catch (error) {
          console.warn('❌ Invalid order_time format:', order.order_time)
          return false
        }
      }).length
    }))

    console.log('📊 Orders by hour calculated')

    setOrderAnalytics({
      totalRevenue,
      averageOrderValue,
      ordersByStatus,
      popularItems,
      revenueByDay,
      ordersByHour
    })
  }

  // Recalculate analytics when orders change
  useEffect(() => {
    console.log('🔄 Analytics useEffect triggered. Orders:', orders.length)
    console.log('📊 Sample order data:', orders[0])
    
    if (orders.length > 0) {
      try {
        calculateCustomerAnalytics(orders)
        calculateOrderAnalytics(orders)
      } catch (error) {
        console.error('❌ Error calculating analytics:', error)
        // Set default values to prevent crashes
        setCustomerAnalytics({
          totalCustomers: 0,
          newCustomers: 0,
          returningCustomers: 0,
          topCustomers: []
        })
        setOrderAnalytics({
          totalRevenue: 0,
          averageOrderValue: 0,
          ordersByStatus: {},
          popularItems: [],
          revenueByDay: [],
          ordersByHour: []
        })
      }
    } else {
      console.log('⚠️ No orders available for analytics')
      // Initialize with empty state when no orders
      setCustomerAnalytics({
        totalCustomers: 0,
        newCustomers: 0,
        returningCustomers: 0,
        topCustomers: []
      })
      setOrderAnalytics({
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {},
        popularItems: [],
        revenueByDay: [],
        ordersByHour: []
      })
    }
  }, [orders])

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await ApiService.updateOrderStatus(orderId, newStatus)
      
      // Update local state immediately for better UX
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                time_remaining: newStatus === 'cooking' ? order.estimated_time : order.time_remaining
              }
            : order
        )
      )
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      alert('Failed to update order status. Please try again.')
    }
  }

  const handleMenuItemToggle = async (itemId) => {
    try {
      const item = menuItems.find(item => item.id === itemId)
      const newAvailability = !item.available
      
      await ApiService.updateMenuItem(itemId, { available: newAvailability })
      
      setMenuItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, available: newAvailability } : item
        )
      )
    } catch (error) {
      console.error('❌ Error updating menu item:', error)
      alert('Failed to update menu item. Please try again.')
    }
  }

  const handleAddMenuItem = async (newItem) => {
    try {
      const addedItem = await ApiService.addMenuItem(newItem)
      setMenuItems(prevItems => [...prevItems, addedItem])
    } catch (error) {
      console.error('❌ Error adding menu item:', error)
      alert('Failed to add menu item. Please try again.')
    }
  }

  const handleUpdateLocation = async (locationId, updates) => {
    try {
      await ApiService.updateLocation(locationId, updates)
      setLocations(prevLocations =>
        prevLocations.map(location =>
          location.id === locationId ? { ...location, ...updates } : location
        )
      )
    } catch (error) {
      console.error('❌ Error updating location:', error)
      alert('Failed to update location. Please try again.')
    }
  }

  // Menu item modal functions
  const openAddMenuModal = () => {
    console.log('📦 Opening add menu modal')
    setEditingMenuItem(null)
    setMenuForm({
      name: '',
      description: '',
      price: '',
      category: '',
      emoji: '',
      available: true,
      image_url: '',
      imageFile: null
    })
    setShowMenuModal(true)
    console.log('📦 Modal state set to true')
  }

  const openEditMenuModal = (item) => {
    setEditingMenuItem(item)
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      emoji: item.emoji,
      available: item.available,
      image_url: item.image_url || '',
      imageFile: null
    })
    setShowMenuModal(true)
  }

  const closeMenuModal = () => {
    setShowMenuModal(false)
    setEditingMenuItem(null)
  }

  const handleMenuFormChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (name === 'imageFile') {
      setMenuForm(prev => ({ ...prev, imageFile: files[0] }))
    } else {
      setMenuForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const uploadImage = async (imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    
    const response = await fetch(`${API_BASE_URL}/api/upload-menu-image`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload image')
    }
    
    const data = await response.json()
    return data.imageUrl
  }

  const handleMenuSubmit = async (e) => {
    e.preventDefault()
    
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      alert('Please fill in all required fields')
      return
    }

    try {
      // Check if admin token exists
      const adminToken = localStorage.getItem('adminAccessToken')
      if (!adminToken) {
        alert('Admin authentication required. Please log in again.')
        onLogout()
        return
      }

      let imageUrl = menuForm.image_url

      // Upload new image if selected
      if (menuForm.imageFile) {
        console.log('📸 Uploading image...')
        imageUrl = await uploadImage(menuForm.imageFile)
        console.log('📸 Image uploaded successfully:', imageUrl)
      }

      const menuData = {
        name: menuForm.name,
        description: menuForm.description,
        price: parseFloat(menuForm.price),
        category: menuForm.category,
        emoji: menuForm.emoji,
        available: menuForm.available,
        image_url: imageUrl
      }

      console.log('📦 Submitting menu data:', menuData)

      if (editingMenuItem) {
        // Update existing item
        console.log('📝 Updating menu item:', editingMenuItem.id)
        await ApiService.updateMenuItem(editingMenuItem.id, menuData)
      } else {
        // Add new item
        console.log('📦 Adding new menu item')
        await ApiService.addMenuItem(menuData)
      }

      // Refresh menu items
      await loadMenuItems()
      closeMenuModal()
      alert('Menu item saved successfully!')
    } catch (error) {
      console.error('❌ Error saving menu item:', error)
      
      // Provide more specific error messages
      if (error.message.includes('authentication') || error.message.includes('401')) {
        alert('Authentication failed. Please log in again.')
        onLogout()
      } else if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
        alert('Image file is too large. Please use a smaller image (under 5MB).')
      } else if (error.message.includes('Invalid JSON')) {
        alert('Server response error. Please try again.')
      } else {
        alert(`Failed to save menu item: ${error.message}`)
      }
    }
  }

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return
    }

    try {
      await ApiService.deleteMenuItem(itemId)
      setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('❌ Error deleting menu item:', error)
      alert('Failed to delete menu item. Please try again.')
    }
  }

  // Location modal functions
  const openAddLocationModal = () => {
    setEditingLocation(null)
    setLocationForm({
      id: '',
      name: '',
      type: 'mobile',
      description: '',
      current_location: '',
      schedule: '',
      phone: '',
      status: 'active'
    })
    setShowLocationModal(true)
  }

  const openEditLocationModal = (location) => {
    setEditingLocation(location)
    setLocationForm({
      id: location.id,
      name: location.name,
      type: location.type,
      description: location.description || '',
      current_location: location.current_location || '',
      schedule: location.schedule || '',
      phone: location.phone || '',
      status: location.status
    })
    setShowLocationModal(true)
  }

  const closeLocationModal = () => {
    setShowLocationModal(false)
    setEditingLocation(null)
  }

  const handleLocationFormChange = (e) => {
    const { name, value } = e.target
    setLocationForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLocationSubmit = async (e) => {
    e.preventDefault()
    
    if (!locationForm.name.trim() || !locationForm.id.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const locationData = {
        id: locationForm.id.trim(),
        name: locationForm.name.trim(),
        type: locationForm.type,
        description: locationForm.description.trim(),
        current_location: locationForm.current_location.trim(),
        schedule: locationForm.schedule.trim(),
        phone: locationForm.phone.trim(),
        status: locationForm.status
      }

      if (editingLocation) {
        // Update existing location
        await ApiService.updateLocation(editingLocation.id, locationData)
        setLocations(prevLocations =>
          prevLocations.map(location =>
            location.id === editingLocation.id ? { ...location, ...locationData } : location
          )
        )
      } else {
        // Add new location
        const newLocation = await ApiService.addLocation(locationData)
        setLocations(prevLocations => [...prevLocations, newLocation])
      }

      closeLocationModal()
    } catch (error) {
      console.error('❌ Error saving location:', error)
      alert('Failed to save location. Please try again.')
    }
  }

  const handleDeleteLocation = async (locationId) => {
    try {
      if (window.confirm('Are you sure you want to delete this location?')) {
        await ApiService.deleteLocation(locationId)
        await loadLocations()
        alert('Location deleted successfully!')
      }
    } catch (error) {
      console.error('❌ Error deleting location:', error)
      alert('Failed to delete location. Please try again.')
    }
  }

  // Live Location Management Functions (New functionality)
  const openAddLiveLocationModal = () => {
    setEditingLiveLocation(null)
    setLiveLocationForm({
      truck_name: '',
      current_address: '',
      latitude: '',
      longitude: '',
      description: '',
      hours_today: '',
      is_active: true
    })
    setLocationError('') // Clear any previous location errors
    setShowLiveLocationModal(true)
  }

  const openEditLiveLocationModal = (liveLocation) => {
    setEditingLiveLocation(liveLocation)
    setLiveLocationForm({
      truck_name: liveLocation.truck_name,
      current_address: liveLocation.current_address,
      latitude: liveLocation.latitude || '',
      longitude: liveLocation.longitude || '',
      description: liveLocation.description || '',
      hours_today: liveLocation.hours_today || '',
      is_active: liveLocation.is_active
    })
    setLocationError('') // Clear any previous location errors
    setShowLiveLocationModal(true)
  }

  const closeLiveLocationModal = () => {
    setShowLiveLocationModal(false)
    setEditingLiveLocation(null)
    setLocationError('') // Clear location errors when closing modal
  }

  const handleLiveLocationFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setLiveLocationForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleLiveLocationSubmit = async (e) => {
    e.preventDefault()
    
    // Only require truck name - make address optional
    if (!liveLocationForm.truck_name.trim()) {
      alert('Please enter a truck name')
      return
    }

    try {
      const submitData = {
        ...liveLocationForm,
        // Use a default address if none provided
        current_address: liveLocationForm.current_address.trim() || 'Location update in progress...'
      }

      if (editingLiveLocation) {
        await ApiService.updateLiveLocation(editingLiveLocation.id, submitData)
        alert('Live location updated successfully!')
      } else {
        await ApiService.addLiveLocation(submitData)
        alert('Live location added successfully!')
      }
      await loadLiveLocations()
      closeLiveLocationModal()
    } catch (error) {
      console.error('❌ Error saving live location:', error)
      alert('Failed to save live location. Please try again.')
    }
  }

  const handleDeleteLiveLocation = async (liveLocationId) => {
    try {
      if (window.confirm('Are you sure you want to delete this live location?')) {
        await ApiService.deleteLiveLocation(liveLocationId)
        await loadLiveLocations()
        alert('Live location deleted successfully!')
      }
    } catch (error) {
      console.error('❌ Error deleting live location:', error)
      alert('Failed to delete live location. Please try again.')
    }
  }

  // Customer modal functions
  const openCustomerModal = async (customer) => {
    console.log('🔍 Opening customer modal for:', customer)
    console.log('🔍 Customer email:', customer?.email)
    console.log('🔍 Customer phone:', customer?.phone)
    console.log('🔍 Available orders:', orders.length)
    
    setSelectedCustomer(customer)
    setShowCustomerModal(true)
    setLoadingCustomerOrders(true)
    
    try {
      // Load customer's order history
      const customerKey = customer.email || customer.phone
      console.log('🔍 Looking for orders with customer key:', customerKey)
      
      const customerOrderHistory = orders.filter(order => {
        const matches = order.customer_email === customerKey || order.customer_phone === customerKey
        if (matches) {
          console.log('✅ Found matching order:', order.id, order.customer_email, order.customer_phone)
        }
        return matches
      })
      
      console.log('📋 Found customer orders:', customerOrderHistory.length)
      
      // Sort orders by date (newest first)
      const sortedOrders = customerOrderHistory.sort((a, b) => {
        const dateA = new Date(a.order_time || a.order_date || a.orderTime)
        const dateB = new Date(b.order_time || b.order_date || b.orderTime)
        return dateB - dateA
      })
      
      console.log('📋 Customer orders loaded and sorted:', sortedOrders.length)
      setCustomerOrders(sortedOrders)
    } catch (error) {
      console.error('❌ Error loading customer orders:', error)
      setCustomerOrders([])
    } finally {
      setLoadingCustomerOrders(false)
    }
  }

  const closeCustomerModal = () => {
    setShowCustomerModal(false)
    setSelectedCustomer(null)
    setCustomerOrders([])
    setLoadingCustomerOrders(false)
  }

  const sendEmailToCustomer = (customerEmail) => {
    if (!customerEmail) {
      alert('No email address available for this customer')
      return
    }
    
    const subject = encodeURIComponent("Message from Mo's Burritos Restaurant")
    const body = encodeURIComponent("Dear valued customer,\n\nThank you for choosing Mo's Burritos Restaurant!\n\nBest regards,\nMo's Burritos Team")
    const mailtoLink = `mailto:${customerEmail}?subject=${subject}&body=${body}`
    
    window.open(mailtoLink, '_blank')
  }

  // Order Management Functions
  const handleDeleteOrder = async (orderId, orderDetails) => {
    const confirmMessage = `Are you sure you want to delete Order #${orderId}?\n\nCustomer: ${orderDetails.customer_name}\nTotal: $${(parseFloat(orderDetails.total_amount) || 0).toFixed(2)}\n\nThis action cannot be undone.`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      setIsLoading(true)
      await ApiService.deleteOrder(orderId)
      
      // Remove from local state
      setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId))
      
      console.log(`🗑️ Order ${orderId} deleted successfully`)
      alert('Order deleted successfully')
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Failed to delete order. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetToCooking = async (orderId, orderDetails) => {
    const timeRemaining = window.prompt(
      `Reset Order #${orderId} to cooking status?\n\nCustomer: ${orderDetails.customer_name}\nCurrent Status: ${orderDetails.status}\n\nEnter cooking time in minutes:`, 
      '15'
    )
    
    if (timeRemaining === null) return // User canceled
    
    const cookingTime = parseInt(timeRemaining)
    if (isNaN(cookingTime) || cookingTime <= 0) {
      alert('Please enter a valid cooking time in minutes')
      return
    }

    try {
      setIsLoading(true)
      const updatedOrder = await ApiService.resetOrderToCooking(orderId, cookingTime)
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...updatedOrder, items: updatedOrder.items || order.items } : order
        )
      )
      
      console.log(`🔄 Order ${orderId} reset to cooking with ${cookingTime} minutes`)
      alert(`Order #${orderId} has been reset to cooking status with ${cookingTime} minutes`)
    } catch (error) {
      console.error('Error resetting order to cooking:', error)
      alert('Failed to reset order to cooking. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_payment': return '#ff9800'
      case 'pending': return '#ff9800'
      case 'confirmed': return '#2196f3'
      case 'cooking': return '#ff5722'
      case 'ready': return '#4caf50'
      case 'completed': return '#9e9e9e'
      case 'canceled': return '#f44336'
      default: return '#757575'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_payment': return <AlertCircle size={16} />
      case 'pending': return <AlertCircle size={16} />
      case 'confirmed': return <CheckCircle size={16} />
      case 'cooking': return <Timer size={16} />
      case 'ready': return <CheckCircle size={16} />
      case 'completed': return <CheckCircle size={16} />
      case 'canceled': return <XCircle size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  const formatOrderTime = (orderTime) => {
    const date = new Date(orderTime)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Order Management Tab
  const renderOrderManagementTab = () => {
    const getOrdersByStatus = (status) => {
      if (status === 'pending') {
        return orders.filter(order => order.status === 'pending' || order.status === 'pending_payment')
      }
      return orders.filter(order => order.status === status)
    }

    const toggleSection = (sectionKey) => {
      setExpandedSections(prev => ({
        ...prev,
        [sectionKey]: !prev[sectionKey]
      }))
    }

    const renderOrderSection = (title, status, orders, color, sectionKey) => (
      <div className="order-status-section">
        <div 
          className="status-section-header clickable" 
          style={{ borderColor: color }}
          onClick={() => toggleSection(sectionKey)}
        >
          <div className="header-content">
            <h3 style={{ color }}>{title}</h3>
            <span className="order-count">{orders.length} orders</span>
          </div>
          <div className="dropdown-arrow" style={{ color }}>
            {expandedSections[sectionKey] ? '▼' : '▶'}
          </div>
        </div>
        {expandedSections[sectionKey] && (
          <>
            {orders.length === 0 ? (
              <div className="empty-status-section">
                <p>No {title.toLowerCase()} orders</p>
              </div>
            ) : (
              <div className="status-orders-grid">
                {orders.map(order => (
                  <div key={order.id} className={`order-card-mini ${order.status}`}>
                    <div className="order-card-header">
                      <div className="order-id">#{order.id}</div>
                      <div className="order-time">{formatOrderTime(order.order_time)}</div>
                    </div>
                    
                    <div className="order-customer-mini">
                      <div className="customer-name">{order.customer_name}</div>
                      <div className="customer-contact">{order.customer_phone}</div>
                    </div>

                    <div className="order-items-mini">
                      {order.items && order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="item-mini">
                          {item.quantity}x {item.name}
                        </div>
                      ))}
                      {order.items && order.items.length > 2 && (
                        <div className="more-items-mini">+{order.items.length - 2} more</div>
                      )}
                    </div>

                    <div className="order-total-mini">
                      <strong>${(parseFloat(order.total_amount) || 0).toFixed(2)}</strong>
                    </div>

                    {status === 'cooking' && order.time_remaining > 0 && (
                      <div className="cooking-timer-mini">
                        <div className="timer-text">{order.time_remaining} min remaining</div>
                        <div className="progress-bar-mini">
                          <div 
                            className="progress-fill-mini"
                            style={{ 
                              width: `${((order.estimated_time - order.time_remaining) / order.estimated_time) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <div className="order-actions-mini">
                      {(order.status === 'pending' || order.status === 'pending_payment') && (
                        <>
                          <button 
                            className="btn-action confirm"
                            onClick={() => handleOrderStatusChange(order.id, 'confirmed')}
                          >
                            Confirm
                          </button>
                          <button 
                            className="btn-action cancel"
                            onClick={() => handleOrderStatusChange(order.id, 'canceled')}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <button 
                          className="btn-action cooking"
                          onClick={() => handleOrderStatusChange(order.id, 'cooking')}
                        >
                          Start Cooking
                        </button>
                      )}
                      {order.status === 'cooking' && (
                        <button 
                          className="btn-action ready"
                          onClick={() => handleOrderStatusChange(order.id, 'ready')}
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button 
                          className="btn-action complete"
                          onClick={() => handleOrderStatusChange(order.id, 'completed')}
                        >
                          Complete
                        </button>
                      )}
                      {(order.status === 'ready' || order.status === 'completed' || order.status === 'canceled') && (
                        <button 
                          className="btn-action reset"
                          onClick={() => handleResetToCooking(order.id, order)}
                          title="Reset order to cooking status"
                        >
                          <RotateCcw size={14} />
                          Reset
                        </button>
                      )}
                      <button 
                        className="btn-action delete"
                        onClick={() => handleDeleteOrder(order.id, order)}
                        title="Delete this order permanently"
                      >
                        <Trash size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    )

    return (
      <div className="order-management-section">
        <div className="section-header">
          <h2>Order Management</h2>
          <p>Manage orders by status for efficient workflow</p>
        </div>

        {/* Quick Stats */}
        <div className="order-management-stats">
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-number">{getOrdersByStatus('pending').length}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>
          <div className="stat-card cooking">
            <div className="stat-icon">👨‍🍳</div>
            <div className="stat-content">
              <div className="stat-number">{getOrdersByStatus('cooking').length}</div>
              <div className="stat-label">Cooking</div>
            </div>
          </div>
          <div className="stat-card ready">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-number">{getOrdersByStatus('ready').length}</div>
              <div className="stat-label">Ready</div>
            </div>
          </div>
          <div className="stat-card completed">
            <div className="stat-icon">🎉</div>
            <div className="stat-content">
              <div className="stat-number">{getOrdersByStatus('completed').length}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card canceled">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <div className="stat-number">{getOrdersByStatus('canceled').length}</div>
              <div className="stat-label">Canceled</div>
            </div>
          </div>
        </div>

        {/* Order Status Sections */}
        <div className="order-management-grid">
          {renderOrderSection('Pending Orders', 'pending', getOrdersByStatus('pending'), '#ff9800', 'section-pending')}
          {renderOrderSection('Cooking Orders', 'cooking', getOrdersByStatus('cooking'), '#ff5722', 'section-cooking')}
          {renderOrderSection('Ready Orders', 'ready', getOrdersByStatus('ready'), '#4caf50', 'section-ready')}
          {renderOrderSection('Completed Orders', 'completed', getOrdersByStatus('completed'), '#9e9e9e', 'section-completed')}
          {renderOrderSection('Canceled Orders', 'canceled', getOrdersByStatus('canceled'), '#f44336', 'section-canceled')}
        </div>
      </div>
    )
  }

  const renderMenuTab = () => (
    <div className="menu-section">
      <div className="section-header">
        <h2>Menu Management</h2>
        <button className="btn-add" onClick={openAddMenuModal}>
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {menuItems.length === 0 ? (
        <div className="empty-state">
          <MenuIcon size={48} />
          <h3>No menu items yet</h3>
          <p>Start building your menu by adding your first item.</p>
          <button className="btn-add-first" onClick={openAddMenuModal}>
            <Plus size={18} />
            Add First Menu Item
          </button>
        </div>
      ) : (
        <div className="menu-grid">
          {menuItems.map(item => (
            <div key={item.id} className={`menu-item-card ${!item.available ? 'unavailable' : ''}`}>
              <div className="menu-item-header">
                <div className="menu-emoji">{item.emoji}</div>
                <div className="menu-item-info">
                  <h3>{item.name}</h3>
                  <p className="menu-category">{item.category}</p>
                  <p className="menu-price">${(parseFloat(item.price) || 0).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="menu-item-actions">
                <button 
                  className={`availability-toggle ${item.available ? 'available' : 'unavailable'}`}
                  onClick={() => handleMenuItemToggle(item.id)}
                >
                  {item.available ? <Eye size={14} /> : <EyeOff size={14} />}
                  {item.available ? 'Available' : 'Unavailable'}
                </button>
                <button className="btn-edit" onClick={() => openEditMenuModal(item)}>
                  <Edit3 size={14} />
                </button>
                <button className="btn-delete" onClick={() => handleDeleteMenuItem(item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderLocationsTab = () => (
    <div className="locations-section">
      <div className="section-header">
        <h2>Scheduled Locations</h2>
        <button 
          className="btn-add"
          onClick={openAddLocationModal}
        >
          <Plus size={18} />
          Add Location
        </button>
      </div>

      {isLoadingLocations ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading locations...</p>
        </div>
      ) : (
        <div className="locations-grid">
          {locations.map((location) => (
            <div key={location.id} className="location-card">
              <div className="location-header">
                <h3 className="location-name">
                  <Building size={16} />
                  {location.name}
                </h3>
                <div className="location-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => openEditLocationModal(location)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteLocation(location.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="location-details">
                <p><strong>Type:</strong> {location.type}</p>
                {location.description && (
                  <p><strong>Description:</strong> {location.description}</p>
                )}
                {location.current_location && (
                  <p><strong>Current Location:</strong> {location.current_location}</p>
                )}
                {location.schedule && (
                  <p><strong>Schedule:</strong> {location.schedule}</p>
                )}
                {location.phone && (
                  <p><strong>Phone:</strong> {location.phone}</p>
                )}
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${location.status}`}>
                    {location.status}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // Live Locations Tab (New functionality)
  const renderLiveLocationsTab = () => (
    <div className="live-locations-section">
      <div className="section-header">
        <h2>Live Food Truck Locations</h2>
        <button 
          className="btn-add"
          onClick={openAddLiveLocationModal}
        >
          <Plus size={18} />
          Add Live Location
        </button>
      </div>

      {isLoadingLiveLocations ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading live locations...</p>
        </div>
      ) : (
        <div className="locations-grid">
          {liveLocations.map((liveLocation) => (
            <div key={liveLocation.id} className="location-card live-location-card">
              <div className="location-header">
                <h3 className="location-name">
                  <Truck size={16} />
                  {liveLocation.truck_name}
                </h3>
                <div className="location-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => openEditLiveLocationModal(liveLocation)}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteLiveLocation(liveLocation.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="location-details">
                <p><strong>Current Address:</strong> {liveLocation.current_address}</p>
                {liveLocation.description && (
                  <p><strong>Description:</strong> {liveLocation.description}</p>
                )}
                {liveLocation.hours_today && (
                  <p><strong>Hours Today:</strong> {liveLocation.hours_today}</p>
                )}
                {liveLocation.latitude && liveLocation.longitude && (
                  <p><strong>Coordinates:</strong> {liveLocation.latitude}, {liveLocation.longitude}</p>
                )}
                <p><strong>Status:</strong> 
                  <span className={`status-badge ${liveLocation.is_active ? 'active' : 'inactive'}`}>
                    {liveLocation.is_active ? 'Active' : 'Inactive'}
                  </span>
                </p>
                <p><strong>Last Updated:</strong> {new Date(liveLocation.last_updated).toLocaleString()}</p>
              </div>
            </div>
          ))}
          
          {liveLocations.length === 0 && (
            <div className="empty-state">
              <Navigation size={48} />
              <h3>No Live Locations Yet</h3>
              <p>Add your first live location to show customers where your food trucks are right now!</p>
              <button className="btn-add-first" onClick={openAddLiveLocationModal}>
                <Plus size={18} />
                Add First Live Location
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Business Settings</h2>
      </div>

      <form className="settings-form">
        <div className="form-group">
          <label>Business Name</label>
          <input
            type="text"
            value={businessSettings.businessName}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              businessName: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Tagline</label>
          <input
            type="text"
            value={businessSettings.tagline}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              tagline: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={businessSettings.phone}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              phone: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={businessSettings.email}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              email: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Facebook Page</label>
          <input
            type="url"
            value={businessSettings.facebook}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              facebook: e.target.value
            })}
          />
        </div>

        <button type="submit" className="btn-save">
          <Save size={18} />
          Save Changes
        </button>
      </form>
    </div>
  )

  // Analytics Tab
  const renderAnalyticsTab = () => (
    <div className="analytics-section">
      <div className="section-header">
        <h2>Analytics Dashboard</h2>
        <p>Customer insights and order analytics</p>
      </div>

      {/* Key Metrics Overview */}
      <div className="metrics-overview">
        <div className="metrics-grid">
          <div className="metric-card revenue">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <h3>Total Revenue</h3>
              <p className="metric-value">${orderAnalytics.totalRevenue.toFixed(2)}</p>
              <span className="metric-period">All time</span>
            </div>
          </div>
          <div className="metric-card orders">
            <div className="metric-icon">📋</div>
            <div className="metric-content">
              <h3>Total Orders</h3>
              <p className="metric-value">{orders.length}</p>
              <span className="metric-period">All time</span>
            </div>
          </div>
          <div className="metric-card customers">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <h3>Total Customers</h3>
              <p className="metric-value">{customerAnalytics.totalCustomers}</p>
              <span className="metric-period">Unique customers</span>
            </div>
          </div>
          <div className="metric-card average">
            <div className="metric-icon">📊</div>
            <div className="metric-content">
              <h3>Avg Order Value</h3>
              <p className="metric-value">${orderAnalytics.averageOrderValue.toFixed(2)}</p>
              <span className="metric-period">Per order</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Analytics Section */}
      <div className="analytics-row">
        <div className="analytics-card customer-analytics">
          <div className="card-header">
            <h3>Customer Analytics</h3>
            <span className="card-subtitle">Customer behavior and insights</span>
          </div>
          <div className="customer-stats">
            <div className="stat-row">
              <div className="stat-item">
                <span className="stat-label">New Customers (30 days)</span>
                <span className="stat-value new-customers">{customerAnalytics.newCustomers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Returning Customers</span>
                <span className="stat-value returning-customers">{customerAnalytics.returningCustomers}</span>
              </div>
            </div>
          </div>
          
          <div className="top-customers">
            <h4>Top Customers by Spending</h4>
            <div className="customers-list">
              {customerAnalytics.topCustomers.length > 0 ? (
                customerAnalytics.topCustomers.slice(0, 5).map((customer, index) => (
                  <div 
                    key={index} 
                    className="customer-item clickable" 
                    onClick={() => openCustomerModal(customer)}
                    title="Click to view customer details"
                  >
                    <div className="customer-rank">#{index + 1}</div>
                    <div className="customer-info">
                      <div className="customer-name">{customer.name}</div>
                      <div className="customer-contact">
                        {customer.phone}
                      </div>
                    </div>
                    <div className="customer-stats">
                      <div className="customer-spent">${customer.totalSpent.toFixed(2)}</div>
                      <div className="customer-orders">{customer.totalOrders} orders</div>
                    </div>
                    <div className="customer-actions">
                      {customer.email ? (
                        <button 
                          className="btn-email-mini"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent opening modal
                            sendEmailToCustomer(customer.email);
                          }}
                          title="Send email to customer"
                        >
                          <Mail size={14} />
                        </button>
                      ) : (
                        <span className="no-email-mini" title="No email available">📧</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-analytics">
                  <p>👥 No customer data available yet.</p>
                  <p>Customer analytics will appear here once orders are placed.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Analytics Section */}
        <div className="analytics-card order-analytics">
          <div className="card-header">
            <h3>Order Analytics</h3>
            <span className="card-subtitle">Order patterns and popular items</span>
          </div>
          
          <div className="order-status-breakdown">
            <h4>Orders by Status</h4>
            <div className="status-chart">
              {Object.entries(orderAnalytics.ordersByStatus).map(([status, count]) => (
                <div key={status} className="status-item">
                  <div className="status-bar">
                    <div 
                      className={`status-fill ${status}`}
                      style={{ 
                        width: `${(count / orders.length) * 100}%`,
                        backgroundColor: getStatusColor(status)
                      }}
                    ></div>
                  </div>
                  <div className="status-info">
                    <span className="status-name">{status.replace('_', ' ').toUpperCase()}</span>
                    <span className="status-count">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="popular-items">
            <h4>Most Popular Items</h4>
            <div className="items-list">
              {orderAnalytics.popularItems.length > 0 ? (
                orderAnalytics.popularItems.slice(0, 5).map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-rank">#{index + 1}</div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-stats">
                      <span className="item-quantity">{item.quantity} sold</span>
                      <span className="item-revenue">${item.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-analytics">
                  <p>🍽️ No item data available yet.</p>
                  <p>Popular items will appear here once orders are placed.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trends */}
      <div className="analytics-card revenue-trends">
        <div className="card-header">
          <h3>Revenue Trends (Last 7 Days)</h3>
          <span className="card-subtitle">Daily revenue and order count</span>
        </div>
        <div className="revenue-chart">
          {orderAnalytics.revenueByDay.length > 0 && orderAnalytics.revenueByDay.some(day => day.revenue > 0) ? (
            orderAnalytics.revenueByDay.map((day, index) => (
              <div key={index} className="day-column">
                <div className="day-bar">
                  <div 
                    className="revenue-bar"
                    style={{ 
                      height: `${Math.max(10, (day.revenue / Math.max(...orderAnalytics.revenueByDay.map(d => d.revenue))) * 100)}%` 
                    }}
                    title={`$${day.revenue.toFixed(2)}`}
                  ></div>
                </div>
                <div className="day-info">
                  <div className="day-date">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  <div className="day-revenue">${day.revenue.toFixed(0)}</div>
                  <div className="day-orders">{day.orders} orders</div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-analytics">
              <p>📊 No revenue data for the last 7 days.</p>
              <p>Revenue trends will appear here once orders are placed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // All Orders Tab (Original orders view)
  const renderOrdersTab = () => {
    if (isLoading) {
      return (
        <div className="orders-section">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="orders-section">
          <div className="error-state">
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Refresh Page</button>
          </div>
        </div>
      )
    }

    // Filter orders based on selected status
    const getFilteredOrders = () => {
      if (allOrdersFilter === 'all') {
        return orders
      }
      if (allOrdersFilter === 'pending') {
        return orders.filter(order => order.status === 'pending' || order.status === 'pending_payment' || order.status === 'confirmed')
      }
      return orders.filter(order => order.status === allOrdersFilter)
    }

    const filteredOrders = getFilteredOrders()

    const handleStatusFilter = (status) => {
      setAllOrdersFilter(status)
    }

    return (
      <div className="orders-section">
        <div className="section-header">
          <h2>All Orders</h2>
          {allOrdersFilter !== 'all' && (
            <button 
              className="btn-clear-filter"
              onClick={() => setAllOrdersFilter('all')}
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="order-stats">
          <div 
            className={`stat-card clickable ${allOrdersFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('all')}
          >
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">All Orders</span>
          </div>
          <div 
            className={`stat-card clickable ${allOrdersFilter === 'pending' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('pending')}
          >
            <span className="stat-number">{orders.filter(o => 
              o.status === 'pending' || o.status === 'pending_payment' || o.status === 'confirmed'
            ).length}</span>
            <span className="stat-label">Pending</span>
          </div>
          <div 
            className={`stat-card clickable ${allOrdersFilter === 'cooking' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('cooking')}
          >
            <span className="stat-number">{orders.filter(o => o.status === 'cooking').length}</span>
            <span className="stat-label">Cooking</span>
          </div>
          <div 
            className={`stat-card clickable ${allOrdersFilter === 'ready' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('ready')}
          >
            <span className="stat-number">{orders.filter(o => o.status === 'ready').length}</span>
            <span className="stat-label">Ready</span>
          </div>
          <div 
            className={`stat-card clickable ${allOrdersFilter === 'completed' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('completed')}
          >
            <span className="stat-number">{orders.filter(o => o.status === 'completed').length}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div 
            className={`stat-card clickable ${allOrdersFilter === 'canceled' ? 'active' : ''}`}
            onClick={() => handleStatusFilter('canceled')}
          >
            <span className="stat-number">{orders.filter(o => o.status === 'canceled').length}</span>
            <span className="stat-label">Canceled</span>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <ShoppingBag size={48} />
            <h3>
              {allOrdersFilter === 'all' 
                ? 'No orders yet' 
                : `${allOrdersFilter.charAt(0).toUpperCase() + allOrdersFilter.slice(1)} orders`
              }
            </h3>
            <p>
              {allOrdersFilter === 'all' 
                ? 'Orders will appear here when customers place them.' 
                : `${allOrdersFilter.charAt(0).toUpperCase() + allOrdersFilter.slice(1)} orders will appear here.`
              }
            </p>
            {allOrdersFilter !== 'all' && (
              <button 
                className="btn-clear-filter"
                onClick={() => setAllOrdersFilter('all')}
              >
                Show All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <div key={order.id} className={`order-card ${order.status}`}>
                <div className="order-header">
                  <div className="order-id">#{order.id}</div>
                  <div 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.toUpperCase()}
                  </div>
                </div>

                <div className="order-customer">
                  <h3>{order.customer_name}</h3>
                  <p>{order.customer_phone}</p>
                  <small>{formatOrderTime(order.order_time)}</small>
                </div>

                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${((item.quantity || 0) * (parseFloat(item.price) || 0)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  <strong>Total: ${(parseFloat(order.total_amount) || 0).toFixed(2)}</strong>
                </div>

                {order.status === 'cooking' && order.time_remaining > 0 && (
                  <div className="cooking-timer">
                    <div className="timer-header">
                      <Timer size={16} />
                      <span>Cooking - {order.time_remaining} min remaining</span>
                    </div>
                    <div className="enhanced-progress-bar">
                      <div 
                        className="enhanced-progress-fill"
                        style={{ 
                          width: `${((order.estimated_time - order.time_remaining) / order.estimated_time) * 100}%` 
                        }}
                      >
                        <div className="progress-shine"></div>
                      </div>
                      <div className="progress-text">
                        {Math.round(((order.estimated_time - order.time_remaining) / order.estimated_time) * 100)}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="order-actions">
                  {(order.status === 'pending' || order.status === 'pending_payment') && (
                    <>
                      <button 
                        className="btn-confirm"
                        onClick={() => handleOrderStatusChange(order.id, 'confirmed')}
                      >
                        Confirm Order
                      </button>
                      <button 
                        className="btn-cancel"
                        onClick={() => handleOrderStatusChange(order.id, 'canceled')}
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <button 
                      className="btn-cooking"
                      onClick={() => handleOrderStatusChange(order.id, 'cooking')}
                    >
                      Start Cooking
                    </button>
                  )}
                  {order.status === 'cooking' && (
                    <button 
                      className="btn-complete"
                      onClick={() => handleOrderStatusChange(order.id, 'ready')}
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button 
                      className="btn-complete"
                      onClick={() => handleOrderStatusChange(order.id, 'completed')}
                    >
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'analytics':
        return renderAnalyticsTab()
      case 'order-management':
        return renderOrderManagementTab()
      case 'orders':
        return renderOrdersTab()
      case 'menu':
        return renderMenuTab()
      case 'locations':
        return renderLocationsTab()
      case 'live-locations':
        return renderLiveLocationsTab()
      case 'settings':
        return renderSettingsTab()
      default:
        return null
    }
  }

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="dashboard-page">
        <DashboardHeader 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
        />
        <div className="dashboard-main">
          <div className="dashboard-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error screen if initialization failed
  if (error) {
    return (
      <div className="dashboard-page">
        <DashboardHeader 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
        />
        <div className="dashboard-main">
          <div className="dashboard-content">
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h3>Dashboard Error</h3>
              <p>{error}</p>
              <button 
                className="btn-primary" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
      />
      
      {/* Location Selector for Multi-Location Users */}
      {currentUser && (
        <div className="dashboard-location-bar">
          <AdminLocationSelector 
            user={currentUser}
            onLocationChange={handleLocationChange}
          />
          
          {/* Location Filter Controls */}
          {currentUser.assignedLocations && currentUser.assignedLocations.length > 1 && (
            <div className="location-filter-controls">
              <label>View Orders:</label>
              <select 
                value={selectedLocationFilter} 
                onChange={(e) => {
                  setSelectedLocationFilter(e.target.value)
                  // Reload orders when filter changes
                  setTimeout(() => loadOrders(), 100)
                }}
                className="location-filter-select"
              >
                <option value="all">All Locations</option>
                <option value="current">Current Location Only</option>
              </select>
            </div>
          )}
        </div>
      )}
      
      <div className="dashboard-main">
        <div className="dashboard-content">
          {renderActiveTab()}
        </div>

        {/* Menu Item Modal */}
        {showMenuModal && (
          <div className="modal-overlay" onClick={closeMenuModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                <button className="modal-close" onClick={closeMenuModal}>×</button>
              </div>
              
              <form onSubmit={handleMenuSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={menuForm.name}
                      onChange={handleMenuFormChange}
                      required
                      placeholder="e.g., Chicken Tacos"
                    />
                  </div>
                  <div className="form-group">
                    <label>Emoji</label>
                    <input
                      type="text"
                      name="emoji"
                      value={menuForm.emoji}
                      onChange={handleMenuFormChange}
                      placeholder="🌮"
                      maxLength="2"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Item Image</label>
                  <input
                    type="file"
                    name="imageFile"
                    onChange={handleMenuFormChange}
                    accept="image/*"
                    className="file-input"
                  />
                  {menuForm.image_url && (
                    <div className="current-image">
                      <p>Current image:</p>
                      <img 
                        src={menuForm.image_url.startsWith('data:') ? menuForm.image_url : `${API_BASE_URL}${menuForm.image_url}`} 
                        alt="Current menu item" 
                        className="preview-image"
                      />
                    </div>
                  )}
                  <small className="form-help">Upload an image to display instead of emoji (JPG, PNG, max 5MB)</small>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={menuForm.description}
                    onChange={handleMenuFormChange}
                    placeholder="Describe your delicious item..."
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={menuForm.price}
                      onChange={handleMenuFormChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="8.99"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <input
                      type="text"
                      name="category"
                      value={menuForm.category}
                      onChange={handleMenuFormChange}
                      required
                      placeholder="e.g., Tacos, Burritos, Drinks"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="available"
                      checked={menuForm.available}
                      onChange={handleMenuFormChange}
                    />
                    Available for ordering
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeMenuModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingMenuItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Location Modal */}
        {showLocationModal && (
          <div className="modal-overlay" onClick={closeLocationModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingLocation ? 'Edit Location' : 'Add Location'}</h3>
                <button className="modal-close" onClick={closeLocationModal}>×</button>
              </div>
              
              <form onSubmit={handleLocationSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Location ID *</label>
                    <input
                      type="text"
                      name="id"
                      value={locationForm.id}
                      onChange={handleLocationFormChange}
                      required
                      placeholder="food-truck-1"
                      disabled={editingLocation}
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={locationForm.type}
                      onChange={handleLocationFormChange}
                    >
                      <option value="mobile">Food Truck</option>
                      <option value="restaurant">Restaurant</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={locationForm.name}
                    onChange={handleLocationFormChange}
                    required
                    placeholder="Fernando's Food Truck"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={locationForm.description}
                    onChange={handleLocationFormChange}
                    placeholder="Brief description of this location..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Current Location</label>
                  <input
                    type="text"
                    name="current_location"
                    value={locationForm.current_location}
                    onChange={handleLocationFormChange}
                    placeholder="Campus Town - Green & Wright"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Schedule</label>
                    <input
                      type="text"
                      name="schedule"
                      value={locationForm.schedule}
                      onChange={handleLocationFormChange}
                      placeholder="Mon-Sat: 11AM-9PM"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={locationForm.phone}
                      onChange={handleLocationFormChange}
                      placeholder="(217) 255-0210"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={locationForm.status}
                    onChange={handleLocationFormChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeLocationModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingLocation ? 'Update Location' : 'Add Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Live Location Modal (New functionality) */}
        {showLiveLocationModal && (
          <div className="modal-overlay" onClick={closeLiveLocationModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingLiveLocation ? 'Edit Live Location' : 'Add Live Location'}</h3>
                <button className="modal-close" onClick={closeLiveLocationModal}>×</button>
              </div>
              
              <form onSubmit={handleLiveLocationSubmit} className="modal-form">
                <div className="form-group">
                  <label>Truck Name *</label>
                  <input
                    type="text"
                    name="truck_name"
                    value={liveLocationForm.truck_name}
                    onChange={handleLiveLocationFormChange}
                    required
                    placeholder="Fernando's Food Truck #1"
                  />
                </div>

                <div className="form-group">
                  <label>Current Address</label>
                  <input
                    type="text"
                    name="current_address"
                    value={liveLocationForm.current_address}
                    onChange={handleLiveLocationFormChange}
                    placeholder="123 Main Street, Downtown (optional - will auto-fill with location)"
                  />
                  <small className="form-help">
                    Address is optional. If you use "Use My Location", the address will be filled automatically.
                  </small>
                </div>

                <div className="form-group">
                  <label>Location Coordinates</label>
                  <div className="location-input-group">
                    <div className="coordinate-inputs">
                      <input
                        type="number"
                        name="latitude"
                        value={liveLocationForm.latitude}
                        onChange={handleLiveLocationFormChange}
                        step="any"
                        placeholder="Latitude"
                      />
                      <input
                        type="number"
                        name="longitude"
                        value={liveLocationForm.longitude}
                        onChange={handleLiveLocationFormChange}
                        step="any"
                        placeholder="Longitude"
                      />
                    </div>
                    <div className="location-buttons">
                      <button 
                        type="button" 
                        className={`btn-location ${isGettingLocation ? 'loading' : ''}`}
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                      >
                        <Navigation size={16} />
                        {isGettingLocation ? 'Getting Location...' : 'Use My Location'}
                      </button>
                      <button 
                        type="button" 
                        className="btn-location-clear"
                        onClick={() => {
                          setLiveLocationForm(prev => ({
                            ...prev,
                            latitude: '',
                            longitude: '',
                            current_address: ''
                          }))
                          setLocationError('') // Clear location errors when clearing coordinates
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  {locationError && (
                    <div className="location-error">
                      <span className="error-icon">⚠️</span>
                      {locationError}
                    </div>
                  )}
                  <small className="form-help">
                    Use "Use My Location" for automatic detection, or enter coordinates manually. Coordinates are optional but help customers find you more easily.
                  </small>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={liveLocationForm.description}
                    onChange={handleLiveLocationFormChange}
                    placeholder="Additional details about this location..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Hours Today</label>
                  <input
                    type="text"
                    name="hours_today"
                    value={liveLocationForm.hours_today}
                    onChange={handleLiveLocationFormChange}
                    placeholder="11:00 AM - 9:00 PM"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={liveLocationForm.is_active}
                      onChange={handleLiveLocationFormChange}
                    />
                    Active (visible to customers)
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeLiveLocationModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingLiveLocation ? 'Update Live Location' : 'Add Live Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Customer Modal */}
        {showCustomerModal && selectedCustomer && (
          <div className="modal-overlay" onClick={closeCustomerModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Customer Details</h3>
                <button className="modal-close" onClick={closeCustomerModal}>×</button>
              </div>
              
              <div className="customer-modal-content">
                <div className="customer-info">
                  <h3>{selectedCustomer?.name || 'Unknown Customer'}</h3>
                  {selectedCustomer?.phone && <p>📞 {selectedCustomer.phone}</p>}
                  <div className="customer-stats">
                    <p><strong>Total Orders:</strong> {selectedCustomer?.totalOrders || 0}</p>
                    <p><strong>Total Spent:</strong> ${(selectedCustomer?.totalSpent || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="customer-orders">
                  <h3>Order History ({customerOrders.length} orders)</h3>
                  {loadingCustomerOrders ? (
                    <div className="loading-orders">
                      <div className="loading-spinner"></div>
                      <p>Loading orders...</p>
                    </div>
                  ) : (
                    <div className="orders-list">
                      {customerOrders.length > 0 ? (
                        customerOrders.map((order, index) => (
                          <div key={index} className="order-item">
                            <div className="order-id">#{order.id}</div>
                            <div className="order-date">{new Date(order.order_time || order.order_date || order.orderTime).toLocaleDateString()}</div>
                            <div className="order-total">${(parseFloat(order.total_amount) || 0).toFixed(2)}</div>
                            <div className="order-status" style={{ color: getStatusColor(order.status) }}>
                              {order.status}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-orders">
                          <p>No orders found for this customer.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="customer-actions">
                  {selectedCustomer?.email ? (
                    <button 
                      type="button" 
                      className="btn-email"
                      onClick={() => sendEmailToCustomer(selectedCustomer.email)}
                    >
                      <Mail size={16} />
                      Send Email
                    </button>
                  ) : (
                    <div className="no-email-notice">
                      <p>📧 No email address available for this customer</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage 