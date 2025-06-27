# ⚡ Quick Setup Checklist - Shawarma Joint

**Estimated Time**: 15 minutes  
**Architecture**: Frontend (Vercel) + Supabase (Database + Auth)

## 🎯 Prerequisites (2 minutes)

- [ ] GitHub account with repository access
- [ ] Supabase account (free): [supabase.com](https://supabase.com)
- [ ] Vercel account (free): [vercel.com](https://vercel.com)

## 🗄️ Database Setup - Supabase (5 minutes)

### Create Project
- [ ] Go to [supabase.com](https://supabase.com) → New Project
- [ ] Name: `shawarma-joint`
- [ ] Generate strong database password
- [ ] Choose region closest to users
- [ ] Wait for project creation (2-3 mins)

### Run Schema
- [ ] Go to **SQL Editor** → New Query
- [ ] Copy entire `supabase-schema.sql` file contents
- [ ] Paste and click **Run**
- [ ] Verify: "Success. No rows returned"

### Get Credentials
- [ ] Go to **Settings** → **API**
- [ ] Copy **Project URL** (starts with `https://`)
- [ ] Copy **Anon/Public Key** (starts with `eyJ...`)

## 🚀 Frontend Deployment - Vercel (5 minutes)

### Import Project
- [ ] Go to [vercel.com](https://vercel.com) → New Project
- [ ] Import GitHub repository: `shawarma-joint-app`
- [ ] Framework: Vite (auto-detected)
- [ ] Build Command: `npm run build` (auto-detected)

### Environment Variables
- [ ] In Vercel project settings, add:
  ```
  VITE_SUPABASE_URL = https://your-project-id.supabase.co
  VITE_SUPABASE_ANON_KEY = eyJ...your-anon-key
  ```
- [ ] Use exact variable names (including `VITE_` prefix)

### Deploy
- [ ] Click **Deploy**
- [ ] Wait for build completion (2-3 mins)
- [ ] Note your live URL: `https://your-app.vercel.app`

## ✅ Testing (3 minutes)

### Core Features
- [ ] Visit your live URL
- [ ] **Homepage**: Video background loads
- [ ] **Menu** (`/menu`): Mediterranean dishes display
- [ ] **Register**: Create new account works
- [ ] **Login**: Sign in with account works
- [ ] **Cart**: Add items to cart
- [ ] **Checkout**: Place test order
- [ ] **Orders** (`/orders`): View order history

### Database Verification
- [ ] In Supabase **Table Editor**, check:
  - [ ] `menu_categories` has Mediterranean categories
  - [ ] `menu_items` has sample dishes
  - [ ] `users` shows registered test user
  - [ ] `orders` shows placed test order

## 🎉 Success Criteria

✅ **All green checkmarks above**  
✅ **App loads without console errors**  
✅ **Can register, login, order, and view history**  
✅ **Database tables populated correctly**

---

## 🚨 Quick Troubleshooting

**Menu not loading?**
- Check Supabase environment variables in Vercel
- Verify database schema ran successfully

**Authentication errors?**
- Confirm Supabase URL and anon key are correct
- Test in incognito mode

**Build failures?**
- Ensure latest code is pushed to GitHub
- Check all environment variables are set

---

## 🎯 Next Steps (Optional)

- [ ] **Custom Domain**: Add in Vercel settings
- [ ] **Analytics**: Enable Vercel Analytics
- [ ] **Stripe Payments**: Add payment processing
- [ ] **Admin Panel**: Build order management system

**🎊 Congratulations!** Your Shawarma Joint is now live and ready to serve customers! 