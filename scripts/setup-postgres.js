#!/usr/bin/env node

/**
 * PostgreSQL Setup and Migration Script
 * 
 * This script helps you:
 * 1. Test PostgreSQL connection
 * 2. Initialize PostgreSQL tables
 * 3. Migrate data from SQLite to PostgreSQL
 * 
 * Usage:
 *   node scripts/setup-postgres.js --help
 *   node scripts/setup-postgres.js --test
 *   node scripts/setup-postgres.js --migrate
 */

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Function to create .env file with DATABASE_URL
async function createEnvFile(databaseUrl) {
  const envPath = path.join(__dirname, '..', '.env')
  let envContent = ''
  
  try {
    // Read existing .env file if it exists
    envContent = await fs.readFile(envPath, 'utf8')
  } catch (error) {
    // File doesn't exist, start with empty content
    console.log('📝 Creating new .env file...')
  }
  
  // Check if DATABASE_URL already exists
  if (envContent.includes('DATABASE_URL=')) {
    console.log('⚠️ DATABASE_URL already exists in .env file')
    console.log('💡 Please update it manually if needed')
    return
  }
  
  // Add DATABASE_URL to the env file
  const newLine = envContent.endsWith('\n') || envContent === '' ? '' : '\n'
  envContent += `${newLine}# PostgreSQL Database URL from Railway\nDATABASE_URL=${databaseUrl}\n`
  
  await fs.writeFile(envPath, envContent)
  console.log('✅ Added DATABASE_URL to .env file')
}

// Function to test PostgreSQL connection
async function testConnection() {
  try {
    const response = await fetch('http://localhost:3002/api/db-status')
    const data = await response.json()
    
    console.log('🔍 Database Status:')
    console.log(`   Type: ${data.database}`)
    console.log(`   Connected: ${data.connected}`)
    console.log(`   Environment: ${data.environment}`)
    
    if (data.database === 'PostgreSQL') {
      console.log('✅ Successfully connected to PostgreSQL!')
      return true
    } else {
      console.log('⚠️ Still using SQLite. Check your DATABASE_URL environment variable.')
      return false
    }
  } catch (error) {
    console.error('❌ Failed to check database status:', error.message)
    console.log('💡 Make sure the server is running on port 3002')
    return false
  }
}

// Function to migrate data
async function migrateData() {
  try {
    console.log('🔄 Starting data migration...')
    
    const response = await fetch('http://localhost:3002/api/migrate-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
    
    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Data migration completed successfully!')
      console.log(data.message)
    } else {
      console.error('❌ Migration failed:', data.error)
      if (data.message) console.error('   Details:', data.message)
    }
  } catch (error) {
    console.error('❌ Failed to migrate data:', error.message)
    console.log('💡 Make sure the server is running and connected to PostgreSQL')
  }
}

// Function to show help
function showHelp() {
  console.log(`
🗄️ PostgreSQL Setup and Migration Script

Usage:
  node scripts/setup-postgres.js [command]

Commands:
  --help, -h     Show this help message
  --test, -t     Test PostgreSQL connection
  --migrate, -m  Migrate data from SQLite to PostgreSQL
  --setup [URL]  Set up DATABASE_URL in .env file

Examples:
  # Test current database connection
  node scripts/setup-postgres.js --test
  
  # Set up PostgreSQL URL
  node scripts/setup-postgres.js --setup "postgresql://username:password@host:port/database"
  
  # Migrate existing data
  node scripts/setup-postgres.js --migrate

Setup Instructions:
1. Get your PostgreSQL URL from Railway dashboard
2. Run: node scripts/setup-postgres.js --setup "your-database-url"
3. Restart your server: npm run server
4. Test connection: node scripts/setup-postgres.js --test
5. Migrate data: node scripts/setup-postgres.js --migrate
`)
}

// Main function
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  switch (command) {
    case '--help':
    case '-h':
      showHelp()
      break
      
    case '--test':
    case '-t':
      await testConnection()
      break
      
    case '--migrate':
    case '-m':
      const isConnected = await testConnection()
      if (isConnected) {
        await migrateData()
      } else {
        console.log('❌ Cannot migrate: not connected to PostgreSQL')
      }
      break
      
    case '--setup':
      const databaseUrl = args[1]
      if (!databaseUrl) {
        console.error('❌ Please provide a DATABASE_URL')
        console.log('Usage: node scripts/setup-postgres.js --setup "postgresql://..."')
        process.exit(1)
      }
      await createEnvFile(databaseUrl)
      console.log('💡 Next steps:')
      console.log('   1. Restart your server: npm run server')
      console.log('   2. Test connection: node scripts/setup-postgres.js --test')
      console.log('   3. Migrate data: node scripts/setup-postgres.js --migrate')
      break
      
    default:
      console.log('❌ Unknown command. Use --help for usage information.')
      process.exit(1)
  }
}

// Run the script
main().catch(console.error) 