# 🚀 Deploy Your Food Truck App to Railway NOW!

## Quick Start (5 minutes)

### 1. Push to GitHub
```bash
# If you haven't already:
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### 2. Create Railway Project
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your food truck app repository

### 3. Add Database
1. In your Railway project, click **"+ New Service"**
2. Select **"Database"** → **"PostgreSQL"**
3. Wait for it to provision (1-2 minutes)

### 4. Set Environment Variables
In Railway dashboard, go to your web service → **"Variables"** and add:

```env
NODE_ENV=production
JWT_SECRET=your_super_secret_64_character_string_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

**Note**: Replace with your actual Stripe keys. Use test keys first, then switch to live keys later.

### 5. Deploy!
Railway will automatically build and deploy your app. Watch the build logs in the dashboard.

### 6. Get Your URL
Once deployed, Railway will give you a URL like:
`https://your-app-name.up.railway.app`

### 7. Add Frontend URL
Go back to **"Variables"** and add:
```env
FRONTEND_URL=https://your-actual-railway-url.up.railway.app
```

## Test Your Deployment

1. **Visit your app**: Open the Railway URL
2. **Register account**: Create a test user account
3. **Browse menu**: Check if menu items load
4. **Place order**: Try the checkout process
5. **Admin access**: Login with admin credentials
6. **Order management**: Test the admin dashboard

## Need Help?

- **Build failing?** Check the build logs in Railway dashboard
- **Can't connect to database?** Make sure PostgreSQL service is running
- **CORS errors?** Verify your FRONTEND_URL is correct
- **Payment issues?** Double-check your Stripe keys

## Production Ready?

Once everything works with test keys:

1. **Update Stripe keys** to live keys in Railway variables
2. **Update webhook URLs** in your Stripe dashboard to:
   `https://your-app.up.railway.app/api/stripe/webhook`
3. **Add custom domain** (optional) in Railway settings

---

## 🎉 That's it! Your food truck app is now live!

**Your app features:**
- ✅ Online ordering system
- ✅ Real-time order tracking
- ✅ Admin dashboard
- ✅ Payment processing
- ✅ User authentication
- ✅ Location management
- ✅ Menu management

**Share your live app with customers and start taking orders! 🌮🚚** 