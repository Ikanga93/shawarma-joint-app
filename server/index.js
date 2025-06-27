import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import fs from 'fs'
import { query, queryOne, queryAll, initializeDatabase, migrateSQLiteToPostgreSQL, isPostgreSQL } from './database.js'
import http from 'http'

// Load environment variables first
dotenv.config()

// Global error handling to prevent crashes
process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception:', error)
  console.error('Stack:', error.stack)
  // Log but don't exit in production to maintain service availability
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason)
  // Log but don't exit in production to maintain service availability
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

// Enhanced environment debugging for Railway
console.log(' Environment check:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('isDevelopment:', process.env.NODE_ENV !== 'production')
console.log('PORT:', process.env.PORT)
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('DATABASE_PRIVATE_URL exists:', !!process.env.DATABASE_PRIVATE_URL)
console.log('DATABASE_PUBLIC_URL exists:', !!process.env.DATABASE_PUBLIC_URL)
console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL)
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET)
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY)
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Not set (will be dynamically determined)')

// Railway-specific debugging
if (process.env.RAILWAY_ENVIRONMENT) {
  console.log(' Railway Environment:', process.env.RAILWAY_ENVIRONMENT)
  console.log(' Railway Service Name:', process.env.RAILWAY_SERVICE_NAME)
  console.log(' Railway Project ID:', process.env.RAILWAY_PROJECT_ID)
}

const hasPostgresUrl = process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_PUBLIC_URL || process.env.POSTGRES_URL
console.log('hasPostgresUrl:', !!hasPostgresUrl)

if (process.env.NODE_ENV === 'production') {
  console.log(' Production mode: Using PostgreSQL database')
  if (hasPostgresUrl) {
    console.log(' Database URL found: Yes (hidden for security)')
  } else {
    console.log(' No database URL found! Check Railway PostgreSQL service connection.')
  }
} else {
  console.log(' Development mode: Using SQLite database')
}

// Set timezone to Central Time
process.env.TZ = 'America/Chicago'

// Helper function to get current Central Time as Date object
const getCentralTime = () => {
  return new Date()
}

// Helper function to format date for SQLite/PostgreSQL in Central Time
// Returns ISO string that represents the Central Time moment
const formatDateForDB = (date = new Date()) => {
  // If date is already a Date object, use it directly
  // If it's a string, parse it first
  const inputDate = date instanceof Date ? date : new Date(date)
  
  // Create a date in Central Time
  const centralDate = new Date(inputDate.toLocaleString("en-US", {timeZone: "America/Chicago"}))
  
  // Return ISO string format for database storage
  // This represents the Central Time moment in ISO format
  return centralDate.toISOString()
}

// Helper function to get current Central Time as ISO string for database
const getCurrentCentralTimeForDB = () => {
  const now = new Date()
  const centralTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}))
  return centralTime.toISOString()
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)

// Dynamic CORS configuration
const getCorsOrigin = () => {
  if (process.env.NODE_ENV === 'production') {
    // If FRONTEND_URL is set, use it along with Railway domains
    const allowedOrigins = ["https://*.railway.app", "https://*.up.railway.app"]
    
    if (process.env.FRONTEND_URL) {
      allowedOrigins.unshift(process.env.FRONTEND_URL)
    }
    
    return [...allowedOrigins, (origin, callback) => {
      // Allow requests with no origin (like mobile apps, or when serving from same domain)
      if (!origin) return callback(null, true)
      
      // Allow any https origin for production (Railway serves frontend and backend on same domain)
      if (origin && origin.startsWith('https://')) {
        return callback(null, true)
      }
      
      return callback(new Error('Not allowed by CORS'))
    }]
  } else {
    // Development
    return ["http://localhost:5173", "http://localhost:5174"]
  }
}

const io = new Server(server, {
  cors: {
    origin: getCorsOrigin(),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
})

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key')

// Setup multer for image uploads - store in memory for database storage
const storage = multer.memoryStorage()

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  }
})

// Middleware
app.use(cors({
  origin: getCorsOrigin()
}))
// Increased JSON payload limit to handle base64 encoded images (default is 100kb)
app.use(express.json({ limit: '10mb' }))

// Health check endpoint - FIRST for Railway
app.get('/health', (req, res) => {
  console.log('⚡ Health check endpoint called')
  res.json({
    status: 'healthy',
    timestamp: getCurrentCentralTimeForDB(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    port: process.env.PORT,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
  })
})

// Admin health check endpoint for debugging production issues
app.get('/health/admin', async (req, res) => {
  try {
    console.log('🔍 Admin health check called')
    
    // Check if any admin users exist
    const adminCount = await queryOne('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin'])
    const adminUsers = await queryAll('SELECT id, email, role, created_at FROM users WHERE role = ?', ['admin'])
    
    // Check admin profiles
    const adminProfilesCount = await queryOne('SELECT COUNT(*) as count FROM admin_profiles', [])
    
    res.json({
      status: 'healthy',
      timestamp: getCurrentCentralTimeForDB(),
      adminUsersCount: adminCount.count,
      adminProfilesCount: adminProfilesCount.count,
      adminUsers: adminUsers.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at
      })),
      environment: process.env.NODE_ENV,
      hasAdminUsername: !!process.env.ADMIN_USERNAME,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD
    })
  } catch (error) {
    console.error('❌ Admin health check error:', error)
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: getCurrentCentralTimeForDB()
    })
  }
})

// Simple test endpoint for debugging 502 errors
app.get('/test', (req, res) => {
  console.log('⚡ Test endpoint called')
  res.json({ 
    message: 'Server is responding!', 
    timestamp: getCurrentCentralTimeForDB(),
    port: process.env.PORT,
    host: req.get('host'),
    url: req.url,
    method: req.method
  })
})

// Root endpoint
app.get('/', (req, res) => {
  console.log(' Root endpoint called')
  if (process.env.NODE_ENV === 'production') {
    // In production, serve the React app
    const indexPath = path.join(__dirname, '../dist/index.html')
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath)
    } else {
      res.status(500).send('React app not found')
    }
  } else {
    res.json({ 
      message: 'Fernando\'s Food Truck API', 
      environment: process.env.NODE_ENV,
      endpoints: ['/health', '/test', '/api/menu', '/api/locations']
    })
  }
})

// Initialize database
initializeDatabase()

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('join-admin', () => {
    socket.join('admin')
    console.log('Admin joined')
  })
  
  socket.on('join-customer', (orderId) => {
    socket.join(`order-${orderId}`)
    console.log(`Customer joined order tracking: ${orderId}`)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Role-based authorization middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized access' })
    }
    next()
  }
}

// API Routes

// Location management endpoints

// Get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const locations = await queryAll(`
      SELECT * FROM locations 
      WHERE status = 'active' 
      ORDER BY name ASC
    `)
    res.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    res.status(500).json({ error: 'Failed to fetch locations' })
  }
})

// Create new location (admin only)
app.post('/api/locations', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, type = 'mobile', description, currentLocation, schedule, phone } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Location name is required' })
    }

    const locationId = `LOC-${uuidv4().substring(0, 8).toUpperCase()}`

    await query(`
      INSERT INTO locations (id, name, type, description, current_location, schedule, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [locationId, name, type, description, currentLocation, schedule, phone])

    const newLocation = await queryOne('SELECT * FROM locations WHERE id = ?', [locationId])
    res.json(newLocation)
  } catch (error) {
    console.error('Error creating location:', error)
    res.status(500).json({ error: 'Failed to create location' })
  }
})

// Update location (admin only)
app.put('/api/locations/:locationId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { locationId } = req.params
    const { name, type, description, currentLocation, schedule, phone, status } = req.body

    await query(`
      UPDATE locations 
      SET name = ?, type = ?, description = ?, current_location = ?, 
          schedule = ?, phone = ?, status = ?, updated_at = ?
      WHERE id = ?
    `, [name, type, description, currentLocation, schedule, phone, status, getCurrentCentralTimeForDB(), locationId])

    const updatedLocation = await queryOne('SELECT * FROM locations WHERE id = ?', [locationId])
    res.json(updatedLocation)
  } catch (error) {
    console.error('Error updating location:', error)
    res.status(500).json({ error: 'Failed to update location' })
  }
})

// User location management endpoints

