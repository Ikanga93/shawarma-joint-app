# ✅ Setup Checklist - Supabase + Vercel Deployment

Follow this checklist to deploy your Shawarma Joint app in under 15 minutes!

## 🗄️ Step 1: Supabase Setup (5 minutes)

### Create Supabase Project
- [ ] Go to [supabase.com](https://supabase.com) and sign up/login
- [ ] Click "New Project"
- [ ] Fill in project details:
  - Name: `shawarma-joint-db`
  - Password: Generate strong password (save it!)
  - Region: Choose closest to your users
- [ ] Click "Create new project" and wait 2-3 minutes

### Set up Database
- [ ] Go to **SQL Editor** in Supabase dashboard
- [ ] Copy all contents from `supabase-schema.sql` file
- [ ] Paste into SQL Editor and click **Run**
- [ ] Verify: You should see "Success. No rows returned"

### Get Credentials
- [ ] Go to **Settings** → **API**
- [ ] Copy and save these values:
  - **Project URL**: `https://xxxxx.supabase.co`
  - **Project API Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 🌐 Step 2: Vercel Deployment (5 minutes)

### Deploy to Vercel
- [ ] Go to [vercel.com](https://vercel.com) and sign up/login
- [ ] Click **"New Project"**
- [ ] Click **"Import Git Repository"**
- [ ] Select your `shawarma-joint-app` repository
- [ ] Click **"Import"**

### Add Environment Variables
- [ ] In the import screen, expand **"Environment Variables"**
- [ ] Add these two variables:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase API Key |

- [ ] Click **"Deploy"**
- [ ] Wait 2-3 minutes for deployment to complete

## 🎉 Step 3: Test Your App (2 minutes)

### Verify Everything Works
- [ ] Visit your Vercel URL (e.g., `https://shawarma-joint-app.vercel.app`)
- [ ] Check homepage loads with video background
- [ ] Test user registration (create a test account)
- [ ] Test login/logout functionality
- [ ] Browse the menu
- [ ] Add items to cart
- [ ] Test checkout flow (without payment for now)

## 🔧 Step 4: Optional Enhancements

### Custom Domain (Optional)
- [ ] In Vercel, go to **Settings** → **Domains**
- [ ] Add your custom domain
- [ ] Follow DNS configuration instructions
- [ ] Update Supabase **Authentication** → **URL Configuration**

### Stripe Payments (Optional)
- [ ] Get Stripe keys from [stripe.com](https://stripe.com)
- [ ] Add `VITE_STRIPE_PUBLISHABLE_KEY` to Vercel environment variables
- [ ] Redeploy the app

### Email Templates (Optional)
- [ ] In Supabase, go to **Authentication** → **Email Templates**
- [ ] Customize confirmation and reset password emails

## 🚨 Troubleshooting

### Common Issues:
- **Build fails**: Check environment variables are set correctly
- **Database errors**: Ensure SQL schema ran successfully
- **Auth not working**: Check Supabase URL and API key
- **CORS errors**: Add your Vercel domain to Supabase settings

### Quick Fixes:
- **Redeploy**: In Vercel, go to **Deployments** and click "Redeploy"
- **Check logs**: View build and function logs in Vercel dashboard
- **Test locally**: Run `npm run dev` to test changes locally first

## 📞 Need Help?

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Full Guide**: See `DEPLOYMENT.md` for detailed instructions

---

**🎯 Goal**: Your Shawarma Joint app should be live and fully functional!

**⏱️ Total Time**: ~15 minutes

**🚀 Result**: A professional restaurant app ready for customers! 