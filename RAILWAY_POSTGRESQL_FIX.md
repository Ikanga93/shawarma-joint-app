# Railway PostgreSQL Connection Fix

## 🚨 Current Issue
**Error:** `getaddrinfo ENOTFOUND postgres.railway.internal`
**Cause:** PostgreSQL service is not properly set up or linked in Railway

## ✅ Step-by-Step Fix

### 1. Check Your Railway Project Dashboard

Go to your Railway project and verify you have **TWO services**:
- 📱 **Your app** (Fernando's Food Truck)
- 🗄️ **PostgreSQL** database

**If you only see ONE service, continue to step 2.**

### 2. Add PostgreSQL Service

1. **Click the "+" or "New Service" button**
2. **Select "Database" → "PostgreSQL"**
3. **Wait for deployment** (green checkmark appears)
4. **Verify the PostgreSQL service is running**

### 3. Environment Variables Setup

In your Railway app service (NOT the database):

1. **Go to "Variables" tab**
2. **Add these variables manually:**
   ```
   NODE_ENV=production
   JWT_SECRET=af677aa29c52ad63ae9ca5bde248841b4fd600deb5aebacc4fa845a9d6e63878f791789c19c388c370457695b19b11c7d37844173c85981ecfaa8c15845fd305
   ```

3. **Railway should automatically add:**
   - `DATABASE_URL` (from PostgreSQL service)
   - `DATABASE_PRIVATE_URL` (from PostgreSQL service)
   - `DATABASE_PUBLIC_URL` (from PostgreSQL service)

### 4. Verify Database Connection

After adding PostgreSQL service, you should see these variables automatically:
- ✅ `DATABASE_URL` - starts with `postgresql://`
- ✅ `DATABASE_PRIVATE_URL` - internal network URL
- ✅ `DATABASE_PUBLIC_URL` - external network URL

### 5. Redeploy Your App

1. **Trigger a new deployment** by:
   - Pushing to your connected Git repository, OR
   - Click "Deploy" button in Railway

### 6. Check Deployment Logs

You should now see:
```
✅ PostgreSQL connected successfully
✅ Database tables initialized successfully
🚀 Server running on port 3001
```

## 🔧 If Still Not Working

### Option A: Use Public Database URL
If internal networking fails, manually set:
```
DATABASE_URL={copy the DATABASE_PUBLIC_URL value}
```

### Option B: Check Service Linking
1. Go to PostgreSQL service
2. Click "Connect" 
3. Ensure your app service is listed as connected

### Option C: Delete and Recreate PostgreSQL
1. Delete the PostgreSQL service
2. Recreate it following steps above
3. Redeploy your app

## 🎯 Expected Success Log

After fix, your Railway logs should show:
```
🔍 Environment check:
NODE_ENV: production
DATABASE_URL exists: true
hasPostgresUrl: true
🚀 Production mode: Using PostgreSQL database
✅ PostgreSQL connected successfully
✅ Database tables initialized successfully
🚀 Server running on port 3001
```

## 💡 Pro Tips

- **Railway automatically handles database URLs** - don't hardcode them
- **Internal URLs** (`.railway.internal`) only work within Railway's network
- **Public URLs** work from anywhere but are less secure
- **Always use Railway's PostgreSQL service** for production apps

---
**Next Step:** Follow the checklist above to fix your PostgreSQL connection! 🚀 