// Get user's assigned locations
app.get('/api/users/:userId/locations', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    
    // Check if user is requesting their own locations or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    const userLocations = await queryAll(`
      SELECT ul.*, l.name as location_name, l.type, l.description, l.status
      FROM user_locations ul
      JOIN locations l ON ul.location_id = l.id
      WHERE ul.user_id = ? AND ul.is_active = true
      ORDER BY ul.assigned_at DESC
    `, [userId])

    res.json(userLocations)
  } catch (error) {
    console.error('Error fetching user locations:', error)
    res.status(500).json({ error: 'Failed to fetch user locations' })
  }
})

// Assign user to location (admin only)
app.post('/api/users/:userId/locations', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params
    const { locationId, role = 'staff' } = req.body

    if (!locationId) {
      return res.status(400).json({ error: 'Location ID is required' })
    }

    // Check if location exists
    const location = await queryOne('SELECT * FROM locations WHERE id = ?', [locationId])
    if (!location) {
      return res.status(404).json({ error: 'Location not found' })
    }

    // Check if user exists
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [userId])
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Insert or update user location assignment
    await query(`
      INSERT INTO user_locations (user_id, location_id, role, assigned_by)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (user_id, location_id) 
      DO UPDATE SET role = ?, is_active = true, assigned_at = CURRENT_TIMESTAMP
    `, [userId, locationId, role, req.user.id, role])

    res.json({ message: 'User assigned to location successfully' })
  } catch (error) {
    console.error('Error assigning user to location:', error)
    res.status(500).json({ error: 'Failed to assign user to location' })
  }
})

// Update user's current location
app.put('/api/users/:userId/current-location', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params
    const { locationId } = req.body

    // Check if user is updating their own location or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Verify user has access to this location
    const userLocation = await queryOne(`
      SELECT * FROM user_locations 
      WHERE user_id = ? AND location_id = ? AND is_active = true
    `, [userId, locationId])

    if (!userLocation && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'User not assigned to this location' })
    }

    // Update admin profile with current location
    await query(`
      UPDATE admin_profiles 
      SET current_location_id = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE user_id = ?
    `, [locationId, userId])

    res.json({ message: 'Current location updated successfully' })
  } catch (error) {
    console.error('Error updating current location:', error)
    res.status(500).json({ error: 'Failed to update current location' })
  }
})

// Get orders for specific location
app.get('/api/locations/:locationId/orders', authenticateToken, async (req, res) => {
  try {
    const { locationId } = req.params

    // Check if user has access to this location
    if (req.user.role !== 'admin') {
      const userLocation = await queryOne(`
        SELECT * FROM user_locations 
        WHERE user_id = ? AND location_id = ? AND is_active = true
      `, [req.user.id, locationId])

      if (!userLocation) {
        return res.status(403).json({ error: 'Access denied to this location' })
      }
    }

    const orders = await queryAll(`
      SELECT * FROM orders 
      WHERE location_id = ? 
      ORDER BY order_date DESC
    `, [locationId])

    res.json(orders)
  } catch (error) {
    console.error('Error fetching location orders:', error)
    res.status(500).json({ error: 'Failed to fetch location orders' })
  }
})

// Get all users with their location assignments (admin only)
app.get('/api/admin/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const users = await queryAll(`
      SELECT 
        u.id, u.email, u.phone, u.role, u.first_name, u.last_name, u.created_at,
        ap.current_location_id, ap.last_login,
        l.name as current_location_name
      FROM users u
      LEFT JOIN admin_profiles ap ON u.id = ap.user_id
      LEFT JOIN locations l ON ap.current_location_id = l.id
      WHERE u.role = 'admin'
      ORDER BY u.created_at DESC
    `)

    // Get location assignments for each user
    for (let user of users) {
      const locations = await queryAll(`
        SELECT ul.*, l.name as location_name, l.type
        FROM user_locations ul
        JOIN locations l ON ul.location_id = l.id
        WHERE ul.user_id = ? AND ul.is_active = true
      `, [user.id])
      user.assigned_locations = locations
    }

    res.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Get all customers (registered users + guest customers from orders) - admin only
app.get('/api/admin/customers', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    console.log('🔍 Fetching all customers (registered + guest)...')
    
    // Get all registered customers
    const registeredCustomers = await queryAll(`
      SELECT 
        u.id, u.email, u.phone, u.first_name, u.last_name, u.created_at,
        cp.preferences
      FROM users u
      LEFT JOIN customer_profiles cp ON u.id = cp.user_id
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC
    `)
    
    console.log(`📋 Found ${registeredCustomers.length} registered customers`)
    
    // Get all unique guest customers from orders (those without user_id)
    const guestCustomers = await queryAll(`
      SELECT DISTINCT
        customer_name,
        customer_phone,
        customer_email,
        MIN(order_date) as first_order_date,
        MAX(order_date) as last_order_date,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent
      FROM orders 
      WHERE user_id IS NULL OR user_id = ''
      GROUP BY customer_phone, customer_email, customer_name
      ORDER BY total_spent DESC
    `)
    
    console.log(`📋 Found ${guestCustomers.length} guest customers`)
    
    // Get order statistics for registered customers
    const customerOrderStats = await queryAll(`
      SELECT 
        user_id,
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent,
        MIN(order_date) as first_order_date,
        MAX(order_date) as last_order_date
      FROM orders 
      WHERE user_id IS NOT NULL AND user_id != ''
      GROUP BY user_id
    `)
    
    // Create a map for quick lookup of order stats
    const orderStatsMap = new Map()
    customerOrderStats.forEach(stat => {
      orderStatsMap.set(stat.user_id, stat)
    })
    
    // Combine and format all customers
    const allCustomers = []
    
    // Add registered customers with their order data
    registeredCustomers.forEach(customer => {
      const orderStats = orderStatsMap.get(customer.id) || {
        total_orders: 0,
        total_spent: 0,
        first_order_date: null,
        last_order_date: null
      }
      
      allCustomers.push({
        id: customer.id,
        type: 'registered',
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
        email: customer.email,
        phone: customer.phone,
        totalOrders: parseInt(orderStats.total_orders) || 0,
        totalSpent: parseFloat(orderStats.total_spent) || 0,
        firstOrderDate: orderStats.first_order_date || customer.created_at,
        lastOrderDate: orderStats.last_order_date,
        registeredDate: customer.created_at,
        preferences: customer.preferences ? JSON.parse(customer.preferences) : null,
        isRegistered: true
      })
    })
    
    // Add guest customers
    guestCustomers.forEach(customer => {
      allCustomers.push({
        id: `guest-${customer.customer_phone || customer.customer_email || customer.customer_name}`,
        type: 'guest',
        name: customer.customer_name || 'Unknown',
        email: customer.customer_email,
        phone: customer.customer_phone,
        totalOrders: parseInt(customer.total_orders) || 0,
        totalSpent: parseFloat(customer.total_spent) || 0,
        firstOrderDate: customer.first_order_date,
        lastOrderDate: customer.last_order_date,
        registeredDate: null,
        preferences: null,
        isRegistered: false
      })
    })
    
    // Sort by total spent (highest first)
    allCustomers.sort((a, b) => b.totalSpent - a.totalSpent)
    
    console.log(`✅ Combined ${allCustomers.length} total customers (${registeredCustomers.length} registered + ${guestCustomers.length} guest)`)
    
    res.json({
      customers: allCustomers,
      summary: {
        totalCustomers: allCustomers.length,
        registeredCustomers: registeredCustomers.length,
        guestCustomers: guestCustomers.length,
        totalRevenue: allCustomers.reduce((sum, c) => sum + c.totalSpent, 0),
        totalOrders: allCustomers.reduce((sum, c) => sum + c.totalOrders, 0)
      }
    })
  } catch (error) {
    console.error('❌ Error fetching customers:', error)
    res.status(500).json({ error: 'Failed to fetch customers' })
  }
})

// Create order and Stripe checkout session
app.post('/api/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      items,
      subtotal,
      tax,
      total,
      locationId,
      estimatedTime = 25,
      userId = null
    } = req.body

    // Validate required fields
    if (!customerName || !customerPhone || !items || !subtotal || !tax || !total || !locationId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const orderId = `ORDER-${uuidv4().substring(0, 8).toUpperCase()}`
    const timeRemaining = estimatedTime

    // Insert order into database with pending_payment status
    await query(
      `INSERT INTO orders (
        id, customer_name, customer_phone, customer_email, items, 
        subtotal, tax, total_amount, location_id, estimated_time, time_remaining,
        status, user_id, order_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, customerName, customerPhone, customerEmail, JSON.stringify(items),
        subtotal, tax, total, locationId, estimatedTime, timeRemaining,
        'pending_payment', userId, getCurrentCentralTimeForDB()
      ]
    )

    // Add initial status to history
    await query(
      'INSERT INTO order_status_history (order_id, status, changed_at) VALUES (?, ?, ?)',
      [orderId, 'pending_payment', getCurrentCentralTimeForDB()]
    )

    // Determine frontend URL dynamically
    let frontendUrl = process.env.FRONTEND_URL
    
    if (!frontendUrl) {
      // For Railway deployments, check if we have a specific frontend domain
      const host = req.get('host')
      if (host && host.includes('railway.app')) {
        // Use the known frontend URL for Railway deployment
        frontendUrl = 'https://mo-s-burrito-app-production.up.railway.app'
      } else if (process.env.NODE_ENV === 'production' && host) {
        // For other production deployments, use the same domain
        frontendUrl = `https://${host}`
      } else {
        // Development fallback
        frontendUrl = 'http://localhost:5173'
      }
    }

    // Ensure frontendUrl doesn't end with a slash to prevent double slashes
    frontendUrl = frontendUrl.replace(/\/+$/, '')
    
    // Additional URL validation and cleanup
    if (frontendUrl && !frontendUrl.startsWith('http')) {
      frontendUrl = `https://${frontendUrl}`
    }
    
    // Construct URLs with proper encoding
    const successUrl = `${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${encodeURIComponent(orderId)}`
    const cancelUrl = `${frontendUrl}/`
    
    // Log the frontend URL for debugging
    console.log(`🔗 Frontend URL for Stripe: ${frontendUrl}`)
    console.log(`✅ Success URL will be: ${successUrl}`)
    console.log(`❌ Cancel URL will be: ${cancelUrl}`)
    
    // Validate URLs before sending to Stripe
    try {
      new URL(successUrl)
      new URL(cancelUrl)
    } catch (error) {
      console.error('❌ Invalid URL constructed:', error.message)
      return res.status(500).json({ 
        error: 'Invalid URL configuration',
        details: `Frontend URL: ${frontendUrl}, Success URL: ${successUrl}` 
      })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Fernando's Food Truck Order #${orderId}`,
              description: `Order for ${customerName}`,
            },
            unit_amount: Math.round(total * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderId: orderId,
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail || '',
      },
    })

    // Update order with Stripe session ID
    await query(
      'UPDATE orders SET stripe_session_id = ? WHERE id = ?',
      [session.id, orderId]
    )

    res.json({ 
      success: true, 
      orderId,
      checkoutUrl: session.url,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// Debug endpoint to check orders data
app.get('/api/debug/orders', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const rows = await queryAll('SELECT COUNT(*) as total_count FROM orders')
    const totalCount = rows[0].total_count
    
    const sampleRows = await queryAll('SELECT * FROM orders ORDER BY order_date DESC LIMIT 3')
    const sampleOrders = sampleRows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      orderTime: new Date(row.order_date),
      order_time: row.order_date // Add this for analytics compatibility
    }))
    
    const statusCounts = await queryAll(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `)
    
    res.json({
      totalOrders: totalCount,
      sampleOrders,
      statusBreakdown: statusCounts,
      message: 'Debug info for orders table'
    })
  } catch (error) {
    console.error('Error in debug orders endpoint:', error)
    res.status(500).json({ error: 'Failed to fetch debug orders info' })
  }
})

// Get all orders (for admin dashboard)
app.get('/api/orders', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM orders ORDER by order_date DESC')
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      orderTime: new Date(row.order_date),
      order_time: row.order_date // Add this for analytics compatibility
    }))
    res.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Get specific order by ID
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    
    // Join with locations table to get location details
    const row = await queryOne(`
      SELECT o.*, 
             l.name as location_name, 
             l.current_location, 
             l.phone as location_phone,
             l.description as location_description,
             l.schedule as location_schedule
      FROM orders o 
      LEFT JOIN locations l ON o.location_id = l.id 
      WHERE o.id = ?
    `, [orderId])
    
    if (!row) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const order = {
      ...row,
      items: JSON.parse(row.items),
      orderTime: new Date(row.order_date),
      location: row.location_name ? {
        name: row.location_name,
        current_location: row.current_location,
        phone: row.location_phone,
        description: row.location_description,
        schedule: row.location_schedule
      } : null
    }
    res.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// Get orders for a specific customer
app.get('/api/customers/:customerId/orders', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params

    // Check if the requesting user is the customer or an admin
    if (req.user.role !== 'admin' && req.user.id !== customerId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const rows = await queryAll(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC',
      [customerId]
    )
    
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      orderTime: new Date(row.order_date)
    }))
    res.json(orders)
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    res.status(500).json({ error: 'Failed to fetch customer orders' })
  }
})

// Update order status
app.put('/api/orders/:orderId/status', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { orderId } = req.params
    const { status, timeRemaining } = req.body

    if (!status) {
      return res.status(400).json({ error: 'Status is required' })
    }

    const updateQuery = timeRemaining !== undefined
      ? 'UPDATE orders SET status = ?, time_remaining = ? WHERE id = ?'
      : 'UPDATE orders SET status = ? WHERE id = ?'
    
    const params = timeRemaining !== undefined
      ? [status, timeRemaining, orderId]
      : [status, orderId]

    const result = await query(updateQuery, params)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Add status change to history
    await query(
      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
      [orderId, status]
    )

    // Get updated order
    const row = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
    if (row) {
      const updatedOrder = {
        ...row,
        items: JSON.parse(row.items),
        orderTime: new Date(row.order_date)
      }

      // Emit to all connected clients
      io.emit('orderUpdated', updatedOrder)
      res.json(updatedOrder)
    } else {
      res.status(404).json({ error: 'Order not found' })
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

// Verify payment and update order
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId, orderId } = req.body

    // Validate input parameters
    if (!sessionId || !orderId) {
      return res.status(400).json({ 
        error: 'Session ID and Order ID are required for payment verification' 
      })
    }

    // Basic validation for Stripe session ID format (unless it's a test)
    if (!sessionId.startsWith('cs_') && sessionId !== 'test') {
      console.warn('Invalid Stripe session ID format received:', sessionId)
      return res.status(400).json({ 
        error: 'Invalid payment session format' 
      })
    }

    console.log(` Verifying payment for session: ${sessionId}, order: ${orderId}`)

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    console.log(` Stripe session status: ${session.payment_status}`)

    if (session.payment_status === 'paid') {
      // Update order status to confirmed and payment to completed
      await query(
        'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['completed', 'confirmed', orderId]
      )

      // Add status change to history
      await query(
        'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
        [orderId, 'confirmed']
      )

      // Get updated order and notify admin
      const row = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
      if (row) {
        const updatedOrder = {
          ...row,
          items: JSON.parse(row.items),
          orderTime: new Date(row.order_date)
        }

        // Notify admin of new paid order
        io.to('admin').emit('new-order', updatedOrder)
        io.to(`order-${orderId}`).emit('order-status-updated', updatedOrder)
      }

      console.log(` Payment verified successfully for order: ${orderId}`)
      res.json({ success: true, paymentStatus: 'completed' })
    } else {
      console.log(` Payment not completed. Status: ${session.payment_status}`)
      res.json({ success: false, paymentStatus: session.payment_status })
    }
  } catch (error) {
    console.error(' Error verifying payment:', error)
    
    // Provide more specific error messages
    if (error.message.includes('No such checkout.session')) {
      res.status(400).json({ 
        error: 'Invalid payment session. The session may have expired or does not exist.' 
      })
    } else if (error.message.includes('Invalid API Key')) {
      res.status(500).json({ 
        error: 'Payment service configuration error. Please contact support.' 
      })
    } else {
      res.status(500).json({ 
        error: 'Payment verification failed. Please try again or contact support.' 
      })
    }
  }
})

// Stripe webhook for payment confirmation
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      const orderId = session.metadata.orderId
      
      // Update order payment status
      query(
        'UPDATE orders SET payment_status = ?, status = ? WHERE stripe_session_id = ?',
        ['completed', 'confirmed', session.id]
      )
      
      console.log(`Payment completed for order: ${orderId}`)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({received: true})
})

// Menu Items API Routes

// Upload menu item image
app.post('/api/upload-menu-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }
    
    // Convert image to base64 data URL
    const base64Image = req.file.buffer.toString('base64')
    const mimeType = req.file.mimetype
    const imageUrl = `data:${mimeType};base64,${base64Image}`
    
    res.json({ imageUrl })
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

// Get all menu items
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await queryAll('SELECT * FROM menu_items ORDER BY category, name')
    
    // Get options for each menu item
    const menuItemsWithOptions = await Promise.all(
      menuItems.map(async (item) => {
        const options = await queryAll(
          'SELECT * FROM menu_item_options WHERE item_id = ? ORDER BY sort_order, id',
          [item.id]
        )
        
        // Get choices for each option
        const optionsWithChoices = await Promise.all(
          options.map(async (option) => {
            const choices = await queryAll(
              'SELECT * FROM menu_item_option_choices WHERE option_id = ? ORDER BY sort_order, id',
              [option.id]
            )
            return {
              ...option,
              choices
            }
          })
        )
        
        return {
          ...item,
          options: optionsWithChoices
        }
      })
    )
    
    res.json(menuItemsWithOptions)
  } catch (error) {
    console.error('Error fetching menu items:', error)
    res.status(500).json({ error: 'Failed to fetch menu items' })
  }
})

// Add new menu item
app.post('/api/menu', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, description, price, category, emoji, available, image_url } = req.body

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' })
    }

    const result = await query(
      'INSERT INTO menu_items (name, description, price, category, emoji, available, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, category, emoji, available !== false, image_url]
    )

    // Return the created item - handle both SQLite and PostgreSQL
    let createdItem
    if (result.lastID) {
      // SQLite case
      createdItem = await queryOne('SELECT * FROM menu_items WHERE id = ?', [result.lastID])
    } else {
      // PostgreSQL case - get the most recently inserted item for this name
      createdItem = await queryOne(
        'SELECT * FROM menu_items WHERE name = ? AND category = ? ORDER BY created_at DESC LIMIT 1',
        [name, category]
      )
    }
    
    if (!createdItem) {
      return res.status(500).json({ error: 'Failed to retrieve created menu item' })
    }
    
    res.json(createdItem)
  } catch (error) {
    console.error('Error adding menu item:', error)
    res.status(500).json({ error: 'Failed to add menu item' })
  }
})

// Update menu item
app.put('/api/menu/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, category, emoji, available, image_url } = req.body
    
    await query(
      'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, emoji = ?, available = ?, image_url = ?, updated_at = ? WHERE id = ?',
      [name, description, price, category, emoji, available, image_url, getCurrentCentralTimeForDB(), id]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating menu item:', error)
    res.status(500).json({ error: 'Failed to update menu item' })
  }
})

// Delete menu item
app.delete('/api/menu/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await query('DELETE FROM menu_items WHERE id = ?', [id])
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    res.status(500).json({ error: 'Failed to delete menu item' })
  }
})

// Locations API Routes

// Get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM locations ORDER BY name')
    res.json(rows)
  } catch (error) {
    console.error('Error fetching locations:', error)
    res.status(500).json({ error: 'Failed to fetch locations' })
  }
})

// Add new location
app.post('/api/locations', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id, name, type, description, current_location, schedule, phone, status } = req.body
    
    if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' })
    }

    await query(
      'INSERT INTO locations (id, name, type, description, current_location, schedule, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, type || 'mobile', description, current_location, schedule, phone, status || 'active']
    )

    // Return the created item
    const createdLocation = await queryOne('SELECT * FROM locations WHERE id = ?', [id])
    res.json(createdLocation)
  } catch (error) {
    console.error('Error adding location:', error)
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === '23505') {
      res.status(400).json({ error: 'Location ID already exists' })
    } else {
      res.status(500).json({ error: 'Failed to add location' })
    }
  }
})

// Update location
app.put('/api/locations/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { name, type, description, current_location, schedule, phone, status } = req.body
    
    const result = await query(
      'UPDATE locations SET name = ?, type = ?, description = ?, current_location = ?, schedule = ?, phone = ?, status = ?, updated_at = ? WHERE id = ?',
      [name, type, description, current_location, schedule, phone, status, getCurrentCentralTimeForDB(), id]
    )

    if (result.changes === 0) {
      res.status(404).json({ error: 'Location not found' })
    } else {
      res.json({ success: true, changes: result.changes })
    }
  } catch (error) {
    console.error('Error updating location:', error)
    res.status(500).json({ error: 'Failed to update location' })
  }
})

// Delete location
app.delete('/api/locations/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await query('DELETE FROM locations WHERE id = ?', [id])
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Location not found' })
    } else {
      res.json({ success: true, changes: result.changes })
    }
  } catch (error) {
    console.error('Error deleting location:', error)
    res.status(500).json({ error: 'Failed to delete location' })
  }
})

// Live Locations API Routes (New functionality for real-time truck locations)

// Get all live locations
app.get('/api/live-locations', async (req, res) => {
  try {
    console.log('Live locations endpoint called')
    
    // Try to query the live_locations table
    try {
      const rows = await queryAll('SELECT * FROM live_locations WHERE is_active = ? ORDER BY last_updated DESC', [true])
      console.log('Live locations query successful, found:', rows.length, 'locations')
      res.json(rows)
    } catch (dbError) {
      console.log('Live locations table query failed:', dbError.message)
      
      // Check if it's a table not found error
      if (dbError.message.includes('no such table') || dbError.message.includes('does not exist')) {
        console.log('Live locations table does not exist, returning empty array')
        res.json([])
      } else {
        // Re-throw other database errors
        throw dbError
      }
    }
  } catch (error) {
    console.error('Error in live locations endpoint:', error)
    res.status(500).json({ 
      error: 'Failed to fetch live locations', 
      details: error.message,
      message: 'The live locations feature may not be fully initialized yet. Please try refreshing or contact support.'
    })
  }
})

// Add new live location
app.post('/api/live-locations', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { truck_name, current_address, latitude, longitude, description, hours_today } = req.body
    
    if (!truck_name) {
      return res.status(400).json({ error: 'Truck name is required' })
    }

    // Use default address if none provided
    const finalAddress = current_address && current_address.trim() ? current_address.trim() : 'Location update in progress...'

    const result = await query(
      'INSERT INTO live_locations (truck_name, current_address, latitude, longitude, description, hours_today, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [truck_name, finalAddress, latitude, longitude, description, hours_today, getCurrentCentralTimeForDB()]
    )

    // Return the created item
    let createdLocation
    if (result.lastID) {
      // SQLite case
      createdLocation = await queryOne('SELECT * FROM live_locations WHERE id = ?', [result.lastID])
    } else {
      // PostgreSQL case - get the most recently inserted item for this truck
      createdLocation = await queryOne(
        'SELECT * FROM live_locations WHERE truck_name = ? AND current_address = ? ORDER BY created_at DESC LIMIT 1',
        [truck_name, finalAddress]
      )
    }
    
    res.json(createdLocation)
  } catch (error) {
    console.error('Error adding live location:', error)
    res.status(500).json({ error: 'Failed to add live location' })
  }
})

// Update live location
app.put('/api/live-locations/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { truck_name, current_address, latitude, longitude, description, hours_today, is_active } = req.body
    
    const result = await query(
      'UPDATE live_locations SET truck_name = ?, current_address = ?, latitude = ?, longitude = ?, description = ?, hours_today = ?, is_active = ?, last_updated = ? WHERE id = ?',
      [truck_name, current_address, latitude, longitude, description, hours_today, is_active, getCurrentCentralTimeForDB(), id]
    )

    if (result.changes === 0) {
      res.status(404).json({ error: 'Live location not found' })
    } else {
      res.json({ success: true, changes: result.changes })
    }
  } catch (error) {
    console.error('Error updating live location:', error)
    res.status(500).json({ error: 'Failed to update live location' })
  }
})

// Delete live location
app.delete('/api/live-locations/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await query('DELETE FROM live_locations WHERE id = ?', [id])
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Live location not found' })
    } else {
      res.json({ success: true, changes: result.changes })
    }
  } catch (error) {
    console.error('Error deleting live location:', error)
    res.status(500).json({ error: 'Failed to delete live location' })
  }
})

// Timer to update cooking orders - start after database is ready
setTimeout(() => {
  console.log(' Starting cooking timer...')
  setInterval(async () => {
    try {
      console.log(' Timer running - checking cooking orders...')
      // Simplified query to debug SQL syntax
      const rows = await queryAll('SELECT * FROM orders WHERE status = ? AND time_remaining > 0', ['cooking'])
      console.log(` Found ${rows.length} cooking orders`)
      
      for (const order of rows) {
        const newTimeRemaining = Math.max(0, order.time_remaining - 1)
        const newStatus = newTimeRemaining === 0 ? 'ready' : 'cooking'

        await query(
          'UPDATE orders SET time_remaining = ?, status = ? WHERE id = ?',
          [newTimeRemaining, newStatus, order.id]
        )
        
        if (newStatus === 'ready') {
          // Add status change to history
          await query(
            'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
            [order.id, 'ready']
          )
        }

        // Get updated order and emit to clients
        const updatedRow = await queryOne('SELECT * FROM orders WHERE id = ?', [order.id])
        if (updatedRow) {
          const updatedOrder = {
            ...updatedRow,
            items: JSON.parse(updatedRow.items),
            orderTime: new Date(updatedRow.order_date)
          }

          io.to('admin').emit('order-updated', updatedOrder)
          io.to(`order-${order.id}`).emit('order-status-updated', updatedOrder)
        }
      }
    } catch (error) {
      console.error('Timer error:', error)
    }
  }, 60000) // Update every minute
}, 5000) // Wait 5 seconds after server start

// Dashboard API Route
app.get('/api/dashboard', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    // Get counts and statistics from database
    const orderCount = await queryOne('SELECT COUNT(*) as total_orders FROM orders')
    const menuCount = await queryOne('SELECT COUNT(*) as total_menu_items FROM menu_items')
    const locationCount = await queryOne('SELECT COUNT(*) as total_locations FROM locations')
    
    // Get recent orders
    const recentOrders = await queryAll('SELECT * FROM orders ORDER BY order_date DESC LIMIT 5')
    
    // Get order status distribution
    const statusDistribution = await queryAll('SELECT status, COUNT(*) as count FROM orders GROUP BY status')

    // Format the response
    const dashboardData = {
      summary: {
        totalOrders: orderCount.total_orders,
        totalMenuItems: menuCount.total_menu_items,
        totalLocations: locationCount.total_locations
      },
      recentOrders: recentOrders.map(order => ({
        ...order,
        items: JSON.parse(order.items),
        orderTime: new Date(order.order_date)
      })),
      orderStatusDistribution: statusDistribution
    }

    res.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
})

// Authentication Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, phone, password, role = 'customer', firstName, lastName } = req.body

    if (!email || !phone || !password) {
      return res.status(400).json({ error: 'Email, phone, and password are required' })
    }

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    )

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user
    const userId = `USER-${uuidv4().substring(0, 8).toUpperCase()}`
    await query(
      'INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, phone, passwordHash, role, firstName, lastName]
    )

    // Create profile based on role
    if (role === 'customer') {
      await query('INSERT INTO customer_profiles (user_id) VALUES (?)', [userId])
    } else if (role === 'admin') {
      await query('INSERT INTO admin_profiles (user_id) VALUES (?)', [userId])
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: userId, email, role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    await query(
      'INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, refreshToken, 'refresh', expiresAt]
    )

    res.json({
      success: true,
      user: {
        id: userId,
        email,
        phone,
        role,
        firstName,
        lastName
      },
      accessToken,
      refreshToken
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body

    console.log('🔐 Login attempt:', { email, phone: phone ? '***' : undefined })

    if ((!email && !phone) || !password) {
      console.log('❌ Login failed: Missing credentials')
      return res.status(400).json({ error: 'Email/phone and password are required' })
    }

    // Find user
    const user = await queryOne(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [email || phone, phone || email]
    )

    if (!user) {
      console.log('❌ Login failed: User not found for:', email || phone)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    console.log('👤 User found:', { id: user.id, email: user.email, role: user.role })

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password for user:', user.email)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    console.log('✅ Password validated for user:', user.email)

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Store refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    await query(
      'INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), user.id, refreshToken, 'refresh', expiresAt]
    )

    // Update last login for admin
    if (user.role === 'admin') {
      try {
        await query(
          'UPDATE admin_profiles SET last_login = ? WHERE user_id = ?',
          [getCurrentCentralTimeForDB(), user.id]
        )
        console.log('✅ Admin last login updated')
      } catch (adminUpdateError) {
        console.warn('⚠️ Failed to update admin last login:', adminUpdateError.message)
        // Don't fail the login for this
      }
    }

    // Get user's assigned locations if admin
    let assignedLocations = []
    let currentLocation = null
    
    if (user.role === 'admin') {
      try {
        assignedLocations = await queryAll(`
          SELECT ul.*, l.name as location_name, l.type, l.description, l.status
          FROM user_locations ul
          JOIN locations l ON ul.location_id = l.id
          WHERE ul.user_id = ? AND ul.is_active = true
          ORDER BY ul.assigned_at DESC
        `, [user.id])

        // Get current location from admin profile
        const adminProfile = await queryOne(`
          SELECT ap.current_location_id, l.name as current_location_name
          FROM admin_profiles ap
          LEFT JOIN locations l ON ap.current_location_id = l.id
          WHERE ap.user_id = ?
        `, [user.id])

        if (adminProfile && adminProfile.current_location_id) {
          currentLocation = {
            id: adminProfile.current_location_id,
            name: adminProfile.current_location_name
          }
        }
        
        console.log('✅ Admin locations loaded:', { assignedCount: assignedLocations.length, currentLocation: currentLocation?.name })
      } catch (locationError) {
        console.warn('⚠️ Failed to load admin locations:', locationError.message)
        // Continue with empty locations rather than failing
      }
    }

    console.log('✅ Login successful for:', user.email)

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        assignedLocations,
        currentLocation
      },
      accessToken,
      refreshToken
    })
  } catch (error) {
    console.error('❌ Login error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    res.status(500).json({ 
      error: 'Login failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback-secret')

    // Check if token exists in database and is not expired
    const token = await queryOne(
      'SELECT * FROM auth_tokens WHERE token = ? AND type = ? AND expires_at > ?',
      [refreshToken, 'refresh', getCurrentCentralTimeForDB()]
    )

    if (!token) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    // Get user
    const user = await queryOne(
      'SELECT * FROM users WHERE id = ?',
      [decoded.id]
    )

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    )

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      // Remove refresh token from database
      await query(
        'DELETE FROM auth_tokens WHERE token = ? AND user_id = ?',
        [refreshToken, req.user.id]
      )
    }

    res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
})

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await queryOne(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Route debugging endpoint
app.get('/api/debug-routes', (req, res) => {
  const path = require('path')
  const fs = require('fs')
  
  // Check if dist directory exists and has files
  const distPath = path.join(__dirname, '../dist')
  const indexPath = path.join(distPath, 'index.html')
  
  let distExists = false
  let indexExists = false
  let indexContent = null
  
  try {
    distExists = fs.existsSync(distPath)
    indexExists = fs.existsSync(indexPath)
    if (indexExists) {
      indexContent = fs.readFileSync(indexPath, 'utf8').substring(0, 200) + '...'
    }
  } catch (error) {
    console.error('Error checking dist files:', error)
  }
  
  res.json({
    environment: process.env.NODE_ENV,
    server: {
      host: req.get('host'),
      protocol: req.protocol,
      url: `${req.protocol}://${req.get('host')}`
    },
    paths: {
      __dirname: __dirname,
      distPath: distPath,
      indexPath: indexPath
    },
    files: {
      distExists,
      indexExists,
      indexContent
    },
    routes: {
      'order-success': '/order-success',
      'api-routes': ['/api/orders', '/api/verify-payment'],
      'static-files': process.env.NODE_ENV === 'production' ? 'Served from /dist' : 'Development mode'
    },
    stripe: {
      successUrlPattern: process.env.NODE_ENV === 'production' ? 
        `https://${req.get('host')}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=ORDER_ID` :
        'http://localhost:5173/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=ORDER_ID'
    },
    message: 'Route debugging info'
  })
})

