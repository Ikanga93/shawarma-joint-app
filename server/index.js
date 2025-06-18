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
import { query, queryOne, queryAll, initializeDatabase } from './database.js'
import http from 'http'

// Load environment variables first
dotenv.config()

// Global error handling to prevent crashes
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error)
  console.error('Stack:', error.stack)
  // Log but don't exit in production to maintain service availability
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason)
  // Log but don't exit in production to maintain service availability
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
})

// Enhanced environment debugging for Railway
console.log('🔍 Environment check:')
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
  console.log('🚂 Railway Environment:', process.env.RAILWAY_ENVIRONMENT)
  console.log('🚂 Railway Service Name:', process.env.RAILWAY_SERVICE_NAME)
  console.log('🚂 Railway Project ID:', process.env.RAILWAY_PROJECT_ID)
}

const hasPostgresUrl = process.env.DATABASE_URL || process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_PUBLIC_URL || process.env.POSTGRES_URL
console.log('hasPostgresUrl:', !!hasPostgresUrl)

if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Production mode: Using PostgreSQL database')
  if (hasPostgresUrl) {
    console.log('🔗 Database URL found: Yes (hidden for security)')
  } else {
    console.log('❌ No database URL found! Check Railway PostgreSQL service connection.')
  }
} else {
  console.log('🔧 Development mode: Using SQLite database')
}

// Set timezone to Central Time
process.env.TZ = 'America/Chicago'

// Helper function to get current Central Time
const getCentralTime = () => {
  return new Date().toLocaleString("en-US", {timeZone: "America/Chicago"})
}

// Helper function to format date for SQLite in Central Time
const formatDateForDB = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", {timeZone: "America/Chicago"}))
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')
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
  console.log('🏥 Health check endpoint called')
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    port: process.env.PORT,
    host: process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
  })
})

// Simple test endpoint for debugging 502 errors
app.get('/test', (req, res) => {
  console.log('🧪 Test endpoint called')
  res.json({ 
    message: 'Server is responding!', 
    timestamp: new Date().toISOString(),
    port: process.env.PORT,
    host: req.get('host'),
    url: req.url,
    method: req.method
  })
})

// Root endpoint
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint called')
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
        status, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, customerName, customerPhone, customerEmail, JSON.stringify(items),
        subtotal, tax, total, locationId, estimatedTime, timeRemaining,
        'pending_payment', userId
      ]
    )

    // Add initial status to history
    await query(
      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
      [orderId, 'pending_payment']
    )

    // Determine frontend URL dynamically
    let frontendUrl = process.env.FRONTEND_URL
    
    if (!frontendUrl) {
      // For Railway deployments, use the same domain but with https
      const host = req.get('host')
      if (host && host.includes('railway.app')) {
        frontendUrl = `https://${host}`
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
    
    // Log the frontend URL for debugging
    console.log(`🔗 Frontend URL for Stripe: ${frontendUrl}`)
    console.log(`🔗 Success URL will be: ${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`)

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
      success_url: `${frontendUrl}/order-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${frontendUrl}/`,
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

// Get all orders (for admin dashboard)
app.get('/api/orders', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM orders ORDER by order_date DESC')
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      orderTime: new Date(row.order_date)
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

    console.log(`🔍 Verifying payment for session: ${sessionId}, order: ${orderId}`)

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    console.log(`💳 Stripe session status: ${session.payment_status}`)

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

      console.log(`✅ Payment verified successfully for order: ${orderId}`)
      res.json({ success: true, paymentStatus: 'completed' })
    } else {
      console.log(`⚠️ Payment not completed. Status: ${session.payment_status}`)
      res.json({ success: false, paymentStatus: session.payment_status })
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error)
    
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
    const rows = await queryAll('SELECT * FROM menu_items ORDER BY category, name')
    res.json(rows)
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
      'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, emoji = ?, available = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, price, category, emoji, available, image_url, id]
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
      'UPDATE locations SET name = ?, type = ?, description = ?, current_location = ?, schedule = ?, phone = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, type, description, current_location, schedule, phone, status, id]
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
      'INSERT INTO live_locations (truck_name, current_address, latitude, longitude, description, hours_today, last_updated) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [truck_name, finalAddress, latitude, longitude, description, hours_today]
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
      'UPDATE live_locations SET truck_name = ?, current_address = ?, latitude = ?, longitude = ?, description = ?, hours_today = ?, is_active = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?',
      [truck_name, current_address, latitude, longitude, description, hours_today, is_active, id]
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
  console.log('🕐 Starting cooking timer...')
  setInterval(async () => {
    try {
      console.log('🔄 Timer running - checking cooking orders...')
      // Simplified query to debug SQL syntax
      const rows = await queryAll('SELECT * FROM orders WHERE status = ? AND time_remaining > 0', ['cooking'])
      console.log(`📊 Found ${rows.length} cooking orders`)
      
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

    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required' })
    }

    // Find user
    const user = await queryOne(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [email || phone, phone || email]
    )

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

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
      await query(
        'UPDATE admin_profiles SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
        [user.id]
      )
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      accessToken,
      refreshToken
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
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

    // Check if token exists in database
    const token = await queryOne(
      'SELECT * FROM auth_tokens WHERE token = ? AND type = ? AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken, 'refresh']
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
    console.log(`🔄 Serving React app for route: ${req.path}`)
    console.log(`🔄 Full URL: ${req.protocol}://${req.get('host')}${req.originalUrl}`)
    console.log(`🔄 Query params: ${JSON.stringify(req.query)}`)
    
    // Check for double slash in path and log it
    if (req.path.includes('//')) {
      console.log(`⚠️ DOUBLE SLASH DETECTED in path: ${req.path}`)
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
      console.error('❌ index.html not found at:', indexPath);
      res.status(500).send('Server configuration error: index.html not found');
    }
  })
}

// Start server
const PORT = process.env.PORT || 3002
const HOST = process.env.NODE_ENV === 'production' ? '::' : 'localhost'

console.log(`🔧 Starting server with PORT: ${PORT}, HOST: ${HOST}`)

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`)
  console.log(`📊 Dashboard: http://${HOST}:${PORT}/api/dashboard`)
  console.log(`🛒 Orders API: http://${HOST}:${PORT}/api/orders`)
  console.log(`💚 Health Check: http://${HOST}:${PORT}/health`)
  console.log(`✅ Server startup successful!`)
  
  // Simplified health check for Railway environment
  setTimeout(() => {
    // Skip health check in production to avoid connection issues
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔍 Health check skipped in production environment`)
      console.log(`✅ Server is ready to accept connections`)
      return
    }
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET'
    }
    
    const req = http.request(options, (res) => {
      console.log(`🔍 Health check status: ${res.statusCode}`)
      if (res.statusCode === 200) {
        console.log(`✅ Health check passed - server is responding correctly`)
      } else {
        console.log(`⚠️ Health check returned status ${res.statusCode}`)
      }
    })
    
    req.on('error', (err) => {
      console.error('❌ Health check failed:', err.message)
    })
    
    req.setTimeout(5000, () => {
      req.destroy()
      console.log('⏰ Health check timed out')
    })
    
    req.end()
  }, 2000) // Wait 2 seconds after startup
}).on('error', (err) => {
  console.error('❌ Server startup failed:', err)
  console.error('Error code:', err.code)
  console.error('Error message:', err.message)
  
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`)
    console.error(`💡 Try a different port or kill the process using this port`)
  } else if (err.code === 'EACCES') {
    console.error(`Permission denied to bind to port ${PORT}`)
    console.error(`💡 Try running with elevated privileges or use a port > 1024`)
  } else if (err.code === 'ENOTFOUND') {
    console.error(`Host ${HOST} not found`)
    console.error(`💡 Check if the host address is correct`)
  }
  
  // Don't exit in production to prevent Railway from restarting unnecessarily
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1)
  }
}) 