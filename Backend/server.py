from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from flask_restful import Api
from flask_swagger import swagger
import bcrypt
import json
import os
from dotenv import load_dotenv
import requests
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import logging
import sys
from datetime import datetime
from io import BytesIO
import google.generativeai as genai
from PIL import Image
from pptx import Presentation

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Create logger instance
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Configure upload folder from environment variables
UPLOAD_FOLDER = os.path.join(os.getcwd(), os.getenv('UPLOAD_FOLDER', 'uploaded_slides'))
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
ALLOWED_EXTENSIONS = {"pdf", "txt", "docx", "pptx", "png", "jpg", "jpeg"}

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Configure CORS
CORS(app, resources={
    r"/*": {
        "origins": os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    }
})

# Configuration from environment variables
app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
app.config['ENV'] = os.getenv('FLASK_ENV', 'development')
app.secret_key = os.getenv('SECRET_KEY', 'fallback-secret-key-change-in-production')

# MongoDB configuration from environment variables
mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
database_name = os.getenv('DATABASE_NAME', 'eduplanner')

# Connect to MongoDB
client = MongoClient(mongodb_uri)
db = client[database_name]  # Database Name
users_collection = db.users  # Collection Name

# Add CORS headers to all responses
@app.after_request
def after_request(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Max-Age'] = '3600'
    return response

# Handle OPTIONS preflight requests
@app.route('/slides/<filename>', methods=['OPTIONS'])
def handle_preflight(filename):
    response = jsonify({'message': 'OK'})
    return response, 200

# Signup Route
@app.route("/signup", methods=["POST"])
def signup():
    data = request.json
    firstname = data.get("firstname")
    lastname = data.get("lastname")
    studentId = data.get("studentId")
    email = data.get("email")
    password = data.get("password")

    if users_collection.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    users_collection.insert_one({
        "firstname": firstname,
        "lastname": lastname,
        "studentId": studentId,
        "email": email,
        "password": hashed_pw
    })

    return jsonify({"message": "User created successfully"}), 201

# Login Route (No JWT, Simple Authentication)
@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = users_collection.find_one({"email": email})

    if user and bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({
            "status": "success",
            "message": "Logged in successfully",
            "user": {
                "firstname": user.get("firstname"),
                "lastname": user.get("lastname"),
                "email": user.get("email")
            }
        }), 200
    else:
        return jsonify({
            "status": "fail",
            "message": "Invalid credentials"
        }), 401

# Configure Gemini API from environment variables
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.error("GEMINI_API_KEY not found in environment variables!")
    raise ValueError("GEMINI_API_KEY environment variable is required")

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# Upload configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'ppt', 'pptx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    text = ""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
    return text

def extract_text_from_image(file_path):
    """Extract text from image using OCR"""
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"Error extracting text from image: {e}")
        return ""

def extract_text_from_ppt(file_path):
    """Extract text from PowerPoint file"""
    try:
        from pptx import Presentation
        prs = Presentation(file_path)
        text = ""
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting text from PowerPoint: {e}")
        return ""

def generate_summary(text):
    """Generate summary using Gemini API"""
    try:
        prompt = f"""
        Please provide a comprehensive summary of the following content from slides/presentation:
        
        {text}
        
        Please structure the summary with:
        1. Main topic/title
        2. Key points (bullet points)
        3. Important details
        4. Conclusion
        
        Make it clear and concise while covering all important information.
        """
        
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating summary: {e}")
        return "Error generating summary. Please try again."

def generate_quiz(text):
    """Generate quiz questions using Gemini API"""
    try:
        prompt = f"""
        Based on the following content from slides/presentation, create a quiz with 5 multiple-choice questions:
        
        {text}
        
        Please format the response as JSON with the following structure:
        {{
            "questions": [
                {{
                    "question": "Question text here?",
                    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                    "correct_answer": "A"
                }}
            ]
        }}
        
        Make sure the questions test understanding of key concepts from the content.
        """
        
        response = model.generate_content(prompt)
        # Try to parse JSON from response
        response_text = response.text.strip()
        # Remove markdown code blocks if present
        if response_text.startswith('```json'):
            response_text = response_text[7:-3]
        elif response_text.startswith('```'):
            response_text = response_text[3:-3]
        
        quiz_data = json.loads(response_text)
        return quiz_data
    except Exception as e:
        print(f"Error generating quiz: {e}")
        # Return a fallback quiz structure
        return {
            "questions": [
                {
                    "question": "Error generating quiz questions. Please try uploading the file again.",
                    "options": ["A) Try again", "B) Try again", "C) Try again", "D) Try again"],
                    "correct_answer": "A"
                }
            ]
        }

@app.route('/')
def index():
    return jsonify({"message": "Slide Analyzer API is running!"})

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Extract text based on file type
        file_extension = filename.rsplit('.', 1)[1].lower()
        
        if file_extension == 'pdf':
            extracted_text = extract_text_from_pdf(file_path)
        elif file_extension in ['png', 'jpg', 'jpeg']:
            extracted_text = extract_text_from_image(file_path)
        elif file_extension in ['ppt', 'pptx']:
            extracted_text = extract_text_from_ppt(file_path)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
        
        if not extracted_text.strip():
            return jsonify({'error': 'No text could be extracted from the file'}), 400
        
        return jsonify({
            'message': 'File uploaded successfully',
            'filename': filename,
            'extracted_text': extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
        })
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/generate-summary', methods=['POST'])
def generate_summary_endpoint():
    data = request.get_json()
    
    if not data or 'filename' not in data:
        return jsonify({'error': 'Filename required'}), 400
    
    filename = data['filename']
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    # Extract text based on file type
    file_extension = filename.rsplit('.', 1)[1].lower()
    
    if file_extension == 'pdf':
        extracted_text = extract_text_from_pdf(file_path)
    elif file_extension in ['png', 'jpg', 'jpeg']:
        extracted_text = extract_text_from_image(file_path)
    elif file_extension in ['ppt', 'pptx']:
        extracted_text = extract_text_from_ppt(file_path)
    else:
        return jsonify({'error': 'Unsupported file type'}), 400
    
    if not extracted_text.strip():
        return jsonify({'error': 'No text could be extracted from the file'}), 400
    
    summary = generate_summary(extracted_text)
    
    return jsonify({
        'summary': summary,
        'filename': filename
    })

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz_endpoint():
    data = request.get_json()
    
    if not data or 'filename' not in data:
        return jsonify({'error': 'Filename required'}), 400
    
    filename = data['filename']
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    
    if not os.path.exists(file_path):
        return jsonify({'error': 'File not found'}), 404
    
    # Extract text based on file type
    file_extension = filename.rsplit('.', 1)[1].lower()
    
    if file_extension == 'pdf':
        extracted_text = extract_text_from_pdf(file_path)
    elif file_extension in ['png', 'jpg', 'jpeg']:
        extracted_text = extract_text_from_image(file_path)
    elif file_extension in ['ppt', 'pptx']:
        extracted_text = extract_text_from_ppt(file_path)
    else:
        return jsonify({'error': 'Unsupported file type'}), 400
    
    if not extracted_text.strip():
        return jsonify({'error': 'No text could be extracted from the file'}), 400
    
    quiz_data = generate_quiz(extracted_text)
    
    return jsonify({
        'quiz': quiz_data,
        'filename': filename
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
