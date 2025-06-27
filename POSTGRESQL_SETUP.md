# PostgreSQL Setup with Railway

This guide will help you migrate from SQLite to PostgreSQL using your Railway database.

## Prerequisites

1. A Railway account with PostgreSQL addon enabled
2. Your application deployed on Railway
3. Access to your Railway dashboard

## Step 1: Get Your Database URL

1. Go to your Railway dashboard
2. Select your project
3. Go to the PostgreSQL service
4. In the "Variables" tab, copy the `DATABASE_URL` value
   - It should look like: `postgresql://username:password@host:port/database`

## Step 2: Configure Local Environment

Run the setup command with your Railway PostgreSQL URL:

```bash
npm run postgres:setup "postgresql://your-username:your-password@your-host:5432/your-database"
```

This will:
- Add the DATABASE_URL to your `.env` file
- Configure your application to use PostgreSQL

## Step 3: Restart Your Server

Stop your current server and restart it:

```bash
# Stop current server (Ctrl+C if running)
# Then restart
npm run server
```

## Step 4: Test PostgreSQL Connection

Verify that your application is now using PostgreSQL:

```bash
npm run postgres:test
```

You should see:
- Type: PostgreSQL
- Connected: true
- Environment: development

## Step 5: Migrate Your Data

Transfer all your existing menu items, users, and orders from SQLite to PostgreSQL:

```bash
npm run postgres:migrate
```

This will:
- Copy all users from SQLite to PostgreSQL
- Copy all menu items from SQLite to PostgreSQL  
- Copy all orders from SQLite to PostgreSQL
- Copy all locations from SQLite to PostgreSQL
- Skip duplicates automatically

## Step 6: Verify Migration

1. Check your Railway PostgreSQL dashboard to see the migrated data
2. Test your application to ensure everything works correctly
3. Create a test order to verify the PostgreSQL integration

## Production Deployment

When deploying to Railway:

1. Your Railway environment already has the DATABASE_URL set
2. The application will automatically use PostgreSQL in production
3. No additional configuration needed

## Troubleshooting

### "Still using SQLite" after setup

1. Check that DATABASE_URL is in your `.env` file
2. Restart your server completely
3. Run `npm run postgres:test` to verify

### Migration fails

1. Ensure PostgreSQL connection is working: `npm run postgres:test`
2. Check server logs for detailed error messages
3. Verify Railway PostgreSQL service is running

### Permission errors

1. Ensure your Railway PostgreSQL user has write permissions
2. Check that the database exists and is accessible

## Commands Reference

```bash
# Show help
npm run postgres:help

# Setup DATABASE_URL
npm run postgres:setup "postgresql://..."

# Test connection
npm run postgres:test

# Migrate data
npm run postgres:migrate
```

## Benefits of PostgreSQL

✅ **Persistent Data**: Your data won't be lost when deploying  
✅ **Better Performance**: Superior performance for production workloads  
✅ **Scalability**: Can handle more concurrent users  
✅ **ACID Compliance**: Better data integrity  
✅ **Advanced Features**: Full-text search, JSON support, etc.  

## Data Persistence

With PostgreSQL on Railway:
- Your menu items will persist across deployments
- User accounts and orders are permanently stored
- No data loss when pushing new code changes
- Automatic backups (check Railway documentation)

---

🎉 **That's it!** Your shawarma joint app is now using persistent PostgreSQL storage on Railway. 