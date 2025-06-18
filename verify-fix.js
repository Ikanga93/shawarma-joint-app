import dotenv from 'dotenv'
import Stripe from 'stripe'

// Load environment variables
dotenv.config()

console.log('🔍 VERIFYING PRODUCTION FIX')
console.log('===========================')

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublishableKey = process.env.STRIPE_PUBLISHABLE_KEY

// Check if keys are properly configured
console.log('\n✅ STRIPE CONFIGURATION CHECK:')
console.log('STRIPE_SECRET_KEY exists:', !!stripeSecretKey)
console.log('STRIPE_SECRET_KEY valid format:', stripeSecretKey ? 
  (stripeSecretKey.startsWith('sk_') && stripeSecretKey !== 'your-stripe-secret-key') : false)

console.log('STRIPE_PUBLISHABLE_KEY exists:', !!stripePublishableKey)
console.log('STRIPE_PUBLISHABLE_KEY valid format:', stripePublishableKey ? 
  (stripePublishableKey.startsWith('pk_') && stripePublishableKey !== 'your-stripe-publishable-key') : false)

// Test Stripe API connection
if (stripeSecretKey && stripeSecretKey.startsWith('sk_') && stripeSecretKey !== 'your-stripe-secret-key') {
  console.log('\n🧪 TESTING STRIPE API CONNECTION:')
  try {
    const stripe = new Stripe(stripeSecretKey)
    const customers = await stripe.customers.list({ limit: 1 })
    console.log('✅ Stripe API connection successful!')
    console.log('✅ Your production payment issues should now be resolved!')
  } catch (error) {
    console.log('❌ Stripe API connection failed:', error.message)
    console.log('👉 Double-check your Stripe secret key')
  }
} else {
  console.log('\n❌ STRIPE_SECRET_KEY still needs to be configured with a valid key')
}

console.log('\n🚀 NEXT STEPS:')
console.log('===============')
if (!stripeSecretKey || stripeSecretKey === 'your-stripe-secret-key') {
  console.log('1. Update Railway environment variables with real Stripe keys')
  console.log('2. Redeploy your application')
  console.log('3. Test order creation in production')
} else {
  console.log('1. Deploy your application to Railway')
  console.log('2. Test order creation in production')
  console.log('3. Monitor Railway logs for any remaining errors')
} 