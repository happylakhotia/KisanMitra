# 🚀 AgriVision Deployment Guide

## Project Structure

```
sih/
├── backend/          # Express.js API
├── frontend/         # Vite + React app
└── deployment files  # Configuration files
```

## 📋 What's Been Done

### ✅ Configuration Files Created

1. **`backend/vercel.json`** - Backend deployment config for Vercel
2. **`frontend/vercel.json`** - Frontend deployment config for Vercel
3. **Backend CORS** - Updated to support production URLs
4. **Frontend API calls** - Centralized using environment variables

### ✅ Code Updates

All hardcoded `localhost:5000` references have been replaced with environment variables:
- ✅ VegetationIndexCard.jsx
- ✅ Alerts.jsx
- ✅ LiveCheck.jsx
- ✅ PestScanner.jsx
- ✅ AIAssistant.jsx
- ✅ KisanMitraChat.jsx
- ✅ Reports.jsx

All API calls now use centralized `API_ENDPOINTS` from `frontend/src/api/endpoints.js`

## 🎯 Quick Deployment Steps

### Method 1: Vercel Dashboard (Recommended)

**See `QUICK_START_DEPLOYMENT.md` for detailed step-by-step instructions**

**TL;DR:**
1. Push code to GitHub
2. Go to https://vercel.com/dashboard
3. Import repository twice (once for backend, once for frontend)
4. Backend: Set root directory to `backend`
5. Frontend: Set root directory to `frontend`, build command to `npm run build`
6. Add environment variables to both projects
7. Done! ✨

### Method 2: Vercel CLI

**See `VERCEL_COMMANDS.md` for all CLI commands**

```bash
# Install CLI
npm install -g vercel

# Deploy backend
cd backend
vercel --prod

# Deploy frontend
cd ../frontend
vercel --prod
```

## 🔐 Environment Variables

### Backend Environment Variables

Add these in Vercel Dashboard → Your Backend Project → Settings → Environment Variables:

```env
PORT=5000
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
FRONTEND_URL=https://your-frontend.vercel.app
# Add all your other API keys
```

### Frontend Environment Variables

Add these in Vercel Dashboard → Your Frontend Project → Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://your-backend.vercel.app
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 📁 Important Files

| File | Description |
|------|-------------|
| `QUICK_START_DEPLOYMENT.md` | **START HERE** - Step-by-step deployment guide |
| `DEPLOYMENT_GUIDE.md` | Comprehensive deployment documentation |
| `VERCEL_COMMANDS.md` | All Vercel CLI commands reference |
| `DEPLOYMENT_CHECKLIST.md` | Checklist to ensure nothing is missed |
| `backend/vercel.json` | Backend deployment configuration |
| `frontend/vercel.json` | Frontend deployment configuration |
| `backend/server.js` | Updated with CORS for production |
| `frontend/src/api/endpoints.js` | Centralized API endpoints |

## 🔄 Deployment Flow

```
┌─────────────────┐
│  Push to GitHub │
└────────┬────────┘
         │
         ├──────────────────┐
         │                  │
    ┌────▼─────┐      ┌────▼─────┐
    │  Backend │      │ Frontend │
    │  Vercel  │      │  Vercel  │
    └────┬─────┘      └────┬─────┘
         │                  │
         │   ◄──── CORS ───►│
         │                  │
    ┌────▼──────────────────▼────┐
    │  Production Environment   │
    │  Backend: backend-*.vercel.app  │
    │  Frontend: frontend-*.vercel.app │
    └─────────────────────────────┘
```

## ⚠️ Important Notes

### Before Deployment

1. **Push to Git**: Make sure all your code is committed and pushed
2. **Environment Variables**: Have all your API keys and credentials ready
3. **Firebase Setup**: Ensure Firebase project is configured for production
4. **Test Locally**: Run `npm run dev` in both folders to ensure everything works

### After Deployment

1. **Update Backend CORS**: Add frontend URL to `FRONTEND_URL` environment variable
2. **Test All Features**: Go through your app and test all functionality
3. **Check Logs**: Monitor Vercel logs for any errors
4. **Custom Domain** (Optional): Add your custom domain in Vercel settings

## 🛠️ Local Development

```bash
# Backend (Terminal 1)
cd backend
npm install
npm start

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

Frontend will be at: http://localhost:5173
Backend will be at: http://localhost:5000

## 📱 Testing After Deployment

1. **Frontend Health Check**: Visit `https://your-frontend.vercel.app`
2. **Backend Health Check**: Visit `https://your-backend.vercel.app` (should show: "AgriVision API is running")
3. **Login/Registration**: Test user authentication
4. **API Calls**: Check browser console for any CORS or API errors
5. **Features**: Test all major features (field selection, alerts, disease prediction, etc.)

## 🐛 Troubleshooting

### Common Issues

**Issue**: CORS error in browser console
**Solution**: Make sure `FRONTEND_URL` is set on backend and backend is redeployed

**Issue**: API calls returning 500 error
**Solution**: Check backend logs in Vercel Dashboard → Logs

**Issue**: Environment variables not working
**Solution**: Make sure they're set for all environments (Production, Preview, Development) and redeploy

**Issue**: Build fails
**Solution**: Check build logs, ensure all dependencies are in `package.json`

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Express.js on Vercel](https://vercel.com/guides/using-express-with-vercel)

## 🎉 Success!

Once deployed, your URLs will look like:
- **Frontend**: `https://frontend-taupe-rho-64.vercel.app`
- **Backend**: `https://backend-wheat-rho-11.vercel.app`

Enjoy your deployed AgriVision app! 🌱

---

**Need help?** Check the other deployment guides or contact support.

