// Quick test for Railway deployment
const https = require('https');

// You'll need to replace this with your actual Railway domain
const RAILWAY_DOMAIN = 'your-app-name.up.railway.app';
const PRODUCTION_URL = `https://${RAILWAY_DOMAIN}`;

console.log('🚀 Testing Railway deployment...');
console.log(`📍 Production URL: ${PRODUCTION_URL}`);
console.log('\n🔍 What to do:');
console.log('1. Find your Railway domain in your Railway dashboard');
console.log('2. Replace "your-app-name.up.railway.app" with your actual domain');
console.log('3. Run this test with: node test-production.js');

// Test function
function testEndpoint(url, description) {
  return new Promise((resolve) => {
    console.log(`\n${description}...`);
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description} - SUCCESS (${res.statusCode})`);
          resolve(true);
        } else {
          console.log(`❌ ${description} - FAILED (${res.statusCode})`);
          resolve(false);
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ${description} - ERROR: ${err.message}`);
      resolve(false);
    });
  });
}

// Run tests
async function runTests() {
  if (RAILWAY_DOMAIN === 'your-app-name.up.railway.app') {
    console.log('\n⚠️  Please update RAILWAY_DOMAIN with your actual domain first!');
    return;
  }

  console.log('\n🧪 Running tests...');
  
  // Test health endpoint
  await testEndpoint(`${PRODUCTION_URL}/health`, '1. Health Check');
  
  // Test debug routes
  await testEndpoint(`${PRODUCTION_URL}/api/debug-routes`, '2. Debug Routes');
  
  // Test order success page
  await testEndpoint(`${PRODUCTION_URL}/order-success`, '3. Order Success Page');
  
  console.log('\n📝 If all tests pass, your deployment is working correctly!');
  console.log('If Order Success Page fails, we need to set FRONTEND_URL explicitly.');
}

// Run if domain is set
if (RAILWAY_DOMAIN !== 'your-app-name.up.railway.app') {
  runTests();
} 