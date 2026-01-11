# Vercel Deployment Guide

## Fixing the "Please install pg package manually" Error

This error occurs because Vercel needs special handling for native dependencies like the `pg` (PostgreSQL) package.

### Solution Applied:

1. **Updated `config/database.js`**: Added explicit import of `pg` module before Sequelize initialization
2. **Created `vercel.json`**: Configured Vercel build settings
3. **Created `.vercelignore`**: Excludes unnecessary files from deployment

### Deployment Steps:

1. **Ensure dependencies are correct**:
   ```bash
   cd backend
   npm install
   ```
   Verify that `pg` is in `node_modules`:
   ```bash
   ls node_modules/pg
   ```

2. **Set Environment Variables in Vercel**:
   - Go to your Vercel project settings
   - Add these environment variables:
     - `DB_NAME` - Your PostgreSQL database name
     - `DB_USER` - Your PostgreSQL username
     - `DB_PASSWORD` - Your PostgreSQL password
     - `DB_HOST` - Your PostgreSQL host (e.g., from a service like Neon, Supabase, or Railway)
     - `DB_PORT` - Usually `5432`
     - `JWT_SECRET` - A secret key for JWT tokens
     - `JWT_EXPIRE` - Token expiration (e.g., `7d`)
     - `NODE_ENV` - Set to `production`

3. **Deploy to Vercel**:
   ```bash
   # If using Vercel CLI
   vercel --prod
   
   # Or push to your connected Git repository
   git push origin main
   ```

### Important Notes:

- **PostgreSQL Database**: Vercel doesn't provide PostgreSQL. You need an external database:
  - [Neon](https://neon.tech) - Serverless PostgreSQL
  - [Supabase](https://supabase.com) - PostgreSQL with additional features
  - [Railway](https://railway.app) - PostgreSQL hosting
  - [AWS RDS](https://aws.amazon.com/rds/) - Managed PostgreSQL

- **Native Dependencies**: The `pg` package contains native code that needs to be compiled. Vercel handles this automatically, but ensure:
  - `pg` is in `dependencies` (not `devDependencies`) ✓ Already done
  - The package is properly installed before deployment

- **Connection Pooling**: For serverless environments, consider using a connection pooler like:
  - PgBouncer (provided by some hosting services)
  - Connection string with `?pgbouncer=true` parameter

### Troubleshooting:

If you still see the error:

1. **Check Vercel Build Logs**: Look for errors during the build process
2. **Verify package.json**: Ensure `pg` is listed in `dependencies`
3. **Check Node Version**: Vercel should use Node.js 18+ (configure in Vercel project settings)
4. **Try Manual Import**: The database.js file now explicitly imports `pg` before Sequelize

### Alternative: Use Vercel Postgres

If you want to use Vercel's managed Postgres:
1. Add Vercel Postgres to your project
2. Use the connection string provided by Vercel
3. Update your environment variables accordingly