// Database initialization endpoint (for debugging)
app.get('/api/init-db', async (req, res) => {
  try {
    await initializeDatabase()
    res.json({ success: true, message: 'Database initialized successfully' })
  } catch (error) {
    console.error('Database initialization error:', error)
    res.status(500).json({ error: 'Database initialization failed', details: error.message })
  }
})

// Data migration endpoint (SQLite to PostgreSQL)
app.post('/api/migrate-data', async (req, res) => {
  try {
    if (!isPostgreSQL) {
      return res.status(400).json({ 
        error: 'Not connected to PostgreSQL', 
        message: 'Migration only works when connected to PostgreSQL database' 
      })
    }
    
    await migrateSQLiteToPostgreSQL()
    res.json({ 
      success: true, 
      message: 'Data migration from SQLite to PostgreSQL completed successfully' 
    })
  } catch (error) {
    console.error('Data migration error:', error)
    res.status(500).json({ 
      error: 'Data migration failed', 
      details: error.message 
    })
  }
})

// Database status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    res.json({
      database: isPostgreSQL ? 'PostgreSQL' : 'SQLite',
      connected: true,
      environment: process.env.NODE_ENV || 'development'
    })
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get database status', 
      details: error.message 
    })
  }
})

// Debug endpoint to test database queries
app.get('/api/debug-db', async (req, res) => {
  try {
    // Test simple query
    const testQuery = await queryAll('SELECT 1 as test')
    console.log('Test query result:', testQuery)
    
    // Test users table
    const usersCount = await queryOne('SELECT COUNT(*) as count FROM users')
    console.log('Users count:', usersCount)
    
    // Test auth_tokens table
    const tokensCount = await queryOne('SELECT COUNT(*) as count FROM auth_tokens')
    console.log('Tokens count:', tokensCount)
    
    res.json({
      success: true, 
      testQuery,
      usersCount,
      tokensCount,
      message: 'Database debug successful' 
    })
  } catch (error) {
    console.error('Database debug error:', error)
    res.status(500).json({ error: 'Database debug failed', details: error.message, stack: error.stack })
  }
})

