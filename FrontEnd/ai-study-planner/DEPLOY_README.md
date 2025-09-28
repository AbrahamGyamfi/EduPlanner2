# EduMaster Frontend Deployment Guide for Render

## Prerequisites
- Your backend is already deployed at: https://eduplanner2-3wye.onrender.com/
- GitHub repository is up to date

## Deployment Steps

### 1. Create Static Site on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository: `EduPlanner2`
4. Configure the static site:
   - **Name**: `edumaster-frontend` (or your preferred name)
   - **Branch**: `master`
   - **Root Directory**: `FrontEnd/ai-study-planner`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `build`

### 2. Environment Variables
Set the following environment variable in Render:

- **Key**: `REACT_APP_API_URL`
- **Value**: `https://eduplanner2-3wye.onrender.com`

### 3. Advanced Settings (Optional)
- **Auto-Deploy**: `Yes` (deploys automatically on git push)
- **Pull Request Previews**: `No` (or `Yes` if you want preview deploys)

### 4. Deploy
1. Click "Create Static Site"
2. Render will automatically:
   - Install dependencies (`npm ci`)
   - Build the React app (`npm run build`)
   - Deploy the static files
3. Your frontend will be available at: `https://your-site-name.onrender.com`

## Important Notes

### API Configuration
- The frontend is configured to use your deployed backend automatically
- In development, it falls back to `http://localhost:5000`
- The API configuration is in `src/config/api.js`

### Build Process
- Uses Node.js 18.x
- Installs dependencies with `npm ci` for faster, reliable builds
- Creates optimized production build
- Serves static files with automatic HTTPS

### Custom Domain (Optional)
- After deployment, you can add a custom domain in Render dashboard
- Render provides automatic SSL certificates

## Troubleshooting

### Build Fails
1. Check the build logs in Render dashboard
2. Ensure all dependencies are in `package.json`
3. Verify build command works locally: `npm run build`

### API Connection Issues
1. Verify backend is running: https://eduplanner2-3wye.onrender.com/
2. Check CORS configuration in backend
3. Verify `REACT_APP_API_URL` environment variable

### Routing Issues
1. Render automatically handles SPA routing
2. All routes redirect to `index.html`
3. React Router will handle client-side routing

## Testing Your Deployment
After deployment, test these features:
1. Homepage loads correctly
2. Login/signup functionality
3. File upload and processing
4. API calls to backend work
5. All routes navigate properly

## Next Steps
Once deployed:
1. Update backend CORS to include your frontend URL (optional - currently allows all origins)
2. Set up custom domain if desired
3. Configure any additional environment variables