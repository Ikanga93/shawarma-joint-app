// Test script to verify production deployment
const https = require('https');

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://your-production-domain.railway.app';

console.log('🧪 Testing production deployment...');
console.log(`📍 Production URL: ${PRODUCTION_URL}`);

// Test 1: Health check
console.log('\n1. Testing health check...');
https.get(`${PRODUCTION_URL}/health`, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed:', res.statusCode);
    }
  });
}).on('error', (err) => {
  console.log('❌ Health check error:', err.message);
});

// Test 2: Debug routes
setTimeout(() => {
  console.log('\n2. Testing debug routes...');
  https.get(`${PRODUCTION_URL}/api/debug-routes`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200) {
        const debugInfo = JSON.parse(data);
        console.log('✅ Debug routes accessible');
        console.log('📊 Environment:', debugInfo.environment);
        console.log('📁 Dist exists:', debugInfo.files?.distExists);
        console.log('📄 Index exists:', debugInfo.files?.indexExists);
        console.log('🔗 Stripe success URL pattern:', debugInfo.stripe?.successUrlPattern);
      } else {
        console.log('❌ Debug routes failed:', res.statusCode);
      }
    });
  }).on('error', (err) => {
    console.log('❌ Debug routes error:', err.message);
  });
}, 1000);

// Test 3: Order success page
setTimeout(() => {
  console.log('\n3. Testing order success page...');
  https.get(`${PRODUCTION_URL}/order-success`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      if (res.statusCode === 200 && data.includes('<!doctype html>')) {
        console.log('✅ Order success page serves HTML correctly');
      } else {
        console.log('❌ Order success page failed:', res.statusCode);
        console.log('Response preview:', data.substring(0, 200));
      }
    });
  }).on('error', (err) => {
    console.log('❌ Order success page error:', err.message);
  });
}, 2000);

console.log('\n📝 Instructions:');
console.log('1. Wait for deployment to complete');
console.log('2. Update PRODUCTION_URL in this script with your actual domain');
console.log('3. Run: node test-deployment.js');
console.log('4. All tests should pass ✅'); 