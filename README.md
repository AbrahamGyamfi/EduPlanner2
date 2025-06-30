# EduMaster - AI-Powered Study Planner

EduMaster is a comprehensive educational platform that helps students manage their courses, upload study materials, and generate AI-powered summaries and quizzes from their content.

## Features

- 📚 **Course Management**: Create and organize your courses
- 📁 **File Upload**: Upload PDF, TXT, DOCX slides and study materials
- 🤖 **AI-Powered Summaries**: Generate intelligent summaries using Google's Gemini AI
- 📝 **Quiz Generation**: Automatically create quiz questions from your study materials
- 📊 **Progress Tracking**: Monitor your learning progress
- 🔐 **User Authentication**: Secure login and signup system

## Technology Stack

### Backend
- **Flask** - Python web framework
- **MongoDB** - NoSQL database for data storage
- **Google Gemini AI** - AI model for content generation
- **PyPDF2** - PDF text extraction
- **Flask-CORS** - Cross-origin resource sharing

### Frontend
- **React.js** - JavaScript library for UI
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests

## Prerequisites

Before running this application, make sure you have:

- **Python 3.8+** installed
- **Node.js 14+** and **npm** installed
- **MongoDB** running locally or access to MongoDB Atlas
- **Google Gemini API Key** (see setup instructions below)

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd EduMaster
```

### 2. Backend Setup

1. Navigate to the backend directory:
```bash
cd Backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
   - Copy `.env.template` to `.env`
   - Add your Google Gemini API key to the `.env` file:
```env
GEMINI_API_KEY=your_actual_api_key_here
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=eduplanner
```

### 3. Frontend Setup

1. Navigate to the frontend directory:
```bash
cd ../FrontEnd/ai-study-planner
```

2. Install Node.js dependencies:
```bash
npm install
```

### 4. Database Setup

Make sure MongoDB is running on your system:
- **Windows**: Start MongoDB service
- **Mac**: `brew services start mongodb-community`
- **Linux**: `sudo systemctl start mongod`

## Running the Application

### 1. Start the Backend Server

In the `Backend` directory:
```bash
python server.py
```

The backend will run on `http://localhost:5000`

### 2. Start the Frontend Development Server

In the `FrontEnd/ai-study-planner` directory:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Sign Up/Login**: Create an account or log in to an existing one
2. **Create Courses**: Add your courses to organize your study materials
3. **Upload Files**: Upload PDF, TXT, or DOCX files containing your study materials
4. **Generate Summaries**: Click the summarize button to get AI-generated summaries
5. **Create Quizzes**: Generate quiz questions automatically from your content
6. **Track Progress**: Monitor your learning progress through the dashboard

## API Endpoints

### Authentication
- `POST /signup` - Create new user account
- `POST /login` - User login

### File Management
- `POST /upload-slide` - Upload study materials
- `GET /slides` - List uploaded files
- `GET /slides/<filename>` - Download specific file
- `DELETE /slides/<filename>` - Delete file

### AI Features
- `POST /generate-summary` - Generate content summary
- `POST /generate-quiz` - Generate quiz questions
- `POST /fetch-resources` - Get related learning resources

## Configuration

### Environment Variables

Create a `.env` file in the Backend directory with the following variables:

```env
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
DATABASE_NAME=eduplanner

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_secret_key_here

# Upload Configuration
MAX_CONTENT_LENGTH=16777216
UPLOAD_FOLDER=uploaded_slides

# CORS Configuration
CORS_ORIGINS=http://localhost:3000
```

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Add it to your `.env` file

## Troubleshooting

### Common Issues

1. **Backend won't start**:
   - Check if MongoDB is running
   - Verify all dependencies are installed
   - Check if port 5000 is available

2. **Frontend compilation errors**:
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

3. **File upload fails**:
   - Check if upload directory exists
   - Verify file size limits
   - Check file type restrictions

4. **AI features not working**:
   - Verify Gemini API key is correct
   - Check internet connection
   - Review API quota limits

### Logging

The backend creates an `app.log` file with detailed logging information. Check this file for debugging issues.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please create an issue in the repository or contact the development team.

---

**Note**: This application is for educational purposes. Ensure you comply with your institution's policies regarding AI-assisted learning tools.
