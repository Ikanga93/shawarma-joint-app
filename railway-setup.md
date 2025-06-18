# Railway Environment Variables Setup

## Copy these exact environment variables to your Railway project:

### Go to your Railway project → Settings → Environment Variables

Add these variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:lpjavxQiViJYuqzDhpcFTHfHWHhmhqiR@postgres.railway.internal:5432/railway
JWT_SECRET=fernando-food-truck-super-secret-key-2024
PORT=3001
```

## Alternative Public URL (if internal doesn't work):

```
DATABASE_URL=postgresql://postgres:lpjavxQiViJYuqzDhpcFTHfHWHhmhqiR@switchyard.proxy.rlwy.net:28784/railway
```

## Steps:
1. Open your Railway project dashboard
2. Click on your web service
3. Go to "Variables" or "Environment" tab
4. Add each variable above
5. Redeploy your service

## Expected Result:
After adding these variables and redeploying, you should see:
```
🚀 Production mode: Using PostgreSQL database
✅ Database tables initialized successfully
```

Instead of the connection error.
