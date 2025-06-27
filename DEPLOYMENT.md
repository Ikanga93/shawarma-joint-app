# 🚀 Shawarma Joint - Deployment Guide

## Architecture Overview

**Frontend**: React app deployed on Vercel
**Backend**: Supabase (Database + Authentication + APIs)
**Payment**: Stripe (optional, can be added later)

## 📋 Prerequisites

1. **Supabase Account**: [supabase.com](https://supabase.com)
2. **Vercel Account**: [vercel.com](https://vercel.com)
3. **GitHub Repository**: Code hosted on GitHub

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `shawarma-joint`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project to be ready (2-3 minutes)

### Step 2: Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- All necessary tables (users, menu_categories, menu_items, orders, etc.)
- Row Level Security (RLS) policies
- Database triggers for user management
- Sample Mediterranean menu data

### Step 3: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values (you'll need them for Vercel):
   - **Project URL** (starts with `https://`)
   - **Anon/Public Key** (starts with `eyJ...`)

## 🌐 Frontend Deployment (Vercel)

### Step 1: Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository: `shawarma-joint-app`
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)

### Step 2: Set Environment Variables

In Vercel project settings, add these environment variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

**Important**: 
- Use the exact variable names above (including `VITE_` prefix)
- Get values from Supabase Settings → API
- The anon key is safe to expose to the browser

### Step 3: Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Your app will be live at: `https://your-app-name.vercel.app`

## ✅ Verification

### Test Core Features

1. **Menu Loading**: Visit `/menu` - should show Mediterranean dishes
2. **User Registration**: Create a new account
3. **User Login**: Sign in with your account
4. **Add to Cart**: Add items to cart (persists in localStorage)
5. **Checkout**: Place an order (creates record in Supabase)
6. **Order History**: View orders in `/orders`

### Check Database

1. In Supabase dashboard, go to **Table Editor**
2. Check these tables have data:
   - `menu_categories` - Should have Mediterranean categories
   - `menu_items` - Should have sample menu items
   - `users` - Should show registered users
   - `orders` - Should show placed orders

## 🔧 Troubleshooting

### Build Errors

**Error**: `Module not found: Can't resolve './services/ApiService'`
- **Solution**: Make sure you've pulled the latest code with Supabase integration

**Error**: `supabase is not defined`
- **Solution**: Check that environment variables are set correctly in Vercel

### Runtime Errors

**Error**: Menu items not loading
- **Solution**: 
  1. Check Supabase environment variables
  2. Verify database schema was run successfully
  3. Check browser console for specific errors

**Error**: Authentication not working
- **Solution**:
  1. Verify Supabase project URL and anon key
  2. Check that RLS policies are enabled
  3. Test in incognito mode to avoid cache issues

### Database Issues

**Error**: `relation "menu_items" does not exist`
- **Solution**: Run the complete `supabase-schema.sql` file

**Error**: Permission denied for table
- **Solution**: Check that RLS policies are properly configured

## 🎯 Next Steps

### Optional Enhancements

1. **Custom Domain**: Add your own domain in Vercel settings
2. **Analytics**: Add Vercel Analytics or Google Analytics
3. **Payment Processing**: Integrate Stripe using Supabase Edge Functions
4. **Email Notifications**: Use Supabase Auth emails or external service
5. **Real-time Updates**: Use Supabase real-time subscriptions
6. **Image Storage**: Use Supabase Storage for menu item images

### Performance Optimization

1. **Image Optimization**: Use Vercel Image Optimization
2. **Caching**: Implement proper caching headers
3. **Bundle Analysis**: Use `npm run build -- --analyze`

## 📊 Monitoring

### Supabase Dashboard
- Monitor database usage
- Check authentication metrics
- View real-time logs

### Vercel Dashboard  
- Monitor deployment status
- Check function logs
- View analytics data

## 🔒 Security

### Supabase Security
- RLS policies protect user data
- Anon key is safe for browser exposure
- Database access is automatically secured

### Vercel Security
- HTTPS enforced by default
- Environment variables are encrypted
- No server-side secrets exposed

---

## 📞 Support

If you need help with deployment:
1. Check the troubleshooting section above
2. Review Supabase and Vercel documentation
3. Check browser console for specific error messages

**Deployment Time**: ~15 minutes
**Total Cost**: Free (within usage limits)
