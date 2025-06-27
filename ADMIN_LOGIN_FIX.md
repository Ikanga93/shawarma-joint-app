# 🔐 Admin Login Production Fix Guide

## 🚨 Problem Identified

**Issue**: Admin login works in development but fails in production with 500/401 errors.

**Root Cause**: No default admin user was created in the production database during deployment.

## ✅ Solution Applied

### 1. **Added Default Admin User Creation**
- Modified `server/database.js` to automatically create a default admin user during database initialization
- Uses environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Prevents duplicate admin creation

### 2. **Enhanced Error Logging**
- Added detailed logging to the login endpoint
- Better error messages for debugging production issues
- Non-breaking error handling for admin profile updates

### 3. **Added Admin Health Check**
- New endpoint: `/health/admin` to verify admin users exist
- Helps diagnose production database issues
- Shows admin user count and environment variable status

## 🚀 Deployment Steps

### **Step 1: Set Environment Variables in Railway**

In your Railway dashboard, go to your app → **Variables** and add:

```env
ADMIN_USERNAME=admin@mosburrito.com
ADMIN_PASSWORD=YourSecurePassword123!
```

**⚠️ Important**: Use a secure password, not the default `admin123`!

### **Step 2: Deploy the Updated Code**

```bash
git add .
git commit -m "Fix admin login for production - add default admin user creation"
git push origin main
```

Railway will automatically redeploy your app.

### **Step 3: Verify the Fix**

1. **Check admin health**: Visit `https://your-app.railway.app/health/admin`
   - Should show `adminUsersCount: 1` or higher
   - Should show `hasAdminUsername: true` and `hasAdminPassword: true`

2. **Test admin login**: Go to your admin login page
   - Use the email/username from `ADMIN_USERNAME`
   - Use the password from `ADMIN_PASSWORD`

3. **Check server logs**: In Railway dashboard, view the deployment logs
   - Look for: `✅ Default admin user created successfully`
   - Or: `✅ Default admin user already exists`

## 🔍 Debugging Steps

### **If Admin Health Check Shows No Users:**

```bash
# Check if environment variables are set correctly
curl https://your-app.railway.app/health/admin
```

Expected response:
```json
{
  "status": "healthy",
  "adminUsersCount": 1,
  "hasAdminUsername": true,
  "hasAdminPassword": true
}
```

### **If Login Still Fails:**

1. **Check server logs** during login attempt:
   ```
   🔐 Login attempt: { email: "admin@mosburrito.com" }
   👤 User found: { id: "ADMIN-12345678", email: "admin@mosburrito.com", role: "admin" }
   ✅ Password validated for user: admin@mosburrito.com
   ✅ Login successful for: admin@mosburrito.com
   ```

2. **Verify credentials** match environment variables exactly

3. **Check database connection** - ensure Railway PostgreSQL is running

### **Manual Admin User Creation (If Needed):**

If the automatic creation fails, you can create an admin user manually:

```javascript
// Add this to your server startup code temporarily
const createAdminManually = async () => {
  const bcrypt = require('bcryptjs')
  const { v4: uuidv4 } = require('uuid')
  
  const salt = await bcrypt.genSalt(10)
  const passwordHash = await bcrypt.hash('YourPassword123!', salt)
  const userId = `ADMIN-${uuidv4().substring(0, 8).toUpperCase()}`
  
  await query(
    'INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'admin@mosburrito.com', passwordHash, 'admin', 'Admin', 'User']
  )
  
  await query('INSERT INTO admin_profiles (user_id) VALUES (?)', [userId])
  console.log('✅ Manual admin user created')
}
```

## 🔒 Security Best Practices

### **After First Login:**

1. **Change default password** immediately
2. **Create additional admin users** with unique credentials
3. **Remove environment variables** `ADMIN_USERNAME` and `ADMIN_PASSWORD` after setup
4. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)

### **Production Security:**

```env
# Use secure, unique credentials
ADMIN_USERNAME=your-secure-email@domain.com
ADMIN_PASSWORD=SuperSecurePassword123!@#

# Set strong JWT secret
JWT_SECRET=your-super-long-random-jwt-secret-key-here
```

## 📊 Monitoring

### **Regular Health Checks:**
- Monitor `/health/admin` endpoint
- Set up alerts if `adminUsersCount` drops to 0
- Monitor login success/failure rates

### **Log Monitoring:**
- Watch for login attempt patterns
- Monitor failed authentication attempts
- Set up alerts for repeated login failures

## 🎯 Expected Results

After applying this fix:

1. ✅ **Default admin user** automatically created on deployment
2. ✅ **Admin login works** in production
3. ✅ **Better error messages** for debugging
4. ✅ **Health check endpoint** for monitoring
5. ✅ **Secure password handling** with bcrypt
6. ✅ **Environment-based configuration**

## 🚨 Emergency Access

If you're completely locked out:

1. **Use Railway CLI** to access database directly
2. **Check environment variables** in Railway dashboard
3. **Redeploy** with debug logging enabled
4. **Contact support** with server logs if needed

---

## 📞 Support

If you still have issues after following this guide:

1. Check the server logs in Railway dashboard
2. Verify all environment variables are set
3. Test the `/health/admin` endpoint
4. Ensure your database is running and accessible

**Remember**: Always use secure passwords and change defaults immediately after first login! 🔐 