// Debug endpoint for live locations table
app.get('/api/debug-live-locations', async (req, res) => {
  try {
    // Check if live_locations table exists
    let tableExists = false
    try {
      await queryOne('SELECT 1 FROM live_locations LIMIT 1')
      tableExists = true
    } catch (error) {
      console.log('Table check error:', error.message)
    }
    
    // Try to get all records
    let records = []
    if (tableExists) {
      try {
        records = await queryAll('SELECT * FROM live_locations')
      } catch (error) {
        console.log('Records query error:', error.message)
      }
    }
    
    res.json({
      success: true,
      tableExists,
      recordCount: records.length,
      records,
      message: 'Live locations debug successful'
    })
  } catch (error) {
    console.error('Live locations debug error:', error)
    res.status(500).json({ error: 'Live locations debug failed', details: error.message })
  }
})

// Delete order (admin only)
app.delete('/api/orders/:orderId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { orderId } = req.params

    // First check if order exists
    const existingOrder = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Delete from order_status_history first (foreign key constraint)
    await query('DELETE FROM order_status_history WHERE order_id = ?', [orderId])
    
    // Delete the order
    const result = await query('DELETE FROM orders WHERE id = ?', [orderId])
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    console.log(`🗑️ Order ${orderId} deleted by admin ${req.user.email}`)
    
    // Emit to all connected clients
    io.emit('orderDeleted', { orderId: parseInt(orderId) })
    
    res.json({ 
      message: 'Order deleted successfully', 
      orderId: parseInt(orderId),
      deletedOrder: {
        ...existingOrder,
        items: JSON.parse(existingOrder.items)
      }
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    res.status(500).json({ error: 'Failed to delete order' })
  }
})

