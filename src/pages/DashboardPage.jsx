import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  MapPin, 
  Clock, 
  Menu as MenuIcon, 
  ShoppingBag, 
  Users, 
  User,
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
  Trash,
  UserPlus,
  Search,
  Filter,
  TrendingUp,
  Activity,
  Star,
  Heart,
  MessageSquare,
  DollarSign,
  Gift,
  RefreshCw,
  Package,
  X,
  ChefHat,
  BarChart3,
  ShoppingCart,
  AlertTriangle
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

  // Customer Management State
  const [customers, setCustomers] = useState([])
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [customerFilter, setCustomerFilter] = useState('all') // all, new, returning, vip
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [selectedCustomerView, setSelectedCustomerView] = useState('grid') // grid, list
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    newThisMonth: 0,
    returningCustomers: 0,
    vipCustomers: 0,
    averageOrderValue: 0,
    totalRevenue: 0
  })

  // Customer deletion state
  const [showDeleteCustomerModal, setShowDeleteCustomerModal] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState(null)
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('')
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false)

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
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false)

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

  // Menu Options Management state
  const [showOptionsModal, setShowOptionsModal] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState(null)
  const [menuItemOptions, setMenuItemOptions] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [showAddOptionModal, setShowAddOptionModal] = useState(false)
  const [editingOption, setEditingOption] = useState(null)
  const [optionForm, setOptionForm] = useState({
    name: '',
    description: '',
    option_type: 'radio',
    is_required: false,
    sort_order: 0,
    choices: []
  })

  // State for option templates
  const [optionTemplates, setOptionTemplates] = useState([])
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [selectedTemplates, setSelectedTemplates] = useState([])
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    option_type: 'radio',
    is_required: false,
    sort_order: 0,
    choices: []
  })

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
          loadLocations(),
          loadCustomers() // Load customers independently
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
          console.log('🔌 Attempting to connect to Socket.IO at:', API_BASE_URL)
          const newSocket = io(API_BASE_URL, {
            transports: ['websocket', 'polling'],
            timeout: 10000,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
          })
          setSocket(newSocket)

          // Socket connection events
          newSocket.on('connect', () => {
            console.log('✅ Socket.IO connected successfully')
            // Join admin room for real-time notifications
            newSocket.emit('join-admin')
            console.log('📡 Joined admin room for real-time updates')
          })

          newSocket.on('connect_error', (error) => {
            console.error('❌ Socket.IO connection error:', error)
          })

          newSocket.on('disconnect', (reason) => {
            console.warn('⚠️ Socket.IO disconnected:', reason)
          })

          newSocket.on('reconnect', (attemptNumber) => {
            console.log('🔄 Socket.IO reconnected after', attemptNumber, 'attempts')
            // Re-join admin room after reconnection
            newSocket.emit('join-admin')
          })

          // Listen for real-time order updates
          newSocket.on('orderUpdate', (updatedOrder) => {
            console.log('📊 Received order update via socket:', updatedOrder.id)
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            )
          })

          // Listen for new orders
          newSocket.on('new-order', (newOrder) => {
            console.log('🆕 Received new order via socket:', newOrder.id, newOrder.customer_name)
            setOrders(prevOrders => {
              // Check if order already exists to prevent duplicates
              const existingOrder = prevOrders.find(order => order.id === newOrder.id)
              if (existingOrder) {
                console.log('⚠️ Order already exists, updating instead of adding')
                return prevOrders.map(order =>
                  order.id === newOrder.id ? newOrder : order
                )
              }
              console.log('✅ Adding new order to dashboard')
              return [newOrder, ...prevOrders]
            })
            
            // Also recalculate analytics with the new order
            setTimeout(() => {
              calculateCustomerAnalytics([newOrder, ...orders])
              calculateOrderAnalytics([newOrder, ...orders])
            }, 100)
          })

          // Listen for order status updates  
          newSocket.on('order-updated', (updatedOrder) => {
            console.log('🔄 Received order status update via socket:', updatedOrder.id, updatedOrder.status)
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            )
          })

          // Listen for order deletions
          newSocket.on('orderDeleted', (deletedOrderId) => {
            console.log('🗑️ Received order deletion via socket:', deletedOrderId)
            setOrders(prevOrders =>
              prevOrders.filter(order => order.id !== deletedOrderId)
            )
          })

          // Test socket connection
          setTimeout(() => {
            if (newSocket.connected) {
              console.log('✅ Socket.IO connection verified - real-time updates active')
            } else {
              console.warn('⚠️ Socket.IO not connected - orders may not update automatically')
            }
          }, 2000)

        } catch (socketError) {
          console.warn('❌ Socket.IO connection failed, continuing without real-time updates:', socketError)
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

  // Load data on component mount
  useEffect(() => {
    loadOrders()
    loadMenuItems()
    loadCustomers()
    loadLiveLocations()
    loadOptionTemplates()
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
  const loadOrders = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setIsLoadingOrders(true)
      }
      console.log('🔄 Loading orders from API...')
      
      const ordersData = await ApiService.getOrders()
      
      console.log('📊 Orders loaded:', ordersData?.length || 0)
      console.log('📋 Sample order:', ordersData?.[0])
      
      setOrders(ordersData || [])
      
      // Calculate analytics from orders
      calculateCustomerAnalytics(ordersData || [])
      calculateOrderAnalytics(ordersData || [])
      
      // No longer need to trigger customer loading here since it's loaded independently
    } catch (error) {
      console.error('❌ Error loading orders:', error)
      setError('Failed to load orders. Please try again.')
    } finally {
      if (showLoadingIndicator) {
        setIsLoadingOrders(false)
      }
    }
  }

  // Manual refresh function
  const handleRefreshOrders = async () => {
    console.log('🔄 Manual refresh triggered')
    await loadOrders(true)
  }

  // Set up automatic refresh every 30 seconds as backup
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (!socket || !socket.connected) {
        console.log('🔄 Socket not connected, auto-refreshing orders...')
        loadOrders(false) // Don't show loading indicator for background refresh
      }
    }, 30000) // 30 seconds

    return () => clearInterval(refreshInterval)
  }, [socket])

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

  const loadOptionTemplates = async () => {
    try {
      const templates = await ApiService.getOptionTemplates()
      setOptionTemplates(templates)
    } catch (error) {
      console.error('Error loading option templates:', error)
    }
  }

  // Calculate customer analytics from orders
  const calculateCustomerAnalytics = (orders) => {
    const registeredCustomers = new Map() // customers with user_id
    const guestCustomers = new Map() // customers without user_id
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    // Process orders to build customer database
    orders.forEach(order => {
      const orderDate = new Date(order.created_at || order.order_time)
      
      if (order.user_id && order.user_id !== '') {
        // This is a registered customer order
        const customerId = order.user_id
        
        if (!registeredCustomers.has(customerId)) {
          registeredCustomers.set(customerId, {
            id: customerId,
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
            firstOrderDate: orderDate,
            lastOrderDate: orderDate,
            totalOrders: 0,
            totalSpent: 0,
            orders: [],
            isNew: orderDate > oneMonthAgo,
            isRegistered: true,
            favoriteItems: new Map(),
            preferredLocations: new Map(),
            ordersByMonth: new Map(),
            averageOrderValue: 0,
            daysSinceLastOrder: 0,
            orderFrequency: 0,
            preferredOrderTime: null,
            seasonality: {
              spring: 0, summer: 0, fall: 0, winter: 0
            },
            lifecycle: 'new',
            retentionScore: 0
          })
        }
        
        const customer = registeredCustomers.get(customerId)
        customer.totalOrders += 1
        customer.totalSpent += parseFloat(order.total_amount)
        customer.orders.push(order)
        customer.lastOrderDate = orderDate > customer.lastOrderDate ? orderDate : customer.lastOrderDate
        
        // Update customer info with latest order data (in case profile was incomplete)
        if (order.customer_name && !customer.name) customer.name = order.customer_name
        if (order.customer_email && !customer.email) customer.email = order.customer_email
        if (order.customer_phone && !customer.phone) customer.phone = order.customer_phone
        
        // Track favorite items
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const itemName = item.name
            const currentCount = customer.favoriteItems.get(itemName) || 0
            customer.favoriteItems.set(itemName, currentCount + item.quantity)
          })
        }
        
        // Track preferred locations
        if (order.location_name) {
          const currentCount = customer.preferredLocations.get(order.location_name) || 0
          customer.preferredLocations.set(order.location_name, currentCount + 1)
        }
        
        // Track orders by month for trend analysis
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`
        const monthCount = customer.ordersByMonth.get(monthKey) || 0
        customer.ordersByMonth.set(monthKey, monthCount + 1)
        
        // Track seasonality
        const month = orderDate.getMonth()
        if (month >= 2 && month <= 4) customer.seasonality.spring++
        else if (month >= 5 && month <= 7) customer.seasonality.summer++
        else if (month >= 8 && month <= 10) customer.seasonality.fall++
        else customer.seasonality.winter++
        
      } else {
        // This is a guest customer order (no user_id)
        const customerId = order.customer_phone || order.customer_email || `${order.customer_name}-${order.id}`
        
        if (!guestCustomers.has(customerId)) {
          guestCustomers.set(customerId, {
            id: customerId,
            name: order.customer_name,
            email: order.customer_email,
            phone: order.customer_phone,
            firstOrderDate: orderDate,
            lastOrderDate: orderDate,
            totalOrders: 0,
            totalSpent: 0,
            orders: [],
            isNew: orderDate > oneMonthAgo,
            isRegistered: false,
            favoriteItems: new Map(),
            preferredLocations: new Map(),
            ordersByMonth: new Map(),
            averageOrderValue: 0,
            daysSinceLastOrder: 0,
            orderFrequency: 0,
            preferredOrderTime: null,
            seasonality: {
              spring: 0, summer: 0, fall: 0, winter: 0
            },
            lifecycle: 'new',
            retentionScore: 0
          })
        }
        
        const customer = guestCustomers.get(customerId)
        customer.totalOrders += 1
        customer.totalSpent += parseFloat(order.total_amount)
        customer.orders.push(order)
        customer.lastOrderDate = orderDate > customer.lastOrderDate ? orderDate : customer.lastOrderDate
        
        // Track favorite items
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const itemName = item.name
            const currentCount = customer.favoriteItems.get(itemName) || 0
            customer.favoriteItems.set(itemName, currentCount + item.quantity)
          })
        }
        
        // Track preferred locations
        if (order.location_name) {
          const currentCount = customer.preferredLocations.get(order.location_name) || 0
          customer.preferredLocations.set(order.location_name, currentCount + 1)
        }
        
        // Track orders by month for trend analysis
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`
        const monthCount = customer.ordersByMonth.get(monthKey) || 0
        customer.ordersByMonth.set(monthKey, monthCount + 1)
        
        // Track seasonality
        const month = orderDate.getMonth()
        if (month >= 2 && month <= 4) customer.seasonality.spring++
        else if (month >= 5 && month <= 7) customer.seasonality.summer++
        else if (month >= 8 && month <= 10) customer.seasonality.fall++
        else customer.seasonality.winter++
      }
    })
    
    // Calculate derived metrics for all customers
    const allCustomers = [...registeredCustomers.values(), ...guestCustomers.values()]
    
    allCustomers.forEach((customer) => {
      // Average order value
      customer.averageOrderValue = customer.totalSpent / customer.totalOrders
      
      // Days since last order
      const now = new Date()
      customer.daysSinceLastOrder = Math.floor((now - customer.lastOrderDate) / (1000 * 60 * 60 * 24))
      
      // Order frequency (orders per month)
      const daysSinceFirst = Math.floor((now - customer.firstOrderDate) / (1000 * 60 * 60 * 24))
      const monthsSinceFirst = Math.max(1, daysSinceFirst / 30)
      customer.orderFrequency = customer.totalOrders / monthsSinceFirst
      
      // Preferred order time (most common hour)
      const hourCounts = new Map()
      customer.orders.forEach(order => {
        const hour = new Date(order.created_at || order.order_time).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      })
      if (hourCounts.size > 0) {
        const mostCommonHour = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        customer.preferredOrderTime = `${mostCommonHour}:00`
      }
      
      // Customer lifecycle determination
      if (customer.totalSpent > 200) {
        customer.lifecycle = 'vip'
      } else if (customer.daysSinceLastOrder > 90) {
        customer.lifecycle = 'churned'
      } else if (customer.daysSinceLastOrder > 30) {
        customer.lifecycle = 'at_risk'
      } else if (customer.totalOrders > 1) {
        customer.lifecycle = 'active'
      } else {
        customer.lifecycle = 'new'
      }
      
      // Retention score (0-100)
      let score = 0
      if (customer.totalOrders > 1) score += 20
      if (customer.totalOrders > 5) score += 20
      if (customer.daysSinceLastOrder < 30) score += 30
      if (customer.orderFrequency > 1) score += 20
      if (customer.totalSpent > 100) score += 10
      customer.retentionScore = score
    })
    
    // Update customer database state
    setCustomerDatabase(new Map([...registeredCustomers, ...guestCustomers]))
    
    // Sort by total spent
    const topCustomers = allCustomers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
    
    const totalCustomers = allCustomers.length
    const registeredCustomersCount = registeredCustomers.size
    const guestCustomersCount = guestCustomers.size
    const newCustomers = allCustomers.filter(c => c.isNew).length
    const returningCustomers = allCustomers.filter(c => c.totalOrders > 1).length
    const vipCustomers = allCustomers.filter(c => c.lifecycle === 'vip').length
    const atRiskCustomers = allCustomers.filter(c => c.lifecycle === 'at_risk').length
    const churnedCustomers = allCustomers.filter(c => c.lifecycle === 'churned').length
    
    // Calculate advanced metrics
    const totalRevenue = allCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0)
    const averageCustomerValue = totalRevenue / totalCustomers || 0
    const averageOrdersPerCustomer = allCustomers.reduce((sum, c) => sum + c.totalOrders, 0) / totalCustomers || 0
    const highValueCustomers = allCustomers.filter(c => c.totalSpent > 100).length
    const activeCustomers = allCustomers.filter(c => c.daysSinceLastOrder < 30).length
    
    const analytics = {
      totalCustomers,
      registeredCustomersCount,
      guestCustomersCount,
      newCustomers,
      returningCustomers,
      vipCustomers,
      atRiskCustomers,
      churnedCustomers,
      highValueCustomers,
      activeCustomers,
      averageCustomerValue,
      averageOrdersPerCustomer,
      totalRevenue,
      topCustomers: topCustomers.map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalSpent: customer.totalSpent,
        totalOrders: customer.totalOrders,
        lastOrderDate: customer.lastOrderDate,
        lifecycle: customer.lifecycle,
        retentionScore: customer.retentionScore,
        daysSinceLastOrder: customer.daysSinceLastOrder,
        orderFrequency: customer.orderFrequency,
        preferredOrderTime: customer.preferredOrderTime,
        isRegistered: customer.isRegistered,
        favoriteItem: customer.favoriteItems.size > 0 
          ? Array.from(customer.favoriteItems.entries()).sort((a, b) => b[1] - a[1])[0][0]
          : 'N/A',
        preferredLocation: customer.preferredLocations.size > 0
          ? Array.from(customer.preferredLocations.entries()).sort((a, b) => b[1] - a[1])[0][0]
          : 'N/A'
      }))
    }
    
    setCustomerAnalytics(analytics)
    
    // Also update customers state for the customer tab (use the comprehensive customer list)
    setCustomers(allCustomers)
    
    // Calculate customer stats with enhanced metrics
    const averageOrderValue = totalRevenue / orders.length || 0
    
    setCustomerStats({
      totalCustomers,
      registeredCustomersCount,
      guestCustomersCount,
      newThisMonth: newCustomers,
      returningCustomers,
      vipCustomers,
      atRiskCustomers,
      churnedCustomers,
      highValueCustomers,
      activeCustomers,
      averageOrderValue,
      averageCustomerValue,
      averageOrdersPerCustomer,
      totalRevenue
    })
    
    console.log('📊 Customer Analytics Updated:', {
      total: totalCustomers,
      registered: registeredCustomersCount,
      guest: guestCustomersCount,
      new: newCustomers,
      returning: returningCustomers,
      vip: vipCustomers,
      atRisk: atRiskCustomers,
      active: activeCustomers
    })
    
    return analytics
  }

  const calculateOrderAnalytics = (orders) => {
    console.log('📊 calculateOrderAnalytics called with orders:', orders.length)
    
    const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0
    
    // Orders by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})

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

    // Revenue by day (last 7 days)
    const revenueByDay = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayOrders = orders.filter(order => {
        try {
          const orderTimeField = order.order_time || order.order_date || order.orderTime
          if (!orderTimeField) return false
          const orderDate = new Date(orderTimeField)
          return orderDate.toISOString().split('T')[0] === dateStr
        } catch (error) {
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

    // Orders by hour
    const ordersByHour = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: orders.filter(order => {
        try {
          const orderTimeField = order.order_time || order.order_date || order.orderTime
          if (!orderTimeField) return false
          const orderHour = new Date(orderTimeField).getHours()
          return orderHour === hour
        } catch (error) {
          return false
        }
      }).length
    }))

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
    if (orders.length > 0) {
      try {
        calculateCustomerAnalytics(orders)
        calculateOrderAnalytics(orders)
      } catch (error) {
        console.error('❌ Error calculating analytics:', error)
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
          <div className="section-header-actions">
            <button 
              className="btn-refresh"
              onClick={handleRefreshOrders}
              disabled={isLoadingOrders}
              title="Refresh orders"
            >
              <RefreshCw size={18} className={isLoadingOrders ? 'spinning' : ''} />
              {isLoadingOrders ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
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
                <button 
                  className="btn-templates" 
                  onClick={() => openTemplatesModal(item)}
                  title="Manage Option Templates"
                >
                  <Settings size={14} />
                  Templates ({item.options?.filter(opt => opt.source === 'template').length || 0})
                </button>
                <button 
                  className="btn-options" 
                  onClick={() => openOptionsModal(item)}
                  title="Manage Custom Options"
                >
                  <Settings size={14} />
                  Custom ({item.options?.filter(opt => opt.source === 'direct').length || 0})
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
          <div className="section-header-actions">
            <button 
              className="btn-refresh"
              onClick={handleRefreshOrders}
              disabled={isLoadingOrders}
              title="Refresh orders"
            >
              <RefreshCw size={18} className={isLoadingOrders ? 'spinning' : ''} />
              {isLoadingOrders ? 'Refreshing...' : 'Refresh'}
            </button>
            {allOrdersFilter !== 'all' && (
              <button 
                className="btn-clear-filter"
                onClick={() => setAllOrdersFilter('all')}
              >
                Clear Filter
              </button>
            )}
          </div>
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
      case 'customers':
        return renderCustomersTab()
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

  // Customer Management Tab Render Function
  const renderCustomersTab = () => {
    const filteredCustomers = getFilteredCustomers()

    return (
      <div className="customers-section">
        <div className="section-header">
          <h2>Customer Management</h2>
          <div className="customer-actions">
            <div className="view-toggle">
              <button 
                className={`view-btn ${selectedCustomerView === 'grid' ? 'active' : ''}`}
                onClick={() => setSelectedCustomerView('grid')}
              >
                Grid
              </button>
              <button 
                className={`view-btn ${selectedCustomerView === 'list' ? 'active' : ''}`}
                onClick={() => setSelectedCustomerView('list')}
              >
                List
              </button>
            </div>
          </div>
        </div>

        {/* Customer Stats Overview */}
        <div className="customer-stats-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Users size={32} />
              </div>
              <div className="stat-content">
                <h3>Total Customers</h3>
                <div className="stat-value">{customerStats.totalCustomers}</div>
                <small>{customerStats.registeredCustomersCount || 0} registered • {customerStats.guestCustomersCount || 0} guest</small>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <UserPlus size={32} />
              </div>
              <div className="stat-content">
                <h3>New This Month</h3>
                <div className="stat-value">{customerStats.newThisMonth}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Heart size={32} />
              </div>
              <div className="stat-content">
                <h3>Returning</h3>
                <div className="stat-value">{customerStats.returningCustomers}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Star size={32} />
              </div>
              <div className="stat-content">
                <h3>VIP Customers</h3>
                <div className="stat-value">{customerStats.vipCustomers}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={32} />
              </div>
              <div className="stat-content">
                <h3>Avg Order Value</h3>
                <div className="stat-value">${customerStats.averageOrderValue.toFixed(2)}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Activity size={32} />
              </div>
              <div className="stat-content">
                <h3>Total Revenue</h3>
                <div className="stat-value">${customerStats.totalRevenue.toFixed(2)}</div>
              </div>
            </div>
            <div className="stat-card at-risk">
              <div className="stat-icon">
                <AlertCircle size={32} />
              </div>
              <div className="stat-content">
                <h3>At Risk</h3>
                <div className="stat-value">{customerStats.atRiskCustomers || 0}</div>
                <small>Customers who haven't ordered in 30+ days</small>
              </div>
            </div>
            <div className="stat-card active">
              <div className="stat-icon">
                <CheckCircle size={32} />
              </div>
              <div className="stat-content">
                <h3>Active Customers</h3>
                <div className="stat-value">{customerStats.activeCustomers || 0}</div>
                <small>Ordered within last 30 days</small>
              </div>
            </div>
            <div className="stat-card high-value">
              <div className="stat-icon">
                <Target size={32} />
              </div>
              <div className="stat-content">
                <h3>High Value</h3>
                <div className="stat-value">{customerStats.highValueCustomers || 0}</div>
                <small>$100+ lifetime spending</small>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="customer-controls">
          <div className="search-section">
            <div className="search-box">
              <Search size={20} />
              <input
                type="text"
                placeholder="Search customers by name, email, or phone..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filter-section">
            <Filter size={20} />
            <select 
              value={customerFilter} 
              onChange={(e) => setCustomerFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Customers</option>
              <option value="new">New Customers</option>
              <option value="active">Active Customers</option>
              <option value="returning">Returning</option>
              <option value="vip">VIP Customers</option>
              <option value="at_risk">At Risk</option>
              <option value="churned">Churned</option>
              <option value="registered">Registered Only</option>
              <option value="guest">Guest Only</option>
              <option value="no_orders">No Orders Yet</option>
            </select>
          </div>
        </div>

        {/* Customer List/Grid */}
        {isLoadingCustomers ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <Users size={64} />
            <h3>No customers found</h3>
            <p>
              {customerSearchTerm || customerFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Customers will appear here as orders are placed.'
              }
            </p>
          </div>
        ) : (
          <div className={`customers-container ${selectedCustomerView}`}>
            {selectedCustomerView === 'grid' ? (
              <div className="customers-grid">
                {filteredCustomers.map((customer) => {
                  const segment = getCustomerSegment(customer)
                  const segmentColor = getCustomerSegmentColor(segment)
                  const favoriteItem = customer.favoriteItems.size > 0 
                    ? Array.from(customer.favoriteItems.entries()).sort((a, b) => b[1] - a[1])[0][0]
                    : 'None'
                  const preferredLocation = customer.preferredLocations.size > 0
                    ? Array.from(customer.preferredLocations.entries()).sort((a, b) => b[1] - a[1])[0][0]
                    : 'None'

                  return (
                    <div 
                      key={customer.id} 
                      className="customer-card"
                      onClick={() => openCustomerDetailModal(customer)}
                    >
                      <div className="customer-header">
                        <div className="customer-avatar">
                          <User size={24} />
                        </div>
                        <div 
                          className="customer-segment"
                          style={{ backgroundColor: segmentColor }}
                        >
                          {segment}
                        </div>
                      </div>
                      
                      <div className="customer-info">
                        <h4>{customer.name}</h4>
                        <p className="customer-contact">
                          {customer.email && <span><Mail size={14} /> {customer.email}</span>}
                          {customer.phone && <span><Phone size={14} /> {customer.phone}</span>}
                        </p>
                        <div className="customer-type">
                          <span className={`type-badge ${customer.isRegistered ? 'registered' : 'guest'}`}>
                            {customer.isRegistered ? '👤 Registered' : '👥 Guest'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="customer-stats">
                        <div className="stat-row">
                          <span className="stat-label">Orders:</span>
                          <span className="stat-value">{customer.totalOrders}</span>
                        </div>
                        <div className="stat-row">
                          <span className="stat-label">Total Spent:</span>
                          <span className="stat-value">${customer.totalSpent.toFixed(2)}</span>
                        </div>
                        {customer.totalOrders > 0 ? (
                          <>
                            <div className="stat-row">
                              <span className="stat-label">Favorite:</span>
                              <span className="stat-value">{favoriteItem}</span>
                            </div>
                            <div className="stat-row">
                              <span className="stat-label">Location:</span>
                              <span className="stat-value">{preferredLocation}</span>
                            </div>
                          </>
                        ) : (
                          <div className="stat-row">
                            <span className="stat-label">Status:</span>
                            <span className="stat-value">No orders yet</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="customer-footer">
                        <span className="customer-since">
                          {customer.isRegistered 
                            ? `Registered ${formatCustomerSince(customer.registeredDate)}`
                            : customer.totalOrders > 0 
                              ? `Customer since ${formatCustomerSince(customer.firstOrderDate)}`
                              : 'New customer'
                          }
                        </span>
                        <div className="customer-actions">
                          {customer.email && (
                            <button 
                              className="btn-email-mini"
                              onClick={(e) => {
                                e.stopPropagation()
                                sendEmailToCustomer(customer.email)
                              }}
                              title="Send Email"
                            >
                              <Mail size={14} />
                            </button>
                          )}
                          <button 
                            className="btn-delete-mini"
                            onClick={(e) => handleDeleteCustomer(customer, e)}
                            title="Delete Customer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="customers-list">
                <div className="list-header">
                  <div className="col-customer">Customer</div>
                  <div className="col-segment">Segment</div>
                  <div className="col-orders">Orders</div>
                  <div className="col-spent">Total Spent</div>
                  <div className="col-favorite">Favorite Item</div>
                  <div className="col-location">Preferred Location</div>
                  <div className="col-since">Customer Since</div>
                  <div className="col-actions">Actions</div>
                </div>
                
                {filteredCustomers.map((customer) => {
                  const segment = getCustomerSegment(customer)
                  const segmentColor = getCustomerSegmentColor(segment)
                  const favoriteItem = customer.favoriteItems.size > 0 
                    ? Array.from(customer.favoriteItems.entries()).sort((a, b) => b[1] - a[1])[0][0]
                    : 'None'
                  const preferredLocation = customer.preferredLocations.size > 0
                    ? Array.from(customer.preferredLocations.entries()).sort((a, b) => b[1] - a[1])[0][0]
                    : 'None'

                  return (
                    <div 
                      key={customer.id} 
                      className="customer-row"
                      onClick={() => openCustomerDetailModal(customer)}
                    >
                      <div className="col-customer">
                        <div className="customer-info">
                          <div className="customer-avatar-small">
                            <User size={20} />
                          </div>
                          <div>
                            <h5>{customer.name}</h5>
                            <p>
                              {customer.email && <span>{customer.email}</span>}
                              {customer.phone && <span>{customer.phone}</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-segment">
                        <span 
                          className="segment-badge"
                          style={{ backgroundColor: segmentColor }}
                        >
                          {segment}
                        </span>
                      </div>
                      <div className="col-orders">{customer.totalOrders}</div>
                      <div className="col-spent">${customer.totalSpent.toFixed(2)}</div>
                      <div className="col-favorite">{favoriteItem}</div>
                      <div className="col-location">{preferredLocation}</div>
                      <div className="col-since">{formatCustomerSince(customer.firstOrderDate)}</div>
                      <div className="col-actions">
                        {customer.email && (
                          <button 
                            className="btn-email-mini"
                            onClick={(e) => {
                              e.stopPropagation()
                              sendEmailToCustomer(customer.email)
                            }}
                            title="Send Email"
                          >
                            <Mail size={14} />
                          </button>
                        )}
                        <button 
                          className="btn-delete-mini"
                          onClick={(e) => handleDeleteCustomer(customer, e)}
                          title="Delete Customer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
        
        <div className="customer-summary">
          <div className="customer-summary-stats">
            <div className="stat">
              <span className="stat-icon">👥</span>
              <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
            </div>
            <div className="stat">
              <span className="stat-icon">👤</span>
              <span>{customers.filter(c => c.isRegistered).length} registered</span>
            </div>
            <div className="stat">
              <span className="stat-icon">🛒</span>
              <span>{customers.filter(c => !c.isRegistered).length} guest</span>
            </div>
            <div className="stat">
              <span className="stat-icon">📦</span>
              <span>{customers.filter(c => c.totalOrders === 0).length} without orders</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Customer Management Functions
  const loadCustomers = async () => {
    try {
      setIsLoadingCustomers(true)
      console.log('🔄 Loading all customers from API...')
      
      // Get comprehensive customer data from the new endpoint
      const customerData = await ApiService.getAllCustomers()
      console.log('📊 Customer data received:', customerData)
      
      if (customerData && customerData.customers) {
        const allCustomers = customerData.customers.map(customer => {
          // Calculate enhanced analytics for each customer
          const now = new Date()
          const daysSinceLastOrder = customer.lastOrderDate 
            ? Math.floor((now - new Date(customer.lastOrderDate)) / (1000 * 60 * 60 * 24))
            : null
          
          // Determine lifecycle based on order history and registration status
          let lifecycle = 'new'
          if (customer.totalSpent > 200) {
            lifecycle = 'vip'
          } else if (daysSinceLastOrder && daysSinceLastOrder > 90) {
            lifecycle = 'churned'
          } else if (daysSinceLastOrder && daysSinceLastOrder > 30) {
            lifecycle = 'at_risk'
          } else if (customer.totalOrders > 1) {
            lifecycle = 'active'
          } else if (customer.isRegistered && customer.totalOrders === 0) {
            lifecycle = 'new'
          }
          
          return {
            ...customer,
            daysSinceLastOrder: daysSinceLastOrder || 0,
            lifecycle,
            isNew: customer.isRegistered && customer.totalOrders === 0,
            averageOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0,
            favoriteItems: new Map(), // Will be populated from order analysis if needed
            preferredLocations: new Map(), // Will be populated from order analysis if needed
            retentionScore: calculateRetentionScore(customer, daysSinceLastOrder)
          }
        })
        
        setCustomers(allCustomers)
        
        // Update customer stats
        const stats = {
          totalCustomers: allCustomers.length,
          newThisMonth: allCustomers.filter(c => c.isNew || (c.registeredDate && new Date(c.registeredDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))).length,
          returningCustomers: allCustomers.filter(c => c.totalOrders > 1).length,
          vipCustomers: allCustomers.filter(c => c.lifecycle === 'vip').length,
          atRiskCustomers: allCustomers.filter(c => c.lifecycle === 'at_risk').length,
          churnedCustomers: allCustomers.filter(c => c.lifecycle === 'churned').length,
          activeCustomers: allCustomers.filter(c => c.lifecycle === 'active').length,
          highValueCustomers: allCustomers.filter(c => c.totalSpent > 100).length,
          averageOrderValue: customerData.summary.totalOrders > 0 ? customerData.summary.totalRevenue / customerData.summary.totalOrders : 0,
          totalRevenue: customerData.summary.totalRevenue
        }
        
        setCustomerStats(stats)
        
        console.log('✅ Customers loaded successfully:', {
          total: allCustomers.length,
          registered: allCustomers.filter(c => c.isRegistered).length,
          guest: allCustomers.filter(c => !c.isRegistered).length,
          withOrders: allCustomers.filter(c => c.totalOrders > 0).length,
          withoutOrders: allCustomers.filter(c => c.totalOrders === 0).length
        })
      }
    } catch (error) {
      console.error('❌ Error loading customers:', error)
      // Fallback to order-based customer analytics if the new endpoint fails
      if (orders.length > 0) {
        console.log('🔄 Falling back to order-based customer analytics...')
        calculateCustomerAnalytics(orders)
      }
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  // Helper function to calculate retention score
  const calculateRetentionScore = (customer, daysSinceLastOrder) => {
    let score = 0
    if (customer.totalOrders > 1) score += 20
    if (customer.totalOrders > 5) score += 20
    if (daysSinceLastOrder !== null && daysSinceLastOrder < 30) score += 30
    if (customer.totalOrders > 0 && customer.totalSpent / customer.totalOrders > 20) score += 20 // High avg order value
    if (customer.totalSpent > 100) score += 10
    return score
  }

  const getFilteredCustomers = () => {
    let filtered = customers.filter(customer => {
      const searchMatch = customerSearchTerm === '' || 
        customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(customerSearchTerm.toLowerCase())) ||
        (customer.phone && customer.phone.includes(customerSearchTerm))
      
      if (!searchMatch) return false
      
      switch (customerFilter) {
        case 'new': return customer.isNew
        case 'active': return customer.lifecycle === 'active'
        case 'returning': return customer.totalOrders > 1
        case 'vip': return customer.lifecycle === 'vip'
        case 'at_risk': return customer.lifecycle === 'at_risk'
        case 'churned': return customer.lifecycle === 'churned'
        case 'registered': return customer.isRegistered
        case 'guest': return !customer.isRegistered
        case 'no_orders': return customer.totalOrders === 0
        default: return true
      }
    })
    
    return filtered.sort((a, b) => b.totalSpent - a.totalSpent)
  }

  const openCustomerDetailModal = async (customer) => {
    try {
      setLoadingCustomerOrders(true)
      setShowCustomerDetailModal(true)
      
      // Debug logging to see customer data structure
      console.log('🔍 Customer data received:', customer)
      
      // Ensure we have basic customer info with fallbacks
      const customerName = customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer'
      const customerEmail = customer.email || customer.customer_email || null
      const customerPhone = customer.phone || customer.customer_phone || null
      
      console.log('📋 Processed customer info:', {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        isRegistered: customer.isRegistered,
        id: customer.id
      })
      
      // Enhanced customer order matching logic
      let detailedOrders = []
      
      if (customer.isRegistered && customer.id && customer.id.startsWith('USER-')) {
        // For registered customers, FIRST try to match by user_id
        detailedOrders = orders.filter(order => order.user_id === customer.id)
        console.log(`🔍 Found ${detailedOrders.length} orders by user_id for registered customer ${customer.id}`)
        
        // If no orders found by user_id, also check by contact info (for legacy orders before user_id was properly set)
        if (detailedOrders.length === 0) {
          console.log('🔍 No orders found by user_id, checking by contact info for legacy orders...')
          const legacyOrders = orders.filter(order => {
            // Only match orders without user_id to avoid duplicating orders from other users
            if (order.user_id && order.user_id !== customer.id) return false
            
            const phoneMatch = customerPhone && order.customer_phone === customerPhone
            const emailMatch = customerEmail && order.customer_email === customerEmail
            const nameMatch = customerName && order.customer_name === customerName
            return phoneMatch || emailMatch || nameMatch
          })
          detailedOrders = legacyOrders
          console.log(`🔍 Found ${legacyOrders.length} legacy orders by contact info`)
        }
      } else {
        // For guest customers, match by phone/email/name combination
        // Exclude orders that have a user_id (those belong to registered customers)
        detailedOrders = orders.filter(order => {
          // Skip orders that belong to registered users
          if (order.user_id && order.user_id !== '') return false
          
          const phoneMatch = customerPhone && order.customer_phone === customerPhone
          const emailMatch = customerEmail && order.customer_email === customerEmail
          const nameMatch = customerName && order.customer_name === customerName
          return phoneMatch || emailMatch || nameMatch
        })
        console.log(`🔍 Found ${detailedOrders.length} orders for guest customer`)
      }
      
      // Calculate customer insights
      const favoriteItems = new Map()
      const preferredLocations = new Map()
      const ordersByMonth = new Map()
      let totalSpent = 0
      let lastOrderDate = null
      
      detailedOrders.forEach(order => {
        // Parse items safely
        let orderItems = []
        try {
          orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
        } catch (e) {
          console.warn('Failed to parse order items:', order.items)
        }
        
        // Count favorite items
        orderItems.forEach(item => {
          const itemName = item.name || 'Unknown Item'
          favoriteItems.set(itemName, (favoriteItems.get(itemName) || 0) + (item.quantity || 1))
        })
        
        // Count preferred locations
        if (order.location_name) {
          preferredLocations.set(order.location_name, (preferredLocations.get(order.location_name) || 0) + 1)
        }
        
        // Track spending and dates
        totalSpent += parseFloat(order.total_amount) || 0
        const orderDate = new Date(order.order_date || order.created_at)
        if (!lastOrderDate || orderDate > lastOrderDate) {
          lastOrderDate = orderDate
        }
        
        // Track orders by month for trends
        const monthKey = `${orderDate.getFullYear()}-${orderDate.getMonth()}`
        ordersByMonth.set(monthKey, (ordersByMonth.get(monthKey) || 0) + 1)
      })
      
      // Calculate additional metrics
      const avgOrderValue = detailedOrders.length > 0 ? totalSpent / detailedOrders.length : 0
      const daysSinceLastOrder = lastOrderDate ? Math.floor((new Date() - lastOrderDate) / (1000 * 60 * 60 * 24)) : null
      const customerLifetime = customer.registeredDate ? 
        Math.floor((new Date() - new Date(customer.registeredDate)) / (1000 * 60 * 60 * 24)) : 
        (customer.firstOrderDate ? Math.floor((new Date() - new Date(customer.firstOrderDate)) / (1000 * 60 * 60 * 24)) : 0)
      
      // Determine customer lifecycle status
      let lifecycle = 'new'
      if (detailedOrders.length === 0 && customer.isRegistered) {
        lifecycle = 'registered_no_orders'
      } else if (totalSpent > 200 && detailedOrders.length > 10) {
        lifecycle = 'vip'
      } else if (daysSinceLastOrder && daysSinceLastOrder > 90) {
        lifecycle = 'churned'
      } else if (daysSinceLastOrder && daysSinceLastOrder > 30) {
        lifecycle = 'at_risk'
      } else if (detailedOrders.length > 3) {
        lifecycle = 'active'
      }
      
      // Create enhanced customer object with guaranteed basic info
      const enhancedCustomer = {
        ...customer,
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        totalOrders: detailedOrders.length,
        totalSpent: totalSpent,
        avgOrderValue: avgOrderValue,
        lastOrderDate: lastOrderDate,
        daysSinceLastOrder: daysSinceLastOrder,
        customerLifetime: customerLifetime,
        lifecycle: lifecycle,
        favoriteItems: favoriteItems,
        preferredLocations: preferredLocations,
        ordersByMonth: ordersByMonth,
        // Calculate frequency metrics
        orderFrequency: customerLifetime > 0 ? (detailedOrders.length / (customerLifetime / 30)) : 0, // orders per month
        retentionScore: calculateRetentionScore(customer, daysSinceLastOrder)
      }
      
      console.log('✅ Enhanced customer object:', enhancedCustomer)
      setSelectedCustomer(enhancedCustomer)
      setCustomerOrders(detailedOrders)
      
    } catch (error) {
      console.error('Error loading customer details:', error)
      // Still show modal with basic info if calculation fails
      const fallbackCustomer = {
        ...customer,
        name: customer.name || `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
        email: customer.email || customer.customer_email || null,
        phone: customer.phone || customer.customer_phone || null,
        favoriteItems: new Map(),
        preferredLocations: new Map(),
        ordersByMonth: new Map(),
        totalOrders: customer.totalOrders || 0,
        totalSpent: customer.totalSpent || 0,
        avgOrderValue: customer.totalOrders > 0 ? (customer.totalSpent || 0) / customer.totalOrders : 0,
        lifecycle: 'unknown',
        retentionScore: 0
      }
      setSelectedCustomer(fallbackCustomer)
      setCustomerOrders([])
    } finally {
      setLoadingCustomerOrders(false)
    }
  }

  const closeCustomerDetailModal = () => {
    setShowCustomerDetailModal(false)
    setSelectedCustomer(null)
    setCustomerOrders([])
  }

  const sendEmailToCustomer = (customerEmail) => {
    if (customerEmail) {
      window.open(`mailto:${customerEmail}`, '_blank')
    }
  }

  const getCustomerSegment = (customer) => {
    if (customer.lifecycle) {
      switch (customer.lifecycle) {
        case 'vip': return 'VIP'
        case 'active': return 'Active'
        case 'at_risk': return 'At Risk'
        case 'churned': return 'Churned'
        case 'new': return 'New'
        default: return 'Regular'
      }
    }
    if (customer.totalSpent > 100) return 'VIP'
    if (customer.totalOrders > 3) return 'Loyal'
    if (customer.isNew) return 'New'
    return 'Regular'
  }

  const getCustomerSegmentColor = (segment) => {
    switch (segment) {
      case 'VIP': return '#ff6b35'
      case 'Active': return '#4CAF50'
      case 'At Risk': return '#FF9800'
      case 'Churned': return '#f44336'
      case 'New': return '#2196F3'
      default: return '#9E9E9E'
    }
  }

  const formatCustomerSince = (date) => {
    const now = new Date()
    const customerDate = new Date(date)
    const diffMonths = (now.getFullYear() - customerDate.getFullYear()) * 12 + (now.getMonth() - customerDate.getMonth())
    
    if (diffMonths < 1) return 'This month'
    if (diffMonths === 1) return '1 month ago'
    if (diffMonths < 12) return `${diffMonths} months ago`
    
    const years = Math.floor(diffMonths / 12)
    return years === 1 ? '1 year ago' : `${years} years ago`
  }

  // Customer deletion functions
  const handleDeleteCustomer = (customer, event) => {
    event.stopPropagation() // Prevent opening customer detail modal
    setCustomerToDelete(customer)
    setShowDeleteCustomerModal(true)
    setDeleteConfirmPassword('')
  }

  const confirmDeleteCustomer = async () => {
    if (!deleteConfirmPassword.trim()) {
      alert('Please enter your password to confirm deletion')
      return
    }

    if (!customerToDelete) return

    try {
      setIsDeletingCustomer(true)
      
      const response = await fetch(`/api/admin/customers/${customerToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          confirmPassword: deleteConfirmPassword
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete customer')
      }

      // Remove customer from local state
      setCustomers(prevCustomers => 
        prevCustomers.filter(c => c.id !== customerToDelete.id)
      )

      // Remove customer's orders from orders state
      setOrders(prevOrders => 
        prevOrders.filter(order => 
          customerToDelete.isRegistered 
            ? order.user_id !== customerToDelete.id
            : !(order.customer_phone === customerToDelete.phone || 
                order.customer_email === customerToDelete.email ||
                order.customer_name === customerToDelete.name)
        )
      )

      console.log(`✅ Customer ${customerToDelete.name} deleted successfully`)
      alert(`Customer ${customerToDelete.name} and all related data deleted successfully`)
      
      // Close modal
      setShowDeleteCustomerModal(false)
      setCustomerToDelete(null)
      setDeleteConfirmPassword('')

      // Refresh analytics
      await loadCustomers()

    } catch (error) {
      console.error('❌ Error deleting customer:', error)
      alert(`Failed to delete customer: ${error.message}`)
    } finally {
      setIsDeletingCustomer(false)
    }
  }

  const cancelDeleteCustomer = () => {
    setShowDeleteCustomerModal(false)
    setCustomerToDelete(null)
    setDeleteConfirmPassword('')
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

  // Menu Options Management Functions
  const openOptionsModal = async (menuItem) => {
    setSelectedMenuItem(menuItem)
    setShowOptionsModal(true)
    await loadMenuItemOptions(menuItem.id)
  }

  const closeOptionsModal = () => {
    setShowOptionsModal(false)
    setSelectedMenuItem(null)
    setMenuItemOptions([])
    setEditingOption(null)
    setShowAddOptionModal(false)
    resetOptionForm()
  }

  const loadMenuItemOptions = async (itemId) => {
    try {
      setIsLoadingOptions(true)
      const response = await ApiService.get(`/menu/${itemId}/options`)
      setMenuItemOptions(response || [])
    } catch (error) {
      console.error('Error loading menu item options:', error)
    } finally {
      setIsLoadingOptions(false)
    }
  }

  const openAddOptionModal = () => {
    setShowAddOptionModal(true)
    resetOptionForm()
  }

  const openEditOptionModal = (option) => {
    setEditingOption(option)
    setOptionForm({
      name: option.name,
      description: option.description || '',
      option_type: option.option_type,
      is_required: option.is_required,
      sort_order: option.sort_order,
      choices: option.choices || []
    })
    setShowAddOptionModal(true)
  }

  const closeAddOptionModal = () => {
    setShowAddOptionModal(false)
    setEditingOption(null)
    resetOptionForm()
  }

  const resetOptionForm = () => {
    setOptionForm({
      name: '',
      description: '',
      option_type: 'radio',
      is_required: false,
      sort_order: 0,
      choices: []
    })
  }

  const handleOptionFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setOptionForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addChoice = () => {
    setOptionForm(prev => ({
      ...prev,
      choices: [...prev.choices, { name: '', price_modifier: 0, sort_order: prev.choices.length }]
    }))
  }

  const updateChoice = (index, field, value) => {
    setOptionForm(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => 
        i === index ? { ...choice, [field]: value } : choice
      )
    }))
  }

  const removeChoice = (index) => {
    setOptionForm(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }))
  }

  const handleOptionSubmit = async (e) => {
    e.preventDefault()
    
    if (!selectedMenuItem) return

    try {
      const optionData = {
        ...optionForm,
        choices: optionForm.choices.filter(choice => choice.name.trim() !== '')
      }

      if (editingOption) {
        // Update existing option
        await ApiService.put(`/menu/${selectedMenuItem.id}/options/${editingOption.id}`, optionData)
      } else {
        // Add new option
        await ApiService.post(`/menu/${selectedMenuItem.id}/options`, optionData)
      }

      // Reload options and menu items
      await loadMenuItemOptions(selectedMenuItem.id)
      await loadMenuItems()
      closeAddOptionModal()
    } catch (error) {
      console.error('Error saving option:', error)
      alert('Failed to save option. Please try again.')
    }
  }

  const handleDeleteOption = async (optionId) => {
    if (window.confirm('Are you sure you want to delete this option? This will remove it from all orders.')) {
      try {
        const menuItemId = selectedMenuItem.id
        await ApiService.delete(`/menu/${menuItemId}/options/${optionId}`)
        await loadMenuItemOptions(menuItemId)
        alert('Option deleted successfully!')
      } catch (error) {
        console.error('Error deleting option:', error)
        alert('Failed to delete option. Please try again.')
      }
    }
  }

  // Location Management Functions

  // Option Templates Functions
  const openTemplatesModal = async (menuItem) => {
    setSelectedMenuItem(menuItem)
    setShowTemplatesModal(true)
    
    try {
      // Load currently assigned templates
      const assignedTemplates = await ApiService.getMenuItemTemplates(menuItem.id)
      setSelectedTemplates(assignedTemplates.map(t => t.id))
    } catch (error) {
      console.error('Error loading menu item templates:', error)
      setSelectedTemplates([])
    }
  }

  const closeTemplatesModal = () => {
    setShowTemplatesModal(false)
    setSelectedMenuItem(null)
    setSelectedTemplates([])
  }

  const handleTemplateSelection = (templateId) => {
    setSelectedTemplates(prev => {
      if (prev.includes(templateId)) {
        return prev.filter(id => id !== templateId)
      } else {
        return [...prev, templateId]
      }
    })
  }

  const saveTemplateAssignments = async () => {
    if (!selectedMenuItem) return

    try {
      await ApiService.assignTemplatesToMenuItem(selectedMenuItem.id, selectedTemplates)
      await loadMenuItems() // Refresh menu items to show new options
      closeTemplatesModal()
      alert('Templates assigned successfully!')
    } catch (error) {
      console.error('Error assigning templates:', error)
      alert('Failed to assign templates. Please try again.')
    }
  }

  const openCreateTemplateModal = () => {
    setEditingTemplate(null)
    setTemplateForm({
      name: '',
      description: '',
      option_type: 'radio',
      is_required: false,
      sort_order: 0,
      choices: []
    })
    setShowCreateTemplateModal(true)
  }

  const openEditTemplateModal = (template) => {
    setEditingTemplate(template)
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      option_type: template.option_type,
      is_required: template.is_required,
      sort_order: template.sort_order,
      choices: template.choices || []
    })
    setShowCreateTemplateModal(true)
  }

  const closeCreateTemplateModal = () => {
    setShowCreateTemplateModal(false)
    setEditingTemplate(null)
    setTemplateForm({
      name: '',
      description: '',
      option_type: 'radio',
      is_required: false,
      sort_order: 0,
      choices: []
    })
  }

  const handleTemplateFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setTemplateForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const addTemplateChoice = () => {
    setTemplateForm(prev => ({
      ...prev,
      choices: [...prev.choices, { name: '', price_modifier: 0, sort_order: prev.choices.length }]
    }))
  }

  const updateTemplateChoice = (index, field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      choices: prev.choices.map((choice, i) => 
        i === index ? { ...choice, [field]: value } : choice
      )
    }))
  }

  const removeTemplateChoice = (index) => {
    setTemplateForm(prev => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== index)
    }))
  }

  const handleTemplateSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const templateData = {
        ...templateForm,
        choices: templateForm.choices.filter(choice => choice.name.trim() !== '')
      }

      if (editingTemplate) {
        await ApiService.updateOptionTemplate(editingTemplate.id, templateData)
      } else {
        await ApiService.createOptionTemplate(templateData)
      }

      await loadOptionTemplates()
      closeCreateTemplateModal()
      alert(editingTemplate ? 'Template updated successfully!' : 'Template created successfully!')
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    }
  }

  const handleDeleteTemplate = async (template) => {
    if (window.confirm(`Are you sure you want to delete the "${template.name}" template? This will remove it from all menu items that use it.`)) {
      try {
        await ApiService.deleteOptionTemplate(template.id)
        await loadOptionTemplates()
        await loadMenuItems() // Refresh menu items
        alert('Template deleted successfully!')
      } catch (error) {
        console.error('Error deleting template:', error)
        alert('Failed to delete template. Please try again.')
      }
    }
  }

  // Menu item functions

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

        {/* Customer Detail Modal */}
        {showCustomerDetailModal && selectedCustomer && (
          <div className="modal-overlay" onClick={closeCustomerDetailModal}>
            <div className="modal-content customer-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Customer Profile</h3>
                <button className="modal-close" onClick={closeCustomerDetailModal}>×</button>
              </div>
              
              <div className="customer-detail-content">
                {/* Customer Header */}
                <div className="customer-profile-header">
                  <div className="customer-avatar-large">
                    <User size={48} />
                  </div>
                  <div className="customer-header-info">
                    <h2>{selectedCustomer.name}</h2>
                    <div className="customer-badges">
                      <span 
                        className="segment-badge large"
                        style={{ backgroundColor: getCustomerSegmentColor(getCustomerSegment(selectedCustomer)) }}
                      >
                        {getCustomerSegment(selectedCustomer)} Customer
                      </span>
                      <span className={`type-badge ${selectedCustomer.isRegistered ? 'registered' : 'guest'}`}>
                        {selectedCustomer.isRegistered ? '👤 Registered' : '👥 Guest'}
                      </span>
                    </div>
                    <div className="customer-contact-info">
                      {selectedCustomer.email && (
                        <div className="contact-item">
                          <Mail size={16} />
                          <span>{selectedCustomer.email}</span>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="contact-item">
                          <Phone size={16} />
                          <span>{selectedCustomer.phone}</span>
                        </div>
                      )}
                      <div className="contact-item">
                        <Calendar size={16} />
                        <span>
                          {selectedCustomer.isRegistered ? 'Registered' : 'First order'} {formatCustomerSince(selectedCustomer.registeredDate || selectedCustomer.firstOrderDate)}
                        </span>
                      </div>
                      {selectedCustomer.customerLifetime > 0 && (
                        <div className="contact-item">
                          <Clock size={16} />
                          <span>Customer for {selectedCustomer.customerLifetime} days</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Customer Stats */}
                <div className="customer-stats-section">
                  <div className="stats-row">
                    <div className="stat-item">
                      <div className="stat-icon">
                        <ShoppingBag size={24} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{selectedCustomer.totalOrders}</span>
                        <span className="stat-label">Total Orders</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">
                        <DollarSign size={24} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">${selectedCustomer.totalSpent.toFixed(2)}</span>
                        <span className="stat-label">Total Spent</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">
                        <Target size={24} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">
                          ${selectedCustomer.avgOrderValue.toFixed(2)}
                        </span>
                        <span className="stat-label">Avg Order Value</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-icon">
                        <TrendingUp size={24} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">
                          {selectedCustomer.orderFrequency.toFixed(1)}
                        </span>
                        <span className="stat-label">Orders/Month</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional Stats Row */}
                  <div className="stats-row">
                    {selectedCustomer.lastOrderDate && (
                      <div className="stat-item">
                        <div className="stat-icon">
                          <Clock size={24} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-value">
                            {selectedCustomer.daysSinceLastOrder === 0 ? 'Today' : 
                             selectedCustomer.daysSinceLastOrder === 1 ? '1 day ago' :
                             `${selectedCustomer.daysSinceLastOrder} days ago`}
                          </span>
                          <span className="stat-label">Last Order</span>
                        </div>
                      </div>
                    )}
                    <div className="stat-item">
                      <div className="stat-icon">
                        <Heart size={24} />
                      </div>
                      <div className="stat-info">
                        <span className="stat-value">{selectedCustomer.retentionScore}%</span>
                        <span className="stat-label">Retention Score</span>
                      </div>
                    </div>
                    {selectedCustomer.lifecycle === 'registered_no_orders' && (
                      <div className="stat-item">
                        <div className="stat-icon">
                          <AlertCircle size={24} />
                        </div>
                        <div className="stat-info">
                          <span className="stat-value">0</span>
                          <span className="stat-label">Orders Placed</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Insights */}
                <div className="customer-insights">
                  <div className="insights-grid">
                    {/* Favorite Items */}
                    <div className="insight-card">
                      <h4>
                        <Star size={20} />
                        Favorite Items
                      </h4>
                      <div className="favorite-items">
                        {selectedCustomer.favoriteItems && selectedCustomer.favoriteItems.size > 0 ? (
                          Array.from(selectedCustomer.favoriteItems.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([item, count], index) => (
                              <div key={index} className="favorite-item">
                                <span className="item-name">{item}</span>
                                <span className="item-count">×{count}</span>
                              </div>
                            ))
                        ) : (
                          <p className="no-data">
                            {selectedCustomer.totalOrders === 0 ? 'No orders yet' : 'No favorite items data'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Preferred Locations */}
                    <div className="insight-card">
                      <h4>
                        <MapPin size={20} />
                        Preferred Locations
                      </h4>
                      <div className="preferred-locations">
                        {selectedCustomer.preferredLocations && selectedCustomer.preferredLocations.size > 0 ? (
                          Array.from(selectedCustomer.preferredLocations.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([location, count], index) => (
                              <div key={index} className="preferred-location">
                                <span className="location-name">{location}</span>
                                <span className="location-count">{count} orders</span>
                              </div>
                            ))
                        ) : (
                          <p className="no-data">
                            {selectedCustomer.totalOrders === 0 ? 'No orders yet' : 'No location preference data'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Customer Status & Lifecycle */}
                    <div className="insight-card">
                      <h4>
                        <Activity size={20} />
                        Customer Status
                      </h4>
                      <div className="customer-status-info">
                        <div className="status-item">
                          <span className="status-label">Lifecycle Stage:</span>
                          <span className={`status-value lifecycle-${selectedCustomer.lifecycle}`}>
                            {selectedCustomer.lifecycle === 'registered_no_orders' ? 'Registered (No Orders)' :
                             selectedCustomer.lifecycle === 'vip' ? 'VIP Customer' :
                             selectedCustomer.lifecycle === 'active' ? 'Active Customer' :
                             selectedCustomer.lifecycle === 'at_risk' ? 'At Risk' :
                             selectedCustomer.lifecycle === 'churned' ? 'Churned' :
                             'New Customer'}
                          </span>
                        </div>
                        {selectedCustomer.totalOrders > 0 && (
                          <div className="status-item">
                            <span className="status-label">Customer Value:</span>
                            <span className="status-value">
                              {selectedCustomer.totalSpent > 200 ? 'High Value' :
                               selectedCustomer.totalSpent > 50 ? 'Medium Value' : 'Low Value'}
                            </span>
                          </div>
                        )}
                        {selectedCustomer.isRegistered && selectedCustomer.totalOrders === 0 && (
                          <div className="status-item">
                            <span className="status-label">Opportunity:</span>
                            <span className="status-value opportunity">First Order Needed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order History */}
                <div className="customer-order-history">
                  <h4>
                    <Activity size={20} />
                    Recent Order History
                    {customerOrders.length > 0 && (
                      <span className="order-count-badge">({customerOrders.length} total)</span>
                    )}
                  </h4>
                  {loadingCustomerOrders ? (
                    <div className="loading-orders">
                      <div className="loading-spinner"></div>
                      <p>Loading order history...</p>
                    </div>
                  ) : customerOrders.length > 0 ? (
                    <div className="order-history-list">
                      {customerOrders
                        .sort((a, b) => new Date(b.order_date || b.created_at) - new Date(a.order_date || a.created_at))
                        .slice(0, 5)
                        .map((order, index) => (
                          <div key={index} className="order-history-item">
                            <div className="order-info">
                              <div className="order-header">
                                <span className="order-id">#{order.id}</span>
                                <span className="order-date">
                                  {new Date(order.order_date || order.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              <div className="order-details">
                                {(() => {
                                  let orderItems = []
                                  try {
                                    orderItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
                                  } catch (e) {
                                    orderItems = []
                                  }
                                  return orderItems.length > 0 && (
                                    <div className="order-items-preview">
                                      {orderItems.slice(0, 2).map((item, itemIndex) => (
                                        <span key={itemIndex} className="item-preview">
                                          {item.quantity}× {item.name}
                                        </span>
                                      ))}
                                      {orderItems.length > 2 && (
                                        <span className="more-items">+{orderItems.length - 2} more</span>
                                      )}
                                    </div>
                                  )
                                })()}
                                <div className="order-location">
                                  {order.location_name && (
                                    <span>
                                      <MapPin size={14} />
                                      {order.location_name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="order-amount">
                              <span className="amount">${(parseFloat(order.total_amount) || 0).toFixed(2)}</span>
                              <span 
                                className="status"
                                style={{ color: getStatusColor(order.status) }}
                              >
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      {customerOrders.length > 5 && (
                        <div className="more-orders">
                          <p>And {customerOrders.length - 5} more orders...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="no-orders">
                      {selectedCustomer.isRegistered ? (
                        <div className="no-orders-registered">
                          <AlertCircle size={48} color="#ff9800" />
                          <h3>No Orders Yet</h3>
                          <p>This customer is registered but hasn't placed their first order.</p>
                          <p><strong>Opportunity:</strong> Send a welcome offer or follow up!</p>
                        </div>
                      ) : (
                        <p>No order history available</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Enhanced CRM Actions */}
                <div className="customer-actions-section">
                  <h4>
                    <MessageSquare size={20} />
                    Customer Actions
                  </h4>
                  <div className="action-buttons">
                    {selectedCustomer.email && (
                      <button 
                        className="btn-action btn-email"
                        onClick={() => sendEmailToCustomer(selectedCustomer.email)}
                        title="Send email to customer"
                      >
                        <Mail size={16} />
                        Send Email
                      </button>
                    )}
                    <button 
                      className="btn-action btn-note"
                      onClick={() => alert('Customer notes feature coming soon!')}
                      title="Add customer note"
                    >
                      <Edit3 size={16} />
                      Add Note
                    </button>
                    {selectedCustomer.totalSpent > 100 && (
                      <button 
                        className="btn-action btn-loyalty"
                        onClick={() => alert('VIP loyalty rewards coming soon!')}
                        title="Manage loyalty rewards"
                      >
                        <Star size={16} />
                        VIP Rewards
                      </button>
                    )}
                    {selectedCustomer.isRegistered && selectedCustomer.totalOrders === 0 && (
                      <button 
                        className="btn-action btn-welcome"
                        onClick={() => alert('Welcome campaign feature coming soon!')}
                        title="Send welcome offer"
                      >
                        <Gift size={16} />
                        Welcome Offer
                      </button>
                    )}
                    {selectedCustomer.lifecycle === 'at_risk' && (
                      <button 
                        className="btn-action btn-retention"
                        onClick={() => alert('Retention campaign feature coming soon!')}
                        title="Send retention offer"
                      >
                        <RefreshCw size={16} />
                        Win Back
                      </button>
                    )}
                    <button 
                      className="btn-action btn-delete"
                      onClick={(e) => handleDeleteCustomer(selectedCustomer, e)}
                      title="Delete customer permanently"
                    >
                      <Trash2 size={16} />
                      Delete Customer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Deletion Confirmation Modal */}
        {showDeleteCustomerModal && customerToDelete && (
          <div className="modal-overlay" onClick={cancelDeleteCustomer}>
            <div className="modal-content delete-customer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <AlertTriangle size={24} color="#ff6b35" />
                  Delete Customer
                </h3>
                <button className="modal-close" onClick={cancelDeleteCustomer}>×</button>
              </div>
              
              <div className="delete-customer-content">
                <div className="warning-section">
                  <div className="warning-icon">
                    <AlertTriangle size={48} color="#ff6b35" />
                  </div>
                  <div className="warning-text">
                    <h4>⚠️ This action cannot be undone!</h4>
                    <p>You are about to permanently delete:</p>
                    <div className="customer-to-delete">
                      <h5>{customerToDelete.name}</h5>
                      <p>{customerToDelete.email || customerToDelete.phone}</p>
                      <p className="customer-type">
                        {customerToDelete.isRegistered ? '👤 Registered Customer' : '👥 Guest Customer'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="deletion-impact">
                  <h4>📊 What will be deleted:</h4>
                  <ul>
                    <li>✓ Customer profile and account</li>
                    <li>✓ All order history ({customerToDelete.totalOrders} orders)</li>
                    <li>✓ Order status tracking records</li>
                    {customerToDelete.isRegistered && (
                      <>
                        <li>✓ Login credentials and tokens</li>
                        <li>✓ Customer preferences and settings</li>
                      </>
                    )}
                    <li>✓ Total revenue impact: ${customerToDelete.totalSpent?.toFixed(2) || '0.00'}</li>
                  </ul>
                </div>

                <div className="password-confirmation">
                  <h4>🔒 Confirm with your admin password:</h4>
                  <input
                    type="password"
                    placeholder="Enter your admin password"
                    value={deleteConfirmPassword}
                    onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                    className="password-input"
                    disabled={isDeletingCustomer}
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-cancel"
                    onClick={cancelDeleteCustomer}
                    disabled={isDeletingCustomer}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn-delete-confirm"
                    onClick={confirmDeleteCustomer}
                    disabled={isDeletingCustomer || !deleteConfirmPassword.trim()}
                  >
                    {isDeletingCustomer ? (
                      <>
                        <div className="loading-spinner-small"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={16} />
                        Delete Permanently
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Item Options Management Modal */}
        {showOptionsModal && selectedMenuItem && (
          <div className="modal-overlay" onClick={closeOptionsModal}>
            <div className="modal-content options-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <Settings size={24} />
                  Manage Options - {selectedMenuItem.name}
                </h3>
                <button className="modal-close" onClick={closeOptionsModal}>×</button>
              </div>
              
              <div className="options-content">
                <div className="options-header">
                  <p>Configure customization options and toppings for this menu item.</p>
                  <button className="btn-add-option" onClick={openAddOptionModal}>
                    <Plus size={16} />
                    Add Option
                  </button>
                </div>

                {isLoadingOptions ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading options...</p>
                  </div>
                ) : (
                  <div className="options-list">
                    {menuItemOptions.length === 0 ? (
                      <div className="empty-options">
                        <Settings size={48} />
                        <h4>No Options Yet</h4>
                        <p>Add your first customization option to let customers personalize their order.</p>
                        <button className="btn-add-first-option" onClick={openAddOptionModal}>
                          <Plus size={16} />
                          Add First Option
                        </button>
                      </div>
                    ) : (
                      menuItemOptions.map(option => (
                        <div key={option.id} className="option-card">
                          <div className="option-header">
                            <div className="option-info">
                              <h4>{option.name}</h4>
                              <p className="option-description">{option.description}</p>
                              <div className="option-meta">
                                <span className={`option-type ${option.option_type}`}>
                                  {option.option_type === 'radio' ? '◉ Single Choice' : 
                                   option.option_type === 'checkbox' ? '☐ Multiple Choice' : 
                                   '▼ Dropdown'}
                                </span>
                                <span className={`option-required ${option.is_required ? 'required' : 'optional'}`}>
                                  {option.is_required ? 'Required' : 'Optional'}
                                </span>
                              </div>
                            </div>
                            <div className="option-actions">
                              <button 
                                className="btn-edit-option"
                                onClick={() => openEditOptionModal(option)}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                className="btn-delete-option"
                                onClick={() => handleDeleteOption(option.id)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="option-choices">
                            <h5>Choices ({option.choices?.length || 0}):</h5>
                            {option.choices && option.choices.length > 0 ? (
                              <div className="choices-list">
                                {option.choices.map((choice, index) => (
                                  <div key={choice.id || index} className="choice-item">
                                    <span className="choice-name">{choice.name}</span>
                                    {choice.price_modifier !== 0 && (
                                      <span className="choice-price">
                                        {choice.price_modifier > 0 ? '+' : ''}${choice.price_modifier.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-choices">No choices added yet</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Option Modal */}
        {showAddOptionModal && (
          <div className="modal-overlay" onClick={closeAddOptionModal}>
            <div className="modal-content add-option-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {editingOption ? <Edit3 size={24} /> : <Plus size={24} />}
                  {editingOption ? 'Edit Option' : 'Add New Option'}
                </h3>
                <button className="modal-close" onClick={closeAddOptionModal}>×</button>
              </div>
              
              <form onSubmit={handleOptionSubmit} className="option-form">
                <div className="form-group">
                  <label htmlFor="option-name">Option Name *</label>
                  <input
                    type="text"
                    id="option-name"
                    name="name"
                    value={optionForm.name}
                    onChange={handleOptionFormChange}
                    placeholder="e.g., Size, Toppings, Spice Level"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="option-description">Description</label>
                  <textarea
                    id="option-description"
                    name="description"
                    value={optionForm.description}
                    onChange={handleOptionFormChange}
                    placeholder="Brief description of this option"
                    rows="2"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="option-type">Option Type *</label>
                    <select
                      id="option-type"
                      name="option_type"
                      value={optionForm.option_type}
                      onChange={handleOptionFormChange}
                      required
                    >
                      <option value="radio">Single Choice (Radio)</option>
                      <option value="checkbox">Multiple Choice (Checkbox)</option>
                      <option value="select">Dropdown (Select)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="sort-order">Sort Order</label>
                    <input
                      type="number"
                      id="sort-order"
                      name="sort_order"
                      value={optionForm.sort_order}
                      onChange={handleOptionFormChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_required"
                      checked={optionForm.is_required}
                      onChange={handleOptionFormChange}
                    />
                    Required Option (customers must make a selection)
                  </label>
                </div>

                <div className="choices-section">
                  <div className="choices-header">
                    <h4>Choices</h4>
                    <button type="button" className="btn-add-choice" onClick={addChoice}>
                      <Plus size={16} />
                      Add Choice
                    </button>
                  </div>

                  <div className="choices-list">
                    {optionForm.choices.map((choice, index) => (
                      <div key={index} className="choice-form-item">
                        <div className="choice-inputs">
                          <input
                            type="text"
                            placeholder="Choice name"
                            value={choice.name}
                            onChange={(e) => updateChoice(index, 'name', e.target.value)}
                            required
                          />
                          <input
                            type="number"
                            placeholder="Price modifier"
                            value={choice.price_modifier}
                            onChange={(e) => updateChoice(index, 'price_modifier', parseFloat(e.target.value) || 0)}
                            step="0.01"
                          />
                          <button
                            type="button"
                            className="btn-remove-choice"
                            onClick={() => removeChoice(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {optionForm.choices.length === 0 && (
                    <div className="no-choices-message">
                      <p>No choices added yet. Click "Add Choice" to create options for customers to select.</p>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeAddOptionModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingOption ? 'Update Option' : 'Add Option'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Option Templates Modal */}
        {showTemplatesModal && (
          <div className="modal-overlay" onClick={closeTemplatesModal}>
            <div className="modal-content templates-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <Settings size={24} />
                  Manage Option Templates - {selectedMenuItem?.name || 'Select a Menu Item'}
                </h3>
                <button className="modal-close" onClick={closeTemplatesModal}>×</button>
              </div>
              
              <div className="templates-content">
                <div className="templates-header">
                  <p>Configure option templates for this menu item.</p>
                  <button className="btn-add-template" onClick={openCreateTemplateModal}>
                    <Plus size={16} />
                    Add Template
                  </button>
                </div>

                {isLoadingOptions ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading templates...</p>
                  </div>
                ) : (
                  <div className="templates-list">
                    {optionTemplates.length === 0 ? (
                      <div className="empty-templates">
                        <Settings size={48} />
                        <h4>No Templates Yet</h4>
                        <p>Add your first template to let customers choose from predefined options.</p>
                        <button className="btn-add-first-template" onClick={openCreateTemplateModal}>
                          <Plus size={16} />
                          Add First Template
                        </button>
                      </div>
                    ) : (
                      optionTemplates.map(template => (
                        <div key={template.id} className="template-card">
                          <div className="template-header">
                            <div className="template-info">
                              <h4>{template.name}</h4>
                              <p className="template-description">{template.description}</p>
                              <div className="template-meta">
                                <span className={`template-type ${template.option_type}`}>
                                  {template.option_type === 'radio' ? '◉ Single Choice' : 
                                   template.option_type === 'checkbox' ? '☐ Multiple Choice' : 
                                   '▼ Dropdown'}
                                </span>
                                <span className={`template-required ${template.is_required ? 'required' : 'optional'}`}>
                                  {template.is_required ? 'Required' : 'Optional'}
                                </span>
                              </div>
                            </div>
                            <div className="template-actions">
                              <button 
                                className="btn-edit-template"
                                onClick={() => openEditTemplateModal(template)}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                className="btn-delete-template"
                                onClick={() => handleDeleteTemplate(template)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="template-choices">
                            <h5>Choices ({template.choices?.length || 0}):</h5>
                            {template.choices && template.choices.length > 0 ? (
                              <div className="choices-list">
                                {template.choices.map((choice, index) => (
                                  <div key={choice.id || index} className="choice-item">
                                    <span className="choice-name">{choice.name}</span>
                                    {choice.price_modifier !== 0 && (
                                      <span className="choice-price">
                                        {choice.price_modifier > 0 ? '+' : ''}${choice.price_modifier.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-choices">No choices added yet</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Template Modal */}
        {showCreateTemplateModal && (
          <div className="modal-overlay" onClick={closeCreateTemplateModal}>
            <div className="modal-content add-template-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  {editingTemplate ? <Edit3 size={24} /> : <Plus size={24} />}
                  {editingTemplate ? 'Edit Template' : 'Add New Template'}
                </h3>
                <button className="modal-close" onClick={closeCreateTemplateModal}>×</button>
              </div>
              
              <form onSubmit={handleTemplateSubmit} className="template-form">
                <div className="form-group">
                  <label htmlFor="template-name">Template Name *</label>
                  <input
                    type="text"
                    id="template-name"
                    name="name"
                    value={templateForm.name}
                    onChange={handleTemplateFormChange}
                    placeholder="e.g., Small, Medium, Large"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="template-description">Description</label>
                  <textarea
                    id="template-description"
                    name="description"
                    value={templateForm.description}
                    onChange={handleTemplateFormChange}
                    placeholder="Brief description of this template"
                    rows="2"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="template-type">Template Type *</label>
                    <select
                      id="template-type"
                      name="option_type"
                      value={templateForm.option_type}
                      onChange={handleTemplateFormChange}
                      required
                    >
                      <option value="radio">Single Choice (Radio)</option>
                      <option value="checkbox">Multiple Choice (Checkbox)</option>
                      <option value="select">Dropdown (Select)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="sort-order">Sort Order</label>
                    <input
                      type="number"
                      id="sort-order"
                      name="sort_order"
                      value={templateForm.sort_order}
                      onChange={handleTemplateFormChange}
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_required"
                      checked={templateForm.is_required}
                      onChange={handleTemplateFormChange}
                    />
                    Required Template (customers must select one)
                  </label>
                </div>

                <div className="choices-section">
                  <div className="choices-header">
                    <h4>Choices</h4>
                    <button type="button" className="btn-add-choice" onClick={addTemplateChoice}>
                      <Plus size={16} />
                      Add Choice
                    </button>
                  </div>

                  <div className="choices-list">
                    {templateForm.choices.map((choice, index) => (
                      <div key={index} className="choice-form-item">
                        <div className="choice-inputs">
                          <input
                            type="text"
                            placeholder="Choice name"
                            value={choice.name}
                            onChange={(e) => updateTemplateChoice(index, 'name', e.target.value)}
                            required
                          />
                          <input
                            type="number"
                            placeholder="Price modifier"
                            value={choice.price_modifier}
                            onChange={(e) => updateTemplateChoice(index, 'price_modifier', parseFloat(e.target.value) || 0)}
                            step="0.01"
                          />
                          <button
                            type="button"
                            className="btn-remove-choice"
                            onClick={() => removeTemplateChoice(index)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {templateForm.choices.length === 0 && (
                    <div className="no-choices-message">
                      <p>No choices added yet. Click "Add Choice" to create options for customers to select.</p>
                    </div>
                  )}
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeCreateTemplateModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingTemplate ? 'Update Template' : 'Add Template'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage 