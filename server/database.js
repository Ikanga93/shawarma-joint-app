import pg from 'pg'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'

// Load environment variables FIRST before any database configuration
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database configuration
const isDevelopment = process.env.NODE_ENV !== 'production'

// Railway provides these environment variables automatically when you add PostgreSQL
const railwayDatabaseUrl = process.env.DATABASE_URL || 
                          process.env.DATABASE_PRIVATE_URL || 
                          process.env.DATABASE_PUBLIC_URL ||
                          process.env.POSTGRES_URL

const hasPostgresUrl = railwayDatabaseUrl && railwayDatabaseUrl.startsWith('postgresql://')

console.log('🔍 Environment check:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('isDevelopment:', isDevelopment)
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('DATABASE_PRIVATE_URL exists:', !!process.env.DATABASE_PRIVATE_URL)
console.log('DATABASE_PUBLIC_URL exists:', !!process.env.DATABASE_PUBLIC_URL)
console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL)
console.log('hasPostgresUrl:', hasPostgresUrl)

let db
let isPostgreSQL = false

// Use PostgreSQL when available (production or when DATABASE_URL is explicitly provided)
if (hasPostgresUrl) {
  // Use PostgreSQL when URL is available
  console.log('🚀 Using PostgreSQL database')
  console.log('🔗 Database URL found:', railwayDatabaseUrl ? 'Yes (hidden for security)' : 'No')
  console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production')
  
  const { Pool } = pg
  
  const pool = new Pool({
    connectionString: railwayDatabaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
  
  // Test the connection and set up database
  try {
    const client = await pool.connect()
    console.log('✅ PostgreSQL connected successfully')
    client.release()
    db = pool
    isPostgreSQL = true
  } catch (err) {
    console.error('❌ PostgreSQL connection failed:', err.message)
    console.error('❌ Falling back to SQLite...')
    
    // Fallback to SQLite if PostgreSQL fails
    const dbPath = path.join(__dirname, 'orders.db')
    db = new sqlite3.Database(dbPath)
    isPostgreSQL = false
    console.log('⚠️ Using SQLite as fallback database')
  }
  
} else {
  // Development: Use SQLite for local development
  console.log('🔧 Development mode: Using SQLite database')
  const dbPath = isDevelopment ? path.join(__dirname, 'orders.db') : './orders.db'
  db = new sqlite3.Database(dbPath)
  isPostgreSQL = false
  
  if (!isDevelopment && !hasPostgresUrl) {
    console.log('⚠️ No PostgreSQL URL found in production - using SQLite')
    console.log('⚠️ Consider setting up PostgreSQL for better production performance')
  } else if (isDevelopment) {
    console.log('💡 To use PostgreSQL in development, set DATABASE_URL environment variable')
  }
}

// Helper function to run queries
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isPostgreSQL) {
      // Convert ? placeholders to PostgreSQL $1, $2, $3... format
      let convertedSql = sql
      let paramIndex = 1
      while (convertedSql.includes('?')) {
        convertedSql = convertedSql.replace('?', `$${paramIndex}`)
        paramIndex++
      }
      
      // PostgreSQL
      db.query(convertedSql, params)
        .then(result => {
          if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
            resolve({ 
              insertId: result.insertId || result.rows[0]?.id, 
              changes: result.rowCount,
              lastID: result.insertId || result.rows[0]?.id
            })
          } else if (sql.includes('SELECT') && sql.includes('LIMIT 1')) {
            resolve(result.rows[0])
          } else {
            resolve(result.rows)
          }
        })
        .catch(err => reject(err))
    } else {
      // SQLite
      if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
        db.run(sql, params, function(err) {
          if (err) reject(err)
          else resolve({ insertId: this.lastID, changes: this.changes, lastID: this.lastID })
        })
      } else if (sql.includes('SELECT') && sql.includes('LIMIT 1')) {
        // Single row query
        db.get(sql, params, (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      } else {
        // Multiple rows query
        db.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      }
    }
  })
}

// Helper function for single row queries
export const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isPostgreSQL) {
      // Convert ? placeholders to PostgreSQL $1, $2, $3... format
      let convertedSql = sql
      let paramIndex = 1
      while (convertedSql.includes('?')) {
        convertedSql = convertedSql.replace('?', `$${paramIndex}`)
        paramIndex++
      }
      
      db.query(convertedSql, params)
        .then(result => resolve(result.rows[0]))
        .catch(err => reject(err))
    } else {
      db.get(sql, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    }
  })
}

// Helper function for multiple row queries
export const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isPostgreSQL) {
      // Convert ? placeholders to PostgreSQL $1, $2, $3... format
      let convertedSql = sql
      let paramIndex = 1
      while (convertedSql.includes('?')) {
        convertedSql = convertedSql.replace('?', `$${paramIndex}`)
        paramIndex++
      }
      
      db.query(convertedSql, params)
        .then(result => resolve(result.rows))
        .catch(err => reject(err))
    } else {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    }
  })
}

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    if (isPostgreSQL) {
      // PostgreSQL table creation (convert SQLite to PostgreSQL syntax)
      console.log('🔧 Initializing PostgreSQL tables...')
      await initializePostgreSQLTables()
    } else {
      // SQLite table creation (keep existing structure)
      console.log('🔧 Initializing SQLite tables...')
      await initializeSQLiteTables()
    }
    
    // Run migrations for existing tables
    await runMigrations()
    
    // Create default admin user
    await createDefaultAdminUser()
    
    // Create default option templates
    await createDefaultOptionTemplates()
    
    console.log('✅ Database tables initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
    throw error // Re-throw to see the full error
  }
}

// Run database migrations
const runMigrations = async () => {
  try {
    // Migration: Add stripe_session_id to orders table if it doesn't exist
    if (isPostgreSQL) {
      await query(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS stripe_session_id TEXT
      `)
      await query(`
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2)
      `)
    } else {
      // For SQLite, check if columns exist first
      const tableInfo = await queryAll("PRAGMA table_info(orders)")
      const hasStripeSessionId = tableInfo.some(col => col.name === 'stripe_session_id')
      const hasOrderDate = tableInfo.some(col => col.name === 'order_date')
      const hasTotalAmount = tableInfo.some(col => col.name === 'total_amount')
      const hasOldTotal = tableInfo.some(col => col.name === 'total')
      
      if (!hasStripeSessionId) {
        await query(`ALTER TABLE orders ADD COLUMN stripe_session_id TEXT`)
        console.log('✅ Added stripe_session_id column to orders table')
      }
      
      if (!hasOrderDate) {
        await query(`ALTER TABLE orders ADD COLUMN order_date DATETIME DEFAULT CURRENT_TIMESTAMP`)
        console.log('✅ Added order_date column to orders table')
        
        // Update existing orders that don't have order_date set
        await query(`UPDATE orders SET order_date = CURRENT_TIMESTAMP WHERE order_date IS NULL`)
        console.log('✅ Updated existing orders with order_date')
      }
      
      if (!hasTotalAmount) {
        await query(`ALTER TABLE orders ADD COLUMN total_amount REAL`)
        console.log('✅ Added total_amount column to orders table')
        
        // Update existing orders that don't have total_amount set
        await query(`UPDATE orders SET total_amount = COALESCE(subtotal + tax, subtotal, 0) WHERE total_amount IS NULL`)
        console.log('✅ Updated existing orders with total_amount')
      }
      
      // Migration: Clean up duplicate total/total_amount columns
      if (hasOldTotal && hasTotalAmount) {
        // Copy data from old total column to total_amount if total_amount is null
        await query(`UPDATE orders SET total_amount = total WHERE total_amount IS NULL`)
        console.log('✅ Migrated data from total to total_amount column')
        
        // Since SQLite doesn't support DROP COLUMN directly, we need to recreate the table
        await query(`
          CREATE TABLE orders_new (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            customer_email TEXT,
            items TEXT NOT NULL,
            subtotal REAL,
            tax REAL,
            total_amount REAL NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            payment_method TEXT,
            payment_status TEXT DEFAULT 'pending',
            stripe_session_id TEXT,
            order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            estimated_completion DATETIME,
            estimated_time INTEGER,
            time_remaining INTEGER DEFAULT 0,
            location_id TEXT,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `)
        
        // Copy data to new table
        await query(`
          INSERT INTO orders_new 
          SELECT 
            id, user_id, customer_name, customer_phone, customer_email, items,
            subtotal, tax, total_amount, status, payment_method, payment_status,
            stripe_session_id, order_date, estimated_completion, estimated_time,
            time_remaining, location_id, notes
          FROM orders
        `)
        
        // Drop old table and rename new one
        await query(`DROP TABLE orders`)
        await query(`ALTER TABLE orders_new RENAME TO orders`)
        console.log('✅ Cleaned up duplicate total column')
      }
    }
    
    console.log('✅ Database migrations completed')
  } catch (error) {
    console.log('ℹ️ Migration note:', error.message)
    // Don't throw error for migrations - they might fail if column already exists
  }
}

const initializeSQLiteTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        role TEXT NOT NULL CHECK(role IN ('admin', 'customer')),
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)

      // Menu items table
      db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        emoji TEXT,
        image_url TEXT,
        available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)

      // Menu item options table (for customizations like size, toppings, etc.)
      db.run(`CREATE TABLE IF NOT EXISTS menu_item_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        option_type TEXT NOT NULL CHECK(option_type IN ('radio', 'checkbox', 'select')),
        is_required BOOLEAN DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES menu_items (id) ON DELETE CASCADE
      )`)

      // Menu item option choices table (individual choices for each option)
      db.run(`CREATE TABLE IF NOT EXISTS menu_item_option_choices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        option_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price_modifier REAL DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (option_id) REFERENCES menu_item_options (id) ON DELETE CASCADE
      )`)

      // Option templates table (reusable option templates)
      db.run(`CREATE TABLE IF NOT EXISTS option_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        option_type TEXT NOT NULL CHECK(option_type IN ('radio', 'checkbox', 'select')),
        is_required BOOLEAN DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)

      // Option template choices table (choices for each template)
      db.run(`CREATE TABLE IF NOT EXISTS option_template_choices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        price_modifier REAL DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (template_id) REFERENCES option_templates (id) ON DELETE CASCADE
      )`)

      // Menu item option templates junction table (assigns templates to menu items)
      db.run(`CREATE TABLE IF NOT EXISTS menu_item_option_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        template_id INTEGER NOT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(item_id, template_id),
        FOREIGN KEY (item_id) REFERENCES menu_items (id) ON DELETE CASCADE,
        FOREIGN KEY (template_id) REFERENCES option_templates (id) ON DELETE CASCADE
      )`)

      // Orders table
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        items TEXT NOT NULL,
        subtotal REAL,
        tax REAL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        stripe_session_id TEXT,
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        estimated_completion DATETIME,
        estimated_time INTEGER,
        time_remaining INTEGER DEFAULT 0,
        location_id TEXT,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`)

      // Auth tokens table
      db.run(`CREATE TABLE IF NOT EXISTS auth_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        type TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`)

      // Customer profiles table
      db.run(`CREATE TABLE IF NOT EXISTS customer_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        preferences TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`)

      // Admin profiles table
      db.run(`CREATE TABLE IF NOT EXISTS admin_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        permissions TEXT,
        current_location_id TEXT,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (current_location_id) REFERENCES locations (id)
      )`)

      // User location assignments table
      db.run(`CREATE TABLE IF NOT EXISTS user_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        role TEXT DEFAULT 'staff' CHECK(role IN ('admin', 'manager', 'staff')),
        assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        assigned_by TEXT,
        is_active BOOLEAN DEFAULT 1,
        UNIQUE(user_id, location_id),
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (location_id) REFERENCES locations (id),
        FOREIGN KEY (assigned_by) REFERENCES users (id)
      )`)

      // Order status history table
      db.run(`CREATE TABLE IF NOT EXISTS order_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id TEXT NOT NULL,
        status TEXT NOT NULL,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        changed_by TEXT,
        location_id TEXT,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (changed_by) REFERENCES users (id),
        FOREIGN KEY (location_id) REFERENCES locations (id)
      )`)

      // Locations table
      db.run(`CREATE TABLE IF NOT EXISTS locations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'mobile',
        description TEXT,
        current_location TEXT,
        schedule TEXT,
        phone TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)

      // Live locations table - for real-time food truck locations (SQLite version)
      db.run(`CREATE TABLE IF NOT EXISTS live_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        truck_name TEXT NOT NULL,
        current_address TEXT NOT NULL,
        latitude REAL,
        longitude REAL, 
        description TEXT,
        hours_today TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)
      
      resolve()
    })
  })
}

const initializePostgreSQLTables = async () => {
  // Users table (must be first)
  await query(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255) UNIQUE,
    password_hash TEXT,
    role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'customer')),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Locations table (must be before admin_profiles due to foreign key)
  await query(`CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'mobile',
    description TEXT,
    current_location VARCHAR(255),
    schedule TEXT,
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Menu items table
  await query(`CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Menu item options table (for customizations like size, toppings, etc.)
  await query(`CREATE TABLE IF NOT EXISTS menu_item_options (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    option_type VARCHAR(50) NOT NULL CHECK(option_type IN ('radio', 'checkbox', 'select')),
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES menu_items (id) ON DELETE CASCADE
  )`)

  // Menu item option choices table (individual choices for each option)
  await query(`CREATE TABLE IF NOT EXISTS menu_item_option_choices (
    id SERIAL PRIMARY KEY,
    option_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (option_id) REFERENCES menu_item_options (id) ON DELETE CASCADE
  )`)

  // Option templates table (reusable option templates)
  await query(`CREATE TABLE IF NOT EXISTS option_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    option_type VARCHAR(50) NOT NULL CHECK(option_type IN ('radio', 'checkbox', 'select')),
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Option template choices table (choices for each template)
  await query(`CREATE TABLE IF NOT EXISTS option_template_choices (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    price_modifier DECIMAL(10,2) DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES option_templates (id) ON DELETE CASCADE
  )`)

  // Menu item option templates junction table (assigns templates to menu items)
  await query(`CREATE TABLE IF NOT EXISTS menu_item_option_templates (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(item_id, template_id),
    FOREIGN KEY (item_id) REFERENCES menu_items (id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES option_templates (id) ON DELETE CASCADE
  )`)

  // Orders table
  await query(`CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    items TEXT NOT NULL,
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    stripe_session_id TEXT,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_completion TIMESTAMP,
    estimated_time INTEGER,
    time_remaining INTEGER DEFAULT 0,
    location_id VARCHAR(255),
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)

  // Auth tokens table
  await query(`CREATE TABLE IF NOT EXISTS auth_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)

  // Customer profiles table
  await query(`CREATE TABLE IF NOT EXISTS customer_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)

  // Admin profiles table (now after locations table)
  await query(`CREATE TABLE IF NOT EXISTS admin_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB,
    current_location_id VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (current_location_id) REFERENCES locations (id)
  )`)

  // User location assignments table - many-to-many relationship
  await query(`CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    location_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff' CHECK(role IN ('admin', 'manager', 'staff')),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, location_id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (location_id) REFERENCES locations (id),
    FOREIGN KEY (assigned_by) REFERENCES users (id)
  )`)

  // Order status history table
  await query(`CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255),
    location_id VARCHAR(255),
    FOREIGN KEY (order_id) REFERENCES orders (id),
    FOREIGN KEY (changed_by) REFERENCES users (id),
    FOREIGN KEY (location_id) REFERENCES locations (id)
  )`)

  // Live locations table - for real-time food truck locations
  await query(`CREATE TABLE IF NOT EXISTS live_locations (
    id SERIAL PRIMARY KEY,
    truck_name VARCHAR(255) NOT NULL,
    current_address VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8), 
    description TEXT,
    hours_today VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)
}

// Helper function to create default admin user
const createDefaultAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin@mosburrito.com'
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    // Check if admin user already exists
    const existingAdmin = await queryOne(
      'SELECT * FROM users WHERE email = ? OR role = ?',
      [adminEmail, 'admin']
    )
    
    if (existingAdmin) {
      console.log('✅ Default admin user already exists')
      return
    }
    
    console.log('🔧 Creating default admin user...')
    
    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(adminPassword, salt)
    
    // Create admin user
    const userId = `ADMIN-${uuidv4().substring(0, 8).toUpperCase()}`
    await query(
      'INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, adminEmail, passwordHash, 'admin', 'Admin', 'User']
    )
    
    // Create admin profile
    await query('INSERT INTO admin_profiles (user_id) VALUES (?)', [userId])
    
    console.log('✅ Default admin user created successfully')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('   ⚠️  Please change the default password after first login!')
    
  } catch (error) {
    console.error('❌ Error creating default admin user:', error)
    // Don't throw error to prevent app startup failure
  }
}

// Helper function to create default option templates
const createDefaultOptionTemplates = async () => {
  try {
    // Check if templates already exist
    const existingTemplates = await queryAll('SELECT * FROM option_templates LIMIT 1')
    
    if (existingTemplates.length > 0) {
      console.log('✅ Default option templates already exist')
      return
    }
    
    console.log('🔧 Creating default option templates...')
    
    // Define default option templates
    const defaultTemplates = [
      {
        name: 'Size',
        description: 'Choose your portion size',
        option_type: 'radio',
        is_required: true,
        sort_order: 1,
        choices: [
          { name: 'Small', price_modifier: 0, sort_order: 1 },
          { name: 'Medium', price_modifier: 2.00, sort_order: 2 },
          { name: 'Large', price_modifier: 4.00, sort_order: 3 }
        ]
      },
      {
        name: 'Protein',
        description: 'Choose your protein',
        option_type: 'radio',
        is_required: true,
        sort_order: 2,
        choices: [
          { name: 'Chicken', price_modifier: 0, sort_order: 1 },
          { name: 'Beef', price_modifier: 1.50, sort_order: 2 },
          { name: 'Lamb', price_modifier: 2.50, sort_order: 3 },
          { name: 'Mixed (Chicken & Beef)', price_modifier: 1.00, sort_order: 4 },
          { name: 'Falafel (Vegetarian)', price_modifier: -0.50, sort_order: 5 }
        ]
      },
      {
        name: 'Spice Level',
        description: 'How spicy would you like it?',
        option_type: 'radio',
        is_required: false,
        sort_order: 3,
        choices: [
          { name: 'Mild', price_modifier: 0, sort_order: 1 },
          { name: 'Medium', price_modifier: 0, sort_order: 2 },
          { name: 'Hot', price_modifier: 0, sort_order: 3 },
          { name: 'Extra Hot', price_modifier: 0, sort_order: 4 }
        ]
      },
      {
        name: 'Toppings',
        description: 'Add your favorite toppings',
        option_type: 'checkbox',
        is_required: false,
        sort_order: 4,
        choices: [
          { name: 'Extra Pickles', price_modifier: 0.50, sort_order: 1 },
          { name: 'Extra Tomatoes', price_modifier: 0.50, sort_order: 2 },
          { name: 'Extra Onions', price_modifier: 0.50, sort_order: 3 },
          { name: 'Extra Cucumbers', price_modifier: 0.50, sort_order: 4 },
          { name: 'Extra Lettuce', price_modifier: 0.50, sort_order: 5 },
          { name: 'Jalapeños', price_modifier: 0.75, sort_order: 6 },
          { name: 'Hummus', price_modifier: 1.00, sort_order: 7 },
          { name: 'Tabouleh', price_modifier: 1.25, sort_order: 8 }
        ]
      },
      {
        name: 'Sauce',
        description: 'Choose your sauce',
        option_type: 'checkbox',
        is_required: false,
        sort_order: 5,
        choices: [
          { name: 'Garlic Sauce', price_modifier: 0, sort_order: 1 },
          { name: 'Tahini Sauce', price_modifier: 0, sort_order: 2 },
          { name: 'Hot Sauce', price_modifier: 0, sort_order: 3 },
          { name: 'Yogurt Sauce', price_modifier: 0, sort_order: 4 },
          { name: 'Amba (Pickled Mango)', price_modifier: 0.50, sort_order: 5 },
          { name: 'Schug (Green Hot Sauce)', price_modifier: 0.50, sort_order: 6 }
        ]
      },
      {
        name: 'Bread Type',
        description: 'Choose your bread',
        option_type: 'radio',
        is_required: false,
        sort_order: 6,
        choices: [
          { name: 'Pita Bread', price_modifier: 0, sort_order: 1 },
          { name: 'Laffa Bread', price_modifier: 0.50, sort_order: 2 },
          { name: 'Whole Wheat Pita', price_modifier: 0.25, sort_order: 3 }
        ]
      },
      {
        name: 'Drink Size',
        description: 'Choose your drink size',
        option_type: 'radio',
        is_required: false,
        sort_order: 7,
        choices: [
          { name: 'Small (12oz)', price_modifier: 0, sort_order: 1 },
          { name: 'Medium (16oz)', price_modifier: 0.50, sort_order: 2 },
          { name: 'Large (20oz)', price_modifier: 1.00, sort_order: 3 }
        ]
      }
    ]
    
    // Create each template
    for (const template of defaultTemplates) {
      // Insert the template
      const templateResult = await query(
        'INSERT INTO option_templates (name, description, option_type, is_required, sort_order) VALUES (?, ?, ?, ?, ?)',
        [template.name, template.description, template.option_type, template.is_required, template.sort_order]
      )

      let templateId
      if (templateResult.lastID) {
        // SQLite case
        templateId = templateResult.lastID
      } else {
        // PostgreSQL case - get the most recently inserted template
        const createdTemplate = await queryOne(
          'SELECT id FROM option_templates WHERE name = ? ORDER BY created_at DESC LIMIT 1',
          [template.name]
        )
        templateId = createdTemplate.id
      }

      // Insert choices for the template
      for (const choice of template.choices) {
        await query(
          'INSERT INTO option_template_choices (template_id, name, price_modifier, sort_order) VALUES (?, ?, ?, ?)',
          [templateId, choice.name, choice.price_modifier, choice.sort_order]
        )
      }
    }
    
    console.log('✅ Default option templates created successfully')
    console.log(`   Created ${defaultTemplates.length} option templates:`)
    defaultTemplates.forEach(template => {
      console.log(`   - ${template.name} (${template.choices.length} choices)`)
    })
    
  } catch (error) {
    console.error('❌ Error creating default option templates:', error)
    // Don't throw error to prevent app startup failure
  }
}

// Data migration function to transfer data from SQLite to PostgreSQL
export const migrateSQLiteToPostgreSQL = async () => {
  if (!isPostgreSQL) {
    console.log('⚠️ Not connected to PostgreSQL, skipping migration')
    return
  }
  
  try {
    console.log('🔄 Starting data migration from SQLite to PostgreSQL...')
    
    // Read data from SQLite
    const sqliteDbPath = path.join(__dirname, 'orders.db')
    const sqliteDb = new sqlite3.Database(sqliteDbPath)
    
    const sqliteQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      })
    }
    
    // Migrate users
    const users = await sqliteQuery('SELECT * FROM users')
    console.log(`📊 Found ${users.length} users to migrate`)
    
    for (const user of users) {
      try {
        await query(
          'INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING',
          [user.id, user.email, user.phone, user.password_hash, user.role, user.first_name, user.last_name, user.created_at, user.updated_at]
        )
      } catch (err) {
        console.log(`⚠️ User ${user.email} already exists, skipping`)
      }
    }
    
    // Migrate menu items
    const menuItems = await sqliteQuery('SELECT * FROM menu_items')
    console.log(`📊 Found ${menuItems.length} menu items to migrate`)
    
    for (const item of menuItems) {
      try {
        await query(
          'INSERT INTO menu_items (id, name, description, price, category, emoji, image_url, available, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING',
          [item.id, item.name, item.description, item.price, item.category, item.emoji, item.image_url, item.available, item.created_at, item.updated_at]
        )
      } catch (err) {
        console.log(`⚠️ Menu item ${item.name} already exists or failed to migrate`)
      }
    }
    
    // Migrate orders
    const orders = await sqliteQuery('SELECT * FROM orders')
    console.log(`📊 Found ${orders.length} orders to migrate`)
    
    for (const order of orders) {
      try {
        await query(
          'INSERT INTO orders (id, user_id, customer_name, customer_phone, customer_email, items, subtotal, tax, total_amount, status, payment_method, payment_status, stripe_session_id, order_date, estimated_completion, estimated_time, time_remaining, location_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING',
          [order.id, order.user_id, order.customer_name, order.customer_phone, order.customer_email, order.items, order.subtotal, order.tax, order.total_amount, order.status, order.payment_method, order.payment_status, order.stripe_session_id, order.order_date, order.estimated_completion, order.estimated_time, order.time_remaining, order.location_id, order.notes]
        )
      } catch (err) {
        console.log(`⚠️ Order ${order.id} already exists or failed to migrate`)
      }
    }
    
    // Migrate locations
    const locations = await sqliteQuery('SELECT * FROM locations')
    console.log(`📊 Found ${locations.length} locations to migrate`)
    
    for (const location of locations) {
      try {
        await query(
          'INSERT INTO locations (id, name, type, description, current_location, schedule, phone, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING',
          [location.id, location.name, location.type, location.description, location.current_location, location.schedule, location.phone, location.status, location.created_at, location.updated_at]
        )
      } catch (err) {
        console.log(`⚠️ Location ${location.name} already exists or failed to migrate`)
      }
    }
    
    // Close SQLite connection
    sqliteDb.close()
    
    console.log('✅ Data migration completed successfully!')
    console.log('💡 You can now remove the SQLite database file if desired')
    
  } catch (error) {
    console.error('❌ Error during data migration:', error)
    throw error
  }
}

// Export the database connection and utility functions
export { db, isPostgreSQL }
