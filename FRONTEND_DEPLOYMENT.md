# Vercel Deployment Guide for EduMaster Frontend

## Steps to Deploy Frontend on Vercel

### 1. Prepare Your Repository
Your frontend is now configured to connect to your deployed backend at:
`https://eduplanner2-lntb.onrender.com`

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI (Recommended)
1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```

2. In your project root directory, run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Link to existing project? **No**
   - Project name: **edumaster-frontend** (or your preferred name)
   - Which directory contains your code? **FrontEnd/ai-study-planner**
   - Want to override settings? **Yes**
   - Build Command: **npm run build**
   - Output Directory: **build**
   - Development Command: **npm start**

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory**: `FrontEnd/ai-study-planner`
   - **Framework Preset**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### 3. Environment Variables (if needed)
The app is already configured to use the production backend URL, but you can add environment variables in Vercel:
- `REACT_APP_API_BASE_URL`: `https://eduplanner2-lntb.onrender.com`

### 4. Update CORS on Backend
After deployment, update your backend's CORS_ORIGINS environment variable on Render to include your Vercel domain:

```
CORS_ORIGINS=https://your-vercel-domain.vercel.app,http://localhost:3000
```

### 5. Test Your Deployment
Once deployed, test these key features:
- File uploads
- Quiz generation
- Schedule creation
- User authentication (if applicable)

## What Was Changed

✅ **All API URLs updated** from `localhost:5000` to `https://eduplanner2-lntb.onrender.com`
✅ **Environment configuration** created for production
✅ **Vercel configuration** added with proper build settings
✅ **CORS configuration** updated to accept Vercel domains

## Files Modified:
- All hook files (`useFileOperations.js`, `useQuizState.js`, etc.)
- All page components (`Assignments.jsx`, `Schedule.jsx`, etc.)
- Service files (`behavioralAnalyticsService.js`)
- Backend CORS configuration

Your frontend is now ready for Vercel deployment! 🚀