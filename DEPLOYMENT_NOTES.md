# Deployment Notes

## Image Storage Solution ✅ FIXED

**Problem**: Menu item images were disappearing after each Railway deployment due to ephemeral filesystem.

**Solution Implemented**: **Database Storage with Base64 Encoding**
- Images are now converted to base64 data URLs and stored directly in the PostgreSQL database
- No filesystem dependency - images persist across all deployments
- Automatic handling in the upload endpoint (`/api/upload-menu-image`)

**Technical Details**:
- Multer configured with `memoryStorage()` instead of disk storage
- Images converted to base64 format: `data:image/jpeg;base64,{base64string}`
- Stored in `menu_items.image_url` column (TEXT type supports large base64 strings)
- No static file serving needed for uploads

**Benefits**:
- ✅ Images persist across deployments
- ✅ No external storage service needed
- ✅ Works with Railway's ephemeral filesystem
- ✅ Automatic backup with database backups

**Alternative Solutions** (not implemented):
1. **Railway Volume Storage**: Configured but may have limitations
2. **External Storage**: AWS S3, Cloudinary, etc. (adds complexity and cost)
3. **Railway Static Files**: Limited and not persistent

## Environment Variables

Required for production:
```
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
JWT_SECRET=your-secure-secret
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
```

## Database

- **Development**: SQLite (`orders.db`)
- **Production**: PostgreSQL (Railway managed)
- **Migrations**: Automatic on startup
- **Image Storage**: Base64 in `menu_items.image_url` column

## Deployment Process

1. Push to GitHub main branch
2. Railway auto-deploys
3. Database migrations run automatically
4. Images stored in database persist across deployments

## Notes

- Image upload size limit: 5MB
- Base64 encoding increases storage size by ~33%
- PostgreSQL TEXT column can handle large base64 strings
- No cleanup needed for old filesystem-based images 