// Reset order status to cooking (admin only)
app.put('/api/orders/:orderId/reset-to-cooking', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { orderId } = req.params
    const { timeRemaining = 15 } = req.body // Default 15 minutes cooking time

    // Check if order exists
    const existingOrder = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Update order status to cooking with new time
    const result = await query(
      'UPDATE orders SET status = ?, time_remaining = ? WHERE id = ?',
      ['cooking', timeRemaining, orderId]
    )
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Add status change to history
    await query(
      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
      [orderId, 'cooking']
    )

    // Get updated order
    const row = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
    if (row) {
      const updatedOrder = {
        ...row,
        items: JSON.parse(row.items),
        orderTime: new Date(row.order_date)
      }

      console.log(`🔄 Order ${orderId} reset to cooking by admin ${req.user.email}`)
      
      // Emit to all connected clients
      io.emit('orderUpdated', updatedOrder)
      res.json(updatedOrder)
    } else {
      res.status(404).json({ error: 'Order not found after update' })
    }
  } catch (error) {
    console.error('Error resetting order to cooking:', error)
    res.status(500).json({ error: 'Failed to reset order to cooking' })
  }
})

// Update order details (admin only)
app.put('/api/orders/:orderId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { orderId } = req.params
    const { customer_name, customer_email, customer_phone, items, total_amount, notes } = req.body
    
    await query(
      'UPDATE orders SET customer_name = ?, customer_email = ?, customer_phone = ?, items = ?, total_amount = ?, notes = ? WHERE id = ?',
      [customer_name, customer_email, customer_phone, JSON.stringify(items), total_amount, notes, orderId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

// Verify payment and update order
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId, orderId } = req.body

    // Validate input parameters
    if (!sessionId || !orderId) {
      return res.status(400).json({ 
        error: 'Session ID and Order ID are required for payment verification' 
      })
    }

    // Basic validation for Stripe session ID format (unless it's a test)
    if (!sessionId.startsWith('cs_') && sessionId !== 'test') {
      console.warn('Invalid Stripe session ID format received:', sessionId)
      return res.status(400).json({ 
        error: 'Invalid payment session format' 
      })
    }

    console.log(` Verifying payment for session: ${sessionId}, order: ${orderId}`)

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    console.log(` Stripe session status: ${session.payment_status}`)

    if (session.payment_status === 'paid') {
      // Update order status to confirmed and payment to completed
      await query(
        'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['completed', 'confirmed', orderId]
      )

      // Add status change to history
      await query(
        'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
        [orderId, 'confirmed']
      )

      // Get updated order and notify admin
      const row = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
      if (row) {
        const updatedOrder = {
          ...row,
          items: JSON.parse(row.items),
          orderTime: new Date(row.order_date)
        }

        // Notify admin of new paid order
        io.to('admin').emit('new-order', updatedOrder)
        io.to(`order-${orderId}`).emit('order-status-updated', updatedOrder)
      }

      console.log(` Payment verified successfully for order: ${orderId}`)
      res.json({ success: true, paymentStatus: 'completed' })
    } else {
      console.log(` Payment not completed. Status: ${session.payment_status}`)
      res.json({ success: false, paymentStatus: session.payment_status })
    }
  } catch (error) {
    console.error(' Error verifying payment:', error)
    
    // Provide more specific error messages
    if (error.message.includes('No such checkout.session')) {
      res.status(400).json({ 
        error: 'Invalid payment session. The session may have expired or does not exist.' 
      })
    } else if (error.message.includes('Invalid API Key')) {
      res.status(500).json({ 
        error: 'Payment service configuration error. Please contact support.' 
      })
    } else {
      res.status(500).json({ 
        error: 'Payment verification failed. Please try again or contact support.' 
      })
    }
  }
})

