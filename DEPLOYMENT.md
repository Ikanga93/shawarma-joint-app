# Deployment Guide - Railway PostgreSQL Setup

## 🚀 Quick Fix for Current Issue

The error you're seeing is because the DATABASE_URL environment variable isn't configured in Railway. Here's how to fix it:

### Step 1: Add PostgreSQL Service in Railway

1. Go to your Railway project dashboard
2. Click "Add Service" → "Database" → "PostgreSQL"
3. Railway will automatically create a PostgreSQL database and set environment variables

### Step 2: Configure Environment Variables

In your Railway project settings, ensure these environment variables are set:

```bash
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your-secure-production-jwt-secret-key
PORT=3001
```

**Note**: The `${{Postgres.DATABASE_URL}}` will be automatically populated by Railway when you add the PostgreSQL service.

### Step 3: Alternative - Manual Database Connection

If you prefer to use the credentials you provided, set these environment variables in Railway:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://postgres:lpjavxQiViJYuqzDhpcFTHfHWHhmhqiR@postgres.railway.internal:5432/railway
JWT_SECRET=your-secure-production-jwt-secret-key
PORT=3001
```

## 🔧 Current Behavior

- **Development**: Uses SQLite (local file)
- **Production with DATABASE_URL**: Uses PostgreSQL
- **Production without DATABASE_URL**: Falls back to SQLite (safe mode)

## 📋 Deployment Checklist

- [ ] Add PostgreSQL service in Railway
- [ ] Set environment variables
- [ ] Deploy the updated code
- [ ] Verify database connection in logs
- [ ] Test the application

## 🐛 Troubleshooting

If you still see connection errors:

1. **Check Railway logs** for database connection details
2. **Verify environment variables** are set correctly
3. **Ensure PostgreSQL service** is running in Railway
4. **Check database URL format** matches PostgreSQL connection string

## 🎯 Expected Result

After proper configuration, you should see:
```
🚀 Production mode: Using PostgreSQL database
✅ Database tables initialized successfully
🚀 Server running on port 3001
```

## 📞 Support

If you need help with Railway setup, check their documentation or contact their support team.
