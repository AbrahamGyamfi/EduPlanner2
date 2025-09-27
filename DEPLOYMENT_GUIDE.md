# EduMaster Backend - Render Deployment Guide

## Pre-deployment Checklist

### 1. Database Setup
- [ ] Set up MongoDB Atlas account (or other cloud MongoDB provider)
- [ ] Create a new database cluster
- [ ] Get the MongoDB connection string
- [ ] Create a database user with appropriate permissions

### 2. Environment Variables Setup
Set these environment variables in your Render dashboard:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=eduplanner
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your_very_secure_secret_key_for_production
GEMINI_API_KEY=your_actual_gemini_api_key
CORS_ORIGINS=https://your-frontend-domain.com
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploaded_slides
```

### 3. Render Service Configuration

#### Option 1: Using render.yaml (Recommended)
1. Use the provided `render.yaml` file in the root directory
2. Connect your GitHub repository to Render
3. Render will automatically detect the configuration

#### Option 2: Manual Setup
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - **Environment**: Python 3
   - **Build Command**: `cd Backend && pip install -r requirements.txt`
   - **Start Command**: `cd Backend && gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 start:app`
   - **Root Directory**: Leave blank (uses repo root)

### 4. Required Services
- MongoDB Atlas (or any cloud MongoDB provider)
- Google Gemini AI API key

### 5. Post-deployment Steps
1. Test all endpoints using the deployed URL
2. Update your frontend's API base URL to point to your Render backend
3. Test file uploads and all functionality
4. Monitor logs for any issues

## Important Notes

1. **File Uploads**: Files uploaded to Render are ephemeral. Consider using cloud storage (AWS S3, Cloudinary, etc.) for persistent file storage in production.

2. **Database**: Make sure to use a cloud database service like MongoDB Atlas, as Render services are stateless.

3. **Environment Variables**: Never commit sensitive information like API keys or database passwords to your repository.

4. **CORS**: Update the `CORS_ORIGINS` environment variable with your frontend domain(s).

5. **SSL**: Render provides SSL certificates automatically for custom domains.

## Troubleshooting

### Common Issues:
1. **Build Failures**: Check that all dependencies are in requirements.txt
2. **Database Connection**: Verify MongoDB URI and network access
3. **Import Errors**: Ensure all Python modules are properly structured
4. **CORS Issues**: Check that frontend domain is in CORS_ORIGINS

### Checking Logs:
- Use Render's dashboard to view application logs
- Check for any startup errors or runtime exceptions

## Testing Your Deployment

After deployment, test these endpoints:
- `GET /` - Should return API status
- `GET /api/docs` - Should return Swagger documentation
- Test a simple POST endpoint to verify database connectivity

## Performance Considerations

- The current configuration uses 2 Gunicorn workers
- Timeout is set to 120 seconds for large file uploads
- Consider upgrading Render plan for better performance if needed