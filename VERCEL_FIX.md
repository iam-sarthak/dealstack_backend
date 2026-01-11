# Vercel "pg package" Error - Final Fix

## The Problem
Vercel serverless functions require explicit handling of native dependencies like `pg`. The error occurs because Sequelize tries to load the PostgreSQL driver before it's available.

## The Solution Applied

### 1. Explicit Module Import with dialectModule
Updated `config/database.js` to:
- Explicitly import `pg` using dynamic import
- Pass it to Sequelize via `dialectModule` option
- This tells Sequelize exactly which module to use

### 2. Updated vercel.json
Added `includeFiles` to ensure `pg` and `pg-hstore` are bundled:
```json
{
  "config": {
    "includeFiles": [
      "node_modules/pg/**",
      "node_modules/pg-hstore/**"
    ]
  }
}
```

## Verification Steps

1. **Check package.json**: Ensure `pg` is in `dependencies` (not `devDependencies`)
   ```json
   "dependencies": {
     "pg": "^8.11.3"
   }
   ```

2. **Verify local installation**:
   ```bash
   cd backend
   npm install
   ls node_modules/pg
   ```

3. **Check Vercel Build Logs**:
   - Go to your Vercel project → Deployments → Click on a deployment
   - Check "Build Logs" tab
   - Look for: "Installing dependencies" - should show `pg` being installed
   - Look for any errors about native modules

4. **Check Function Logs**:
   - After deployment, check "Function Logs"
   - The error should no longer appear
   - If it does, check that the import is working

## If Error Persists

### Option 1: Check Node Version
Vercel should use Node.js 18+. Check in Vercel project settings:
- Settings → General → Node.js Version
- Should be 18.x or 20.x

### Option 2: Verify Build Output
Check that `node_modules/pg` exists in the deployment:
- Vercel should automatically include it
- If not, the `includeFiles` in `vercel.json` should force it

### Option 3: Use Connection String (Alternative)
If the module approach doesn't work, you can use a connection string:
```javascript
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectModule: pgModule,
  // ... other options
});
```

### Option 4: Check for Build Errors
Sometimes the build fails silently. Check:
- Build logs for compilation errors
- Ensure no TypeScript errors (if using TS)
- Check that all dependencies are compatible

## Current Implementation

The `database.js` file now:
1. Imports `pg` explicitly using `await import('pg')`
2. Stores it in `pgModule` variable
3. Passes it to Sequelize via `dialectModule: pgModule`
4. Throws a clear error if `pg` can't be loaded

This ensures Sequelize uses the exact `pg` module we imported, which is critical for Vercel's serverless environment.

## Testing Locally

Before deploying, test with:
```bash
vercel dev
```

This simulates the Vercel environment and should catch the error locally.

