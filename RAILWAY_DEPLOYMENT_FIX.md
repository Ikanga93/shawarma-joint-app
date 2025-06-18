# Railway Deployment Fix Guide

## 🚨 Current Issues Fixed

### 1. Database Connection Error
**Error**: `TypeError: db.query is not a function`
**Status**: ✅ **FIXED** - Updated database.js to properly handle SQLite fallback

### 2. Missing Environment Variables
**Error**: `No PostgreSQL database URL found in production!`
**Status**: ⚠️ **REQUIRES SETUP** - See instructions below

## 🔧 How to Fix Railway Deployment

### Step 1: Add PostgreSQL Service to Railway

1. **Go to your Railway project dashboard**
2. **Click "Add Service" → "Database" → "PostgreSQL"**
3. **Wait for the PostgreSQL service to deploy (this creates the database)**

### Step 2: Configure Environment Variables

Railway automatically provides these environment variables when you add PostgreSQL:
- `DATABASE_URL`
- `DATABASE_PRIVATE_URL` 
- `DATABASE_PUBLIC_URL`
- `POSTGRES_URL`

**No manual configuration needed!** Railway handles this automatically.

### Step 3: Verify Environment Variables

1. **Go to your Railway app service (not the database)**
2. **Click "Variables" tab**
3. **Verify these variables exist automatically:**
   - `DATABASE_URL` or `DATABASE_PRIVATE_URL`
   - `NODE_ENV=production`

### Step 4: Add Additional Required Variables

Add these variables manually in Railway:

```bash
# JWT Secret (generate a secure random string)
JWT_SECRET=your-secure-jwt-secret-here

# Stripe Configuration (optional - for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Frontend URL (your Railway app URL)
FRONTEND_URL=https://your-app-name.up.railway.app
```

### Step 5: Redeploy

1. **Trigger a new deployment** by pushing to your connected Git repository
2. **Or manually trigger redeploy** in Railway dashboard

## 🎯 Quick Fix Commands

If you need to test locally first:

```bash
# 1. Navigate to your app directory
cd food-truck-app

# 2. Test the database connection fix
npm run debug:env

# 3. Start the app locally
npm run dev
```

## 🔍 How to Generate JWT Secret

Run this command to generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📋 Verification Checklist

After deployment, verify these are working:

- [ ] ✅ Database connection succeeds
- [ ] ✅ No "db.query is not a function" errors
- [ ] ✅ Tables are created successfully
- [ ] ✅ API endpoints respond correctly
- [ ] ✅ Dashboard accessible at `/api/dashboard`

## 🚀 Expected Success Output

You should see:
```
✅ PostgreSQL connected successfully
✅ Database tables initialized successfully
🚀 Server running on port 8080
📊 Dashboard: http://localhost:8080/api/dashboard
```

## 🛠️ If You Still Get Errors

1. **Check Railway logs** for specific error messages
2. **Ensure PostgreSQL service is fully deployed** (green status)
3. **Verify environment variables** are set correctly
4. **Try redeploying** after adding PostgreSQL service

## 💡 Pro Tips

- **Railway automatically handles SSL** for PostgreSQL connections
- **Database URL format**: `postgresql://user:password@host:port/database`
- **Environment variables are injected automatically** when services are linked
- **Always use Railway's PostgreSQL service** for production (not SQLite)

---

**Next Steps**: After following this guide, your Fernando's Food Truck app should deploy successfully on Railway with a proper PostgreSQL database connection! 