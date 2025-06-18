// Debug script to check Railway environment variables
console.log('🔍 Railway Environment Debug Info:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('PORT:', process.env.PORT)

console.log('\n📊 Database Environment Variables:')
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET')
console.log('DATABASE_PRIVATE_URL:', process.env.DATABASE_PRIVATE_URL ? 'SET' : 'NOT SET')
console.log('DATABASE_PUBLIC_URL:', process.env.DATABASE_PUBLIC_URL ? 'SET' : 'NOT SET')
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET')

console.log('\n🔧 PostgreSQL specific variables:')
console.log('PGHOST:', process.env.PGHOST || 'NOT SET')
console.log('PGPORT:', process.env.PGPORT || 'NOT SET')
console.log('PGDATABASE:', process.env.PGDATABASE || 'NOT SET')
console.log('PGUSER:', process.env.PGUSER || 'NOT SET')
console.log('PGPASSWORD:', process.env.PGPASSWORD ? 'SET' : 'NOT SET')

console.log('\n📋 All environment variables containing DATABASE or POSTGRES:')
Object.keys(process.env)
  .filter(key => 
    key.toUpperCase().includes('DATABASE') || 
    key.toUpperCase().includes('POSTGRES') || 
    key.toUpperCase().includes('PG')
  )
  .forEach(key => {
    const value = key.includes('PASSWORD') || key.includes('SECRET') ? '[HIDDEN]' : process.env[key]
    console.log(`${key}: ${value}`)
  })

console.log('\n🚀 Railway specific variables:')
Object.keys(process.env)
  .filter(key => key.toUpperCase().includes('RAILWAY'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`)
  })

// Test database URL parsing
const possibleUrls = [
  process.env.DATABASE_URL,
  process.env.DATABASE_PRIVATE_URL,
  process.env.DATABASE_PUBLIC_URL,
  process.env.POSTGRES_URL
].filter(Boolean)

if (possibleUrls.length > 0) {
  console.log('\n🔗 Found database URLs:')
  possibleUrls.forEach((url, index) => {
    try {
      const parsed = new URL(url)
      console.log(`URL ${index + 1}:`)
      console.log(`  Host: ${parsed.hostname}`)
      console.log(`  Port: ${parsed.port}`)
      console.log(`  Database: ${parsed.pathname.slice(1)}`)
      console.log(`  User: ${parsed.username}`)
    } catch (err) {
      console.log(`URL ${index + 1}: Invalid format - ${err.message}`)
    }
  })
} else {
  console.log('\n❌ No database URLs found!')
}
