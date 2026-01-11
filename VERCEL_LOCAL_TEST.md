# Testing Vercel Locally

## Install Vercel CLI

You can install Vercel CLI either globally or as a dev dependency:

### Option 1: Global Installation (Recommended)
```bash
npm install -g vercel
```

### Option 2: Local Installation
```bash
cd backend
npm install --save-dev vercel
```

Then use it via npx:
```bash
npx vercel dev
```

## Setup and Test Locally

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Login to Vercel** (first time only):
   ```bash
   vercel login
   ```

3. **Link your project** (if not already linked):
   ```bash
   vercel link
   ```
   This will ask you to:
   - Select or create a Vercel project
   - Link to an existing project or create a new one

4. **Set up environment variables locally**:
   Create a `.env.local` file in the backend directory:
   ```bash
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=fjWkV4asT-8G2iU
   DB_HOST=db.hvznlwaqqqiltaupvyrq.supabase.co
   DB_PORT=5432
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

5. **Run Vercel locally**:
   ```bash
   vercel dev
   ```
   Or if installed locally:
   ```bash
   npm run vercel:dev
   ```

   This will:
   - Start a local server (usually on port 3000)
   - Simulate the Vercel serverless environment
   - Use your `.env.local` file for environment variables
   - Test the `pg` module loading

6. **Test the API**:
   - Health check: `http://localhost:3000/api/health`
   - The server should start without the "pg package" error

## Troubleshooting

### If you see "pg package" error:
1. Verify `pg` is installed:
   ```bash
   ls node_modules/pg
   ```

2. Reinstall dependencies:
   ```bash
   npm install
   ```

3. Check that `vercel.json` is in the backend directory

### If port 3000 is in use:
Vercel will automatically use the next available port (3001, 3002, etc.)

### Environment Variables:
- `.env.local` is used for local development
- Vercel will use environment variables from your Vercel project settings when deployed
- Make sure all required variables are set in both places

## Test Database Connection

Once `vercel dev` is running, test the database connection:

```bash
curl http://localhost:3000/api/health
```

Or visit in browser: `http://localhost:3000/api/health`

You should see:
```json
{"status":"OK","message":"Server is running"}
```

If the database connection works, you won't see the "pg package" error.

## Next Steps

After local testing works:
1. Deploy to Vercel: `vercel --prod`
2. Or push to your connected Git repository for automatic deployment

