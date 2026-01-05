# Vercel Deployment Guide

This guide will help you deploy your frontend and backend to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Push your code to a Git repository (recommended) OR use Vercel CLI

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Deploying the Backend

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New Project"**
3. **Import your Git repository** (or upload manually)
4. **Configure Project**:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (not needed for Node.js)
   - **Output Directory**: Leave empty
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add all variables from your `.env` file:
     ```
     PORT=5000
     FIREBASE_PROJECT_ID=your-project-id
     FIREBASE_CLIENT_EMAIL=your-client-email
     FIREBASE_PRIVATE_KEY=your-private-key
     # Add all other environment variables
     ```
   
6. **Deploy**: Click "Deploy"
7. **Note your Backend URL**: e.g., `https://backend-wheat-rho-11.vercel.app`

### Deploying the Frontend

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click "Add New Project"** (for a second project)
3. **Import your Git repository** (or upload manually)
4. **Configure Project**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add your backend URL:
     ```
     VITE_API_BASE_URL=https://your-backend-url.vercel.app
     ```
   - Add Firebase config variables:
     ```
     VITE_FIREBASE_API_KEY=your-api-key
     VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
     VITE_FIREBASE_PROJECT_ID=your-project-id
     VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
     VITE_FIREBASE_APP_ID=your-app-id
     ```

6. **Deploy**: Click "Deploy"
7. **Note your Frontend URL**: e.g., `https://frontend-taupe-rho-64.vercel.app`

## Option 2: Deploy via Vercel CLI

### Install Vercel CLI

```bash
npm install -g vercel
```

### Deploy Backend

```bash
cd backend
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? `agrivision-backend` (or your choice)
- In which directory is your code located? `./`
- Want to override settings? **N**

Add environment variables:
```bash
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_PRIVATE_KEY
# Add all other environment variables
```

Deploy to production:
```bash
vercel --prod
```

### Deploy Frontend

```bash
cd frontend
vercel login
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? `agrivision-frontend` (or your choice)
- In which directory is your code located? `./`
- Want to override settings? **Y**
  - Build Command? `npm run build`
  - Output Directory? `dist`
  - Development Command? `npm run dev`

Add environment variables:
```bash
vercel env add VITE_API_BASE_URL
# Enter your backend URL when prompted
```

Deploy to production:
```bash
vercel --prod
```

## Important Notes

### Backend Considerations

1. **Serverless Functions**: Vercel runs your backend as serverless functions, which means:
   - Each request creates a new instance
   - No persistent state between requests
   - Cold starts may occur (first request after inactivity might be slower)

2. **File Uploads**: If you're using file uploads with `multer`, you may need to:
   - Use memory storage instead of disk storage
   - Upload to cloud storage (Firebase Storage, AWS S3, etc.)

3. **CORS**: Make sure your backend CORS is configured to allow your frontend domain:
   ```javascript
   app.use(cors({
     origin: ['https://frontend-taupe-rho-64.vercel.app', 'http://localhost:5173'],
     credentials: true
   }));
   ```

### Frontend Considerations

1. **Environment Variables**: Make sure your frontend is using the correct backend URL
2. **API Calls**: Update all API calls to use the production backend URL
3. **Firebase**: Ensure Firebase configuration is correct for production

## Post-Deployment

### Update Backend CORS

After deploying, update your backend CORS configuration to include your frontend URL:

```javascript
// In backend/server.js
app.use(cors({
  origin: [
    'https://your-frontend-url.vercel.app',
    'http://localhost:5173' // Keep for local development
  ],
  credentials: true
}));
```

Redeploy the backend after this change.

### Update Frontend API URL

If not using environment variables, update the API base URL in `frontend/src/api/endpoints.js`:

```javascript
const API_BASE_URL = 'https://your-backend-url.vercel.app';
```

## Troubleshooting

### Backend Issues

1. **500 Errors**: Check Vercel logs (Dashboard → Project → Logs)
2. **Environment Variables**: Ensure all required env vars are set
3. **Module Errors**: Ensure all dependencies are in `package.json`

### Frontend Issues

1. **API Connection Failed**: Check CORS and API URL
2. **Build Errors**: Check build logs in Vercel dashboard
3. **404 on Refresh**: The `vercel.json` should handle this with rewrites

## Continuous Deployment

Once connected to Git:
- **Push to `main` branch** → Automatic production deployment
- **Push to other branches** → Automatic preview deployment
- Each PR gets a unique preview URL

## Custom Domains (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Vercel provides automatic HTTPS

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Deploying Node.js Apps](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)
- [Deploying Vite Apps](https://vercel.com/docs/frameworks/vite)

## Quick Commands Reference

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Pull environment variables to local
vercel env pull
```