// Stripe webhook for payment confirmation
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      const orderId = session.metadata.orderId
      
      // Update order payment status
      query(
        'UPDATE orders SET payment_status = ?, status = ? WHERE stripe_session_id = ?',
        ['completed', 'confirmed', session.id]
      )
      
      console.log(`Payment completed for order: ${orderId}`)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({received: true})
})

// Serve React app for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files first with proper headers
  app.use(express.static(path.join(__dirname, '../dist'), {
    maxAge: '1d', // Cache static assets for 1 day
    setHeaders: (res, path) => {
      // Don't cache HTML files to ensure fresh content
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }))
  
  // Handle all non-API routes by serving the React app
  app.get('*', (req, res) => {
    // Don't serve React app for API routes or health check
    if (req.path.startsWith('/api') || req.path.startsWith('/health') || req.path.startsWith('/test')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    
    // Enhanced logging for debugging double slash issues
    console.log(` Serving React app for route: ${req.path}`)
    console.log(` Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`)
    console.log(` Query params: ${JSON.stringify(req.query)}`)
    
    // Check for double slash in path and log it
    if (req.path.includes('//')) {
      console.log(` DOUBLE SLASH DETECTED in path: ${req.path}`)
    }
    
    // Set proper headers for HTML
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    // Always serve the React app index.html for client-side routing
    const indexPath = path.join(__dirname, '../dist/index.html');
    
    // Check if index.html exists before serving
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(' index.html not found at:', indexPath);
      res.status(500).send('Server configuration error: index.html not found');
    }
  })
}

// Start server
const PORT = process.env.PORT || 3002
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'

console.log(` Starting server with PORT: ${PORT}, HOST: ${HOST}`)

server.listen(PORT, HOST, () => {
  console.log(` Server running on ${HOST}:${PORT}`)
  console.log(` Dashboard: http://${HOST}:${PORT}/api/dashboard`)
  console.log(` Orders API: http://${HOST}:${PORT}/api/orders`)
  console.log(` Health Check: http://${HOST}:${PORT}/health`)
  console.log(` Server startup successful!`)
  
  // Simplified health check for Railway environment
  setTimeout(() => {
    // Skip health check in production to avoid connection issues
    if (process.env.NODE_ENV === 'production') {
      console.log(` Health check skipped in production environment`)
      console.log(` Server is ready to accept connections`)
      return
    }
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET'
    }
    
    const req = http.request(options, (res) => {
      console.log(` Health check status: ${res.statusCode}`)
      if (res.statusCode === 200) {
        console.log(` Health check passed - server is responding correctly`)
      } else {
        console.log(` Health check returned status ${res.statusCode}`)
      }
    })
    
    req.on('error', (err) => {
      console.error(' Health check failed:', err.message)
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      console.log(' Health check timed out')
    })
    
    req.end()
  }, 2000) // Wait 2 seconds after startup
}).on('error', (err) => {
  console.error(' Server startup failed:', err)
  console.error('Error code:', err.code)
  console.error('Error message:', err.message)
  
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`)
    console.error(` Try a different port or kill the process using this port`)
  } else if (err.code === 'EACCES') {
    console.error(`Permission denied to bind to port ${PORT}`)
    console.error(` Try running with elevated privileges or use a port > 1024`)
  } else if (err.code === 'ENOTFOUND') {
    console.error(`Host ${HOST} not found`)
    console.error(` Check if the host address is correct`)
  }
  
  // Don't exit in production to prevent Railway from restarting unnecessarily
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
}) 

// Delete specific customer and all related data (admin only)
app.delete('/api/admin/customers/:customerId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { customerId } = req.params
    const { confirmPassword } = req.body

    // Additional security check - require password confirmation for customer deletion
    if (!confirmPassword) {
      return res.status(400).json({ error: 'Password confirmation required for customer deletion' })
    }

    // Verify admin password
    const admin = await queryOne('SELECT * FROM users WHERE id = ?', [req.user.id])
    if (!admin) {
      return res.status(404).json({ error: 'Admin user not found' })
    }

    const isValidPassword = await bcrypt.compare(confirmPassword, admin.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password confirmation' })
    }

    // Check if customer exists and get their info
    let customer = null
    let isRegisteredCustomer = false

    // First check if it's a registered customer (has user account)
    if (!customerId.startsWith('guest-')) {
      customer = await queryOne('SELECT * FROM users WHERE id = ? AND role = ?', [customerId, 'customer'])
      if (customer) {
        isRegisteredCustomer = true
      }
    }

    // If not found as registered customer, check if it's a guest customer from orders
    if (!customer) {
      // Extract guest customer identifier
      const guestId = customerId.replace('guest-', '')
      
      // Try to find guest customer by phone, email, or name
      const guestOrder = await queryOne(`
        SELECT DISTINCT customer_name, customer_phone, customer_email 
        FROM orders 
        WHERE (user_id IS NULL OR user_id = '') 
        AND (customer_phone = ? OR customer_email = ? OR customer_name = ?)
        LIMIT 1
      `, [guestId, guestId, guestId])
      
      if (guestOrder) {
        customer = {
          id: customerId,
          customer_name: guestOrder.customer_name,
          customer_phone: guestOrder.customer_phone,
          customer_email: guestOrder.customer_email,
          isGuest: true
        }
      }
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    let deletedCounts = {
      orderStatusHistory: 0,
      orders: 0,
      authTokens: 0,
      customerProfiles: 0,
      userLocations: 0,
      users: 0
    }

    console.log(`🗑️ Starting customer deletion requested by admin: ${req.user.email}`)
    console.log(`👤 Customer to delete: ${isRegisteredCustomer ? customer.email : customer.customer_name} (${isRegisteredCustomer ? 'Registered' : 'Guest'})`)

    if (isRegisteredCustomer) {
      // Delete registered customer and all related data

      // Step 1: Delete order status history for customer's orders
      const result1 = await query(`
        DELETE FROM order_status_history 
        WHERE order_id IN (
          SELECT id FROM orders WHERE user_id = ?
        )
      `, [customerId])
      deletedCounts.orderStatusHistory = result1.changes || 0

      // Step 2: Delete customer's orders
      const result2 = await query('DELETE FROM orders WHERE user_id = ?', [customerId])
      deletedCounts.orders = result2.changes || 0

      // Step 3: Delete customer's auth tokens
      const result3 = await query('DELETE FROM auth_tokens WHERE user_id = ?', [customerId])
      deletedCounts.authTokens = result3.changes || 0

      // Step 4: Delete customer profile
      const result4 = await query('DELETE FROM customer_profiles WHERE user_id = ?', [customerId])
      deletedCounts.customerProfiles = result4.changes || 0

      // Step 5: Delete user location assignments
      const result5 = await query('DELETE FROM user_locations WHERE user_id = ?', [customerId])
      deletedCounts.userLocations = result5.changes || 0

      // Step 6: Finally delete the user account
      const result6 = await query('DELETE FROM users WHERE id = ?', [customerId])
      deletedCounts.users = result6.changes || 0

    } else {
      // Delete guest customer data (orders only)
      const guestId = customerId.replace('guest-', '')
      
      // Step 1: Delete order status history for guest customer's orders
      const result1 = await query(`
        DELETE FROM order_status_history 
        WHERE order_id IN (
          SELECT id FROM orders 
          WHERE (user_id IS NULL OR user_id = '') 
          AND (customer_phone = ? OR customer_email = ? OR customer_name = ?)
        )
      `, [guestId, guestId, guestId])
      deletedCounts.orderStatusHistory = result1.changes || 0

      // Step 2: Delete guest customer's orders
      const result2 = await query(`
        DELETE FROM orders 
        WHERE (user_id IS NULL OR user_id = '') 
        AND (customer_phone = ? OR customer_email = ? OR customer_name = ?)
      `, [guestId, guestId, guestId])
      deletedCounts.orders = result2.changes || 0
    }

    // Emit customer deletion event to all connected clients
    io.emit('customerDeleted', {
      customerId: customerId,
      customerType: isRegisteredCustomer ? 'registered' : 'guest',
      customerName: isRegisteredCustomer ? `${customer.first_name} ${customer.last_name}` : customer.customer_name,
      deletedCounts,
      timestamp: getCurrentCentralTimeForDB(),
      deletedBy: req.user.email
    })

    console.log(`✅ Customer deletion completed successfully`)
    console.log(`📊 Deleted:`, deletedCounts)

    res.json({
      success: true,
      message: 'Customer and all related data deleted successfully',
      customer: {
        id: customerId,
        name: isRegisteredCustomer ? `${customer.first_name} ${customer.last_name}` : customer.customer_name,
        type: isRegisteredCustomer ? 'registered' : 'guest'
      },
      deletedCounts,
      timestamp: getCurrentCentralTimeForDB(),
      deletedBy: req.user.email
    })

  } catch (error) {
    console.error('❌ Error deleting customer:', error)
    res.status(500).json({ 
      error: 'Customer deletion failed', 
      details: error.message,
      message: 'The customer deletion operation failed. Please check the server logs and try again.'
    })
  }
})

// Get customer deletion preview (admin only) - shows what would be deleted
app.get('/api/admin/customers/:customerId/deletion-preview', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { customerId } = req.params

    // Check if customer exists and get their info
    let customer = null
    let isRegisteredCustomer = false
    let previewCounts = {
      orderStatusHistory: 0,
      orders: 0,
      authTokens: 0,
      customerProfiles: 0,
      userLocations: 0,
      users: 0
    }

    // First check if it's a registered customer
    if (!customerId.startsWith('guest-')) {
      customer = await queryOne('SELECT * FROM users WHERE id = ? AND role = ?', [customerId, 'customer'])
      if (customer) {
        isRegisteredCustomer = true

        // Count related data for registered customer
        const orderStatusCount = await queryOne(`
          SELECT COUNT(*) as count FROM order_status_history 
          WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)
        `, [customerId])
        previewCounts.orderStatusHistory = orderStatusCount.count

        const ordersCount = await queryOne('SELECT COUNT(*) as count FROM orders WHERE user_id = ?', [customerId])
        previewCounts.orders = ordersCount.count

        const authTokensCount = await queryOne('SELECT COUNT(*) as count FROM auth_tokens WHERE user_id = ?', [customerId])
        previewCounts.authTokens = authTokensCount.count

        const customerProfilesCount = await queryOne('SELECT COUNT(*) as count FROM customer_profiles WHERE user_id = ?', [customerId])
        previewCounts.customerProfiles = customerProfilesCount.count

        const userLocationsCount = await queryOne('SELECT COUNT(*) as count FROM user_locations WHERE user_id = ?', [customerId])
        previewCounts.userLocations = userLocationsCount.count

        previewCounts.users = 1 // The user account itself
      }
    }

    // If not found as registered customer, check if it's a guest customer
    if (!customer) {
      const guestId = customerId.replace('guest-', '')
      
      const guestOrder = await queryOne(`
        SELECT DISTINCT customer_name, customer_phone, customer_email 
        FROM orders 
        WHERE (user_id IS NULL OR user_id = '') 
        AND (customer_phone = ? OR customer_email = ? OR customer_name = ?)
        LIMIT 1
      `, [guestId, guestId, guestId])
      
      if (guestOrder) {
        customer = {
          id: customerId,
          customer_name: guestOrder.customer_name,
          customer_phone: guestOrder.customer_phone,
          customer_email: guestOrder.customer_email,
          isGuest: true
        }

        // Count guest customer's orders
        const orderStatusCount = await queryOne(`
          SELECT COUNT(*) as count FROM order_status_history 
          WHERE order_id IN (
            SELECT id FROM orders 
            WHERE (user_id IS NULL OR user_id = '') 
            AND (customer_phone = ? OR customer_email = ? OR customer_name = ?)
          )
        `, [guestId, guestId, guestId])
        previewCounts.orderStatusHistory = orderStatusCount.count

        const ordersCount = await queryOne(`
          SELECT COUNT(*) as count FROM orders 
          WHERE (user_id IS NULL OR user_id = '') 
          AND (customer_phone = ? OR customer_email = ? OR customer_name = ?)
        `, [guestId, guestId, guestId])
        previewCounts.orders = ordersCount.count
      }
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    // Get sample orders for preview
    let sampleOrders = []
    if (isRegisteredCustomer) {
      sampleOrders = await queryAll(`
        SELECT id, customer_name, total_amount, status, order_date 
        FROM orders WHERE user_id = ? 
        ORDER BY order_date DESC LIMIT 5
      `, [customerId])
    } else {
      const guestId = customerId.replace('guest-', '')
      sampleOrders = await queryAll(`
        SELECT id, customer_name, total_amount, status, order_date 
        FROM orders 
        WHERE (user_id IS NULL OR user_id = '') 
        AND (customer_phone = ? OR customer_email = ? OR customer_name = ?)
        ORDER BY order_date DESC LIMIT 5
      `, [guestId, guestId, guestId])
    }

    res.json({
      customer: {
        id: customerId,
        name: isRegisteredCustomer ? `${customer.first_name} ${customer.last_name}` : customer.customer_name,
        email: isRegisteredCustomer ? customer.email : customer.customer_email,
        phone: isRegisteredCustomer ? customer.phone : customer.customer_phone,
        type: isRegisteredCustomer ? 'registered' : 'guest',
        createdAt: isRegisteredCustomer ? customer.created_at : null
      },
      previewCounts,
      sampleOrders,
      warning: 'This operation is irreversible. The customer and all their related data will be permanently deleted.',
      timestamp: getCurrentCentralTimeForDB()
    })

  } catch (error) {
    console.error('Error generating customer deletion preview:', error)
    res.status(500).json({ error: 'Failed to generate customer deletion preview' })
  }
})

// Menu Item Options API Routes

// Get options for a specific menu item
app.get('/api/menu/:itemId/options', async (req, res) => {
  try {
    const { itemId } = req.params
    
    // Get all options for this menu item
    const options = await queryAll(
      'SELECT * FROM menu_item_options WHERE item_id = ? ORDER BY sort_order, id',
      [itemId]
    )
    
    // Get choices for each option
    const optionsWithChoices = await Promise.all(
      options.map(async (option) => {
        const choices = await queryAll(
          'SELECT * FROM menu_item_option_choices WHERE option_id = ? ORDER BY sort_order, id',
          [option.id]
        )
        return {
          ...option,
          choices
        }
      })
    )
    
    res.json(optionsWithChoices)
  } catch (error) {
    console.error('Error fetching menu item options:', error)
    res.status(500).json({ error: 'Failed to fetch menu item options' })
  }
})

// Add option to menu item
app.post('/api/menu/:itemId/options', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { itemId } = req.params
    const { name, description, option_type, is_required, sort_order, choices } = req.body

    if (!name || !option_type) {
      return res.status(400).json({ error: 'Name and option type are required' })
    }

    // Validate option_type
    if (!['radio', 'checkbox', 'select'].includes(option_type)) {
      return res.status(400).json({ error: 'Invalid option type. Must be radio, checkbox, or select' })
    }

    // Insert the option
    const optionResult = await query(
      'INSERT INTO menu_item_options (item_id, name, description, option_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [itemId, name, description, option_type, is_required || false, sort_order || 0]
    )

    let optionId
    if (optionResult.lastID) {
      // SQLite case
      optionId = optionResult.lastID
    } else {
      // PostgreSQL case - get the most recently inserted option for this item
      const createdOption = await queryOne(
        'SELECT id FROM menu_item_options WHERE item_id = ? AND name = ? ORDER BY created_at DESC LIMIT 1',
        [itemId, name]
      )
      optionId = createdOption.id
    }

    // Insert choices if provided
    if (choices && Array.isArray(choices)) {
      for (const choice of choices) {
        await query(
          'INSERT INTO menu_item_option_choices (option_id, name, price_modifier, sort_order) VALUES (?, ?, ?, ?)',
          [optionId, choice.name, choice.price_modifier || 0, choice.sort_order || 0]
        )
      }
    }

    // Return the created option with choices
    const createdOption = await queryOne('SELECT * FROM menu_item_options WHERE id = ?', [optionId])
    const optionChoices = await queryAll('SELECT * FROM menu_item_option_choices WHERE option_id = ? ORDER BY sort_order, id', [optionId])
    
    res.json({
      ...createdOption,
      choices: optionChoices
    })
  } catch (error) {
    console.error('Error adding menu item option:', error)
    res.status(500).json({ error: 'Failed to add menu item option' })
  }
})

// Update menu item option
app.put('/api/menu/:itemId/options/:optionId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { optionId } = req.params
    const { name, description, option_type, is_required, sort_order } = req.body
    
    await query(
      'UPDATE menu_item_options SET name = ?, description = ?, option_type = ?, is_required = ?, sort_order = ? WHERE id = ?',
      [name, description, option_type, is_required, sort_order, optionId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating menu item option:', error)
    res.status(500).json({ error: 'Failed to update menu item option' })
  }
})

// Delete menu item option
app.delete('/api/menu/:itemId/options/:optionId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { optionId } = req.params
    
    // Delete choices first (cascade should handle this, but being explicit)
    await query('DELETE FROM menu_item_option_choices WHERE option_id = ?', [optionId])
    
    // Delete the option
    const result = await query('DELETE FROM menu_item_options WHERE id = ?', [optionId])
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menu item option not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item option:', error)
    res.status(500).json({ error: 'Failed to delete menu item option' })
  }
})

// Menu Item Option Choices API Routes

// Add choice to option
app.post('/api/menu/:itemId/options/:optionId/choices', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { optionId } = req.params
    const { name, price_modifier, sort_order } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Choice name is required' })
    }

    const result = await query(
      'INSERT INTO menu_item_option_choices (option_id, name, price_modifier, sort_order) VALUES (?, ?, ?, ?)',
      [optionId, name, price_modifier || 0, sort_order || 0]
    )

    // Return the created choice
    let createdChoice
    if (result.lastID) {
      // SQLite case
      createdChoice = await queryOne('SELECT * FROM menu_item_option_choices WHERE id = ?', [result.lastID])
    } else {
      // PostgreSQL case
      createdChoice = await queryOne(
        'SELECT * FROM menu_item_option_choices WHERE option_id = ? AND name = ? ORDER BY created_at DESC LIMIT 1',
        [optionId, name]
      )
    }
    
    res.json(createdChoice)
  } catch (error) {
    console.error('Error adding menu item option choice:', error)
    res.status(500).json({ error: 'Failed to add menu item option choice' })
  }
})

// Update choice
app.put('/api/menu/:itemId/options/:optionId/choices/:choiceId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { choiceId } = req.params
    const { name, price_modifier, sort_order } = req.body
    
    await query(
      'UPDATE menu_item_option_choices SET name = ?, price_modifier = ?, sort_order = ? WHERE id = ?',
      [name, price_modifier, sort_order, choiceId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating menu item option choice:', error)
    res.status(500).json({ error: 'Failed to update menu item option choice' })
  }
})

// Delete choice
app.delete('/api/menu/:itemId/options/:optionId/choices/:choiceId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { choiceId } = req.params
    
    const result = await query('DELETE FROM menu_item_option_choices WHERE id = ?', [choiceId])
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menu item option choice not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item option choice:', error)
    res.status(500).json({ error: 'Failed to delete menu item option choice' })
  }
})

// Enhanced menu endpoint that includes options
app.get('/api/menu/with-options', async (req, res) => {
  try {
    const menuItems = await queryAll('SELECT * FROM menu_items WHERE available = ? ORDER BY category, name', [true])
    
    // Get options for each menu item
    const menuItemsWithOptions = await Promise.all(
      menuItems.map(async (item) => {
        const options = await queryAll(
          'SELECT * FROM menu_item_options WHERE item_id = ? ORDER BY sort_order, id',
          [item.id]
        )
        
        // Get choices for each option
        const optionsWithChoices = await Promise.all(
          options.map(async (option) => {
            const choices = await queryAll(
              'SELECT * FROM menu_item_option_choices WHERE option_id = ? ORDER BY sort_order, id',
              [option.id]
            )
            return {
              ...option,
              choices
            }
          })
        )
        
        return {
          ...item,
          options: optionsWithChoices
        }
      })
    )
    
    res.json(menuItemsWithOptions)
  } catch (error) {
    console.error('Error fetching menu items with options:', error)
    res.status(500).json({ error: 'Failed to fetch menu items with options' })
  }
})

// === OPTION TEMPLATES API ===

// Get all option templates
app.get('/api/option-templates', async (req, res) => {
  try {
    const templates = await queryAll('SELECT * FROM option_templates ORDER BY sort_order, name')
    
    // Get choices for each template
    const templatesWithChoices = await Promise.all(
      templates.map(async (template) => {
        const choices = await queryAll(
          'SELECT * FROM option_template_choices WHERE template_id = ? ORDER BY sort_order, id',
          [template.id]
        )
        return {
          ...template,
          choices
        }
      })
    )
    
    res.json(templatesWithChoices)
  } catch (error) {
    console.error('Error fetching option templates:', error)
    res.status(500).json({ error: 'Failed to fetch option templates' })
  }
})

// Create a new option template
app.post('/api/option-templates', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { name, description, option_type, is_required, sort_order, choices } = req.body

    if (!name || !option_type) {
      return res.status(400).json({ error: 'Name and option type are required' })
    }

    // Validate option_type
    if (!['radio', 'checkbox', 'select'].includes(option_type)) {
      return res.status(400).json({ error: 'Invalid option type. Must be radio, checkbox, or select' })
    }

    // Insert the template
    const templateResult = await query(
      'INSERT INTO option_templates (name, description, option_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?)',
      [name, description, option_type, is_required || false, sort_order || 0]
    )

    let templateId
    if (templateResult.lastID) {
      // SQLite case
      templateId = templateResult.lastID
    } else {
      // PostgreSQL case - get the most recently inserted template
      const createdTemplate = await queryOne(
        'SELECT id FROM option_templates WHERE name = ? ORDER BY created_at DESC LIMIT 1',
        [name]
      )
      templateId = createdTemplate.id
    }

    // Insert choices if provided
    if (choices && Array.isArray(choices)) {
      for (const choice of choices) {
        await query(
          'INSERT INTO option_template_choices (template_id, name, price_modifier, sort_order) VALUES (?, ?, ?, ?)',
          [templateId, choice.name, choice.price_modifier || 0, choice.sort_order || 0]
        )
      }
    }

    // Return the created template with choices
    const createdTemplate = await queryOne('SELECT * FROM option_templates WHERE id = ?', [templateId])
    const templateChoices = await queryAll('SELECT * FROM option_template_choices WHERE template_id = ? ORDER BY sort_order, id', [templateId])
    
    res.json({
      ...createdTemplate,
      choices: templateChoices
    })
  } catch (error) {
    console.error('Error creating option template:', error)
    res.status(500).json({ error: 'Failed to create option template' })
  }
})

// Update an option template
app.put('/api/option-templates/:templateId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { templateId } = req.params
    const { name, description, option_type, is_required, sort_order } = req.body
    
    await query(
      'UPDATE option_templates SET name = ?, description = ?, option_type = ?, is_required = ?, sort_order = ? WHERE id = ?',
      [name, description, option_type, is_required, sort_order, templateId]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating option template:', error)
    res.status(500).json({ error: 'Failed to update option template' })
  }
})

// Delete an option template
app.delete('/api/option-templates/:templateId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { templateId } = req.params
    
    // Delete choices first (cascade should handle this, but being explicit)
    await query('DELETE FROM option_template_choices WHERE template_id = ?', [templateId])
    
    // Delete template assignments from menu items
    await query('DELETE FROM menu_item_option_templates WHERE template_id = ?', [templateId])
    
    // Delete the template
    const result = await query('DELETE FROM option_templates WHERE id = ?', [templateId])
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Option template not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting option template:', error)
    res.status(500).json({ error: 'Failed to delete option template' })
  }
})

// === MENU ITEM TEMPLATE ASSIGNMENT API ===

// Get templates assigned to a menu item
app.get('/api/menu/:itemId/templates', async (req, res) => {
  try {
    const { itemId } = req.params
    
    // Get assigned templates with choices
    const assignedTemplates = await queryAll(`
      SELECT t.*, mt.sort_order as assignment_sort_order
      FROM option_templates t
      JOIN menu_item_option_templates mt ON t.id = mt.template_id
      WHERE mt.item_id = ?
      ORDER BY mt.sort_order, t.sort_order, t.name
    `, [itemId])
    
    // Get choices for each template
    const templatesWithChoices = await Promise.all(
      assignedTemplates.map(async (template) => {
        const choices = await queryAll(
          'SELECT * FROM option_template_choices WHERE template_id = ? ORDER BY sort_order, id',
          [template.id]
        )
        return {
          ...template,
          choices
        }
      })
    )
    
    res.json(templatesWithChoices)
  } catch (error) {
    console.error('Error fetching menu item templates:', error)
    res.status(500).json({ error: 'Failed to fetch menu item templates' })
  }
})

// Assign templates to a menu item
app.post('/api/menu/:itemId/templates', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { itemId } = req.params
    const { templateIds } = req.body // Array of template IDs

    if (!Array.isArray(templateIds)) {
      return res.status(400).json({ error: 'templateIds must be an array' })
    }

    // Clear existing template assignments
    await query('DELETE FROM menu_item_option_templates WHERE item_id = ?', [itemId])

    // Assign new templates
    for (let i = 0; i < templateIds.length; i++) {
      await query(
        'INSERT INTO menu_item_option_templates (item_id, template_id, sort_order) VALUES (?, ?, ?)',
        [itemId, templateIds[i], i]
      )
    }

    res.json({ success: true, assigned: templateIds.length })
  } catch (error) {
    console.error('Error assigning templates to menu item:', error)
    res.status(500).json({ error: 'Failed to assign templates to menu item' })
  }
})

// Remove a specific template from a menu item
app.delete('/api/menu/:itemId/templates/:templateId', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const { itemId, templateId } = req.params
    
    const result = await query('DELETE FROM menu_item_option_templates WHERE item_id = ? AND template_id = ?', [itemId, templateId])
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Template assignment not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error removing template from menu item:', error)
    res.status(500).json({ error: 'Failed to remove template from menu item' })
  }
})

// Get enhanced menu with options from both direct options and templates
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await queryAll('SELECT * FROM menu_items ORDER BY category, name')
    
    // Get options for each menu item (both direct options and template-based options)
    const menuItemsWithOptions = await Promise.all(
      menuItems.map(async (item) => {
        // Get direct options
        const directOptions = await queryAll(
          'SELECT * FROM menu_item_options WHERE item_id = ? ORDER BY sort_order, id',
          [item.id]
        )
        
        // Get direct option choices
        const directOptionsWithChoices = await Promise.all(
          directOptions.map(async (option) => {
            const choices = await queryAll(
              'SELECT * FROM menu_item_option_choices WHERE option_id = ? ORDER BY sort_order, id',
              [option.id]
            )
            return {
              ...option,
              choices,
              source: 'direct'
            }
          })
        )

        // Get template-based options
        const templateOptions = await queryAll(`
          SELECT t.*, mt.sort_order as assignment_sort_order
          FROM option_templates t
          JOIN menu_item_option_templates mt ON t.id = mt.template_id
          WHERE mt.item_id = ?
          ORDER BY mt.sort_order, t.sort_order, t.name
        `, [item.id])
        
        // Get template option choices
        const templateOptionsWithChoices = await Promise.all(
          templateOptions.map(async (template) => {
            const choices = await queryAll(
              'SELECT * FROM option_template_choices WHERE template_id = ? ORDER BY sort_order, id',
              [template.id]
            )
            return {
              ...template,
              choices,
              source: 'template',
              template_id: template.id
            }
          })
        )
        
        // Combine both direct and template options
        const allOptions = [...directOptionsWithChoices, ...templateOptionsWithChoices]
        
        return {
          ...item,
          options: allOptions
        }
      })
    )
    
    res.json(menuItemsWithOptions)
  } catch (error) {
    console.error('Error fetching menu items:', error)
    res.status(500).json({ error: 'Failed to fetch menu items' })
  }
})

// Locations API Routes