# Deployment Guide

## PostgreSQL Driver (pg) Installation

If you encounter the error: "Please install pg package manually", follow these steps:

### For Local Development:
```bash
cd backend
npm install
```

### For AWS Lambda / Serverless Deployments:

1. **Ensure pg is in dependencies**: The `pg` package is already listed in `package.json`.

2. **Bundle dependencies**: Make sure all `node_modules` are included in your deployment package:
   ```bash
   npm install --production
   ```

3. **For AWS Lambda specifically**:
   - Native dependencies like `pg` may need to be compiled for the Lambda runtime
   - Consider using a Lambda Layer for PostgreSQL client
   - Or use a build process that compiles native modules for the Lambda environment
   
4. **Alternative for Lambda**: Use `pg` with proper bundling:
   ```bash
   # Install dependencies
   npm install
   
   # Ensure pg is bundled (check node_modules/pg exists)
   ls node_modules/pg
   ```

5. **Docker deployments**: If using Docker, ensure the base image includes build tools:
   ```dockerfile
   FROM node:18
   RUN apt-get update && apt-get install -y python3 make g++
   ```

### Verification:
After deployment, verify that `pg` is available:
- Check that `node_modules/pg` exists in your deployment package
- The database.js file now explicitly imports `pg` to ensure it's loaded

