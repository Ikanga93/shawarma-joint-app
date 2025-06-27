# 🚀 Deployment Guide: Supabase + Vercel

This guide will walk you through deploying your Shawarma Joint restaurant app using Supabase (database + auth) and Vercel (hosting).

## 📋 Prerequisites

- GitHub account
- Supabase account (free tier available)
- Vercel account (free tier available)

## 🗄️ Step 1: Set up Supabase Database

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `shawarma-joint-db`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

### 1.2 Set up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase-schema.sql` from your project
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema
5. You should see "Success. No rows returned" - this means it worked!

### 1.3 Get Your Supabase Credentials

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project API Key** (anon/public key)

## 🌐 Step 2: Deploy to Vercel

### 2.1 Push to GitHub (if not already done)

```bash
# Make sure all changes are committed
git add .
git commit -m "Add Supabase configuration and deployment files"
git push origin main
```

### 2.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click **"New Project"**
3. Import your GitHub repository:
   - Click **"Import Git Repository"**
   - Select your `shawarma-joint-app` repository
   - Click **"Import"**

### 2.3 Configure Environment Variables

1. In the Vercel import screen, expand **"Environment Variables"**
2. Add these variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase API Key |

3. Click **"Deploy"**
4. Wait for deployment to complete (2-3 minutes)

## 🎉 Step 3: Test Your Deployment

1. Once deployed, Vercel will give you a URL like: `https://shawarma-joint-app.vercel.app`
2. Visit your site and test:
   - ✅ Homepage loads with video background
   - ✅ Menu displays correctly
   - ✅ User registration works
   - ✅ Login/logout functionality
   - ✅ Order placement (if you have Stripe configured)

## 🔧 Step 4: Configure Custom Domain (Optional)

### 4.1 Add Custom Domain in Vercel

1. In your Vercel project dashboard, go to **Settings** → **Domains**
2. Add your custom domain (e.g., `shawarmajointerestaurant.com`)
3. Follow Vercel's DNS configuration instructions

### 4.2 Update Supabase Settings

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add your custom domain to **Site URL**
3. Add redirect URLs if needed

## 🛠️ Step 5: Optional Enhancements

### 5.1 Set up Stripe for Payments

1. Get your Stripe keys from [stripe.com](https://stripe.com)
2. Add to Vercel environment variables:
   - `VITE_STRIPE_PUBLISHABLE_KEY`

### 5.2 Configure Email Templates

1. In Supabase, go to **Authentication** → **Email Templates**
2. Customize the email templates for:
   - Email confirmation
   - Password reset
   - Magic link

### 5.3 Set up Analytics

1. Add Google Analytics or Vercel Analytics
2. Monitor your app performance

## 🔍 Troubleshooting

### Common Issues:

**1. "Failed to fetch" errors**
- Check your Supabase URL and API key
- Ensure Row Level Security policies are correctly set

**2. Authentication not working**
- Verify email confirmation is set up
- Check Supabase Auth settings

**3. Build failures**
- Check environment variables are set correctly
- Ensure all dependencies are installed

**4. CORS errors**
- Add your Vercel domain to Supabase allowed origins

## 📊 Monitoring & Maintenance

### Supabase Dashboard
- Monitor database usage
- Check authentication logs
- Review API usage

### Vercel Dashboard
- Monitor deployment status
- Check function logs
- Review performance metrics

## 🎯 Next Steps

1. **Content Management**: Consider adding a CMS for easy menu updates
2. **Order Management**: Build an admin panel for order tracking
3. **Mobile App**: Consider React Native for mobile apps
4. **SEO**: Add meta tags and structured data
5. **Performance**: Optimize images and implement caching

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Review Supabase and Vercel logs
3. Consult the documentation:
   - [Supabase Docs](https://supabase.com/docs)
   - [Vercel Docs](https://vercel.com/docs)

---

**🎉 Congratulations!** Your Shawarma Joint restaurant app is now live and ready to serve customers!
