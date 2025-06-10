from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
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

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Development configuration
app.config['DEBUG'] = True  # Enable debug mode
app.config['ENV'] = 'development'  # Set environment to development
app.secret_key = 'dev-secret-key-change-in-production'  # Required for session/flash messages

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client.eduplanner  # Database Name
users_collection = db.users  # Collection Name

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

# Helper function to clean up extracted text content
def clean_slide_content(content):
    """Clean up and normalize extracted slide content."""
    if not content or not isinstance(content, str):
        return "No content available"
    
    # Remove excessive whitespace
    content = ' '.join(content.split())
    
    # Cut off if it's too long
    if len(content) > 3000:
        return content[:3000] + "... (content truncated)"
    
    return content

def get_gemini_api_key():
    return os.getenv("GEMINI_API_KEY")

def call_gemini_completion(prompt, max_tokens=256, temperature=0.7):
    api_key = get_gemini_api_key()
    if not api_key:
        logger.error("Gemini API key not found")
        return None, "Gemini API key not found. Please set GEMINI_API_KEY in .env."
    
    # Updated to use the latest API endpoint
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"  # Using Bearer token authentication
    }
    
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
            "topP": 1,
            "topK": 1
        }
    }
    
    try:
        logger.debug(f"Sending request to Gemini API with prompt length: {len(prompt)}")
        logger.debug(f"Using API endpoint: {url}")
        
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        logger.debug(f"Response status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            try:
                logger.debug(f"Gemini API response: {result}")
                if (
                    "candidates" in result and
                    len(result["candidates"]) > 0 and
                    "content" in result["candidates"][0] and
                    "parts" in result["candidates"][0]["content"] and
                    len(result["candidates"][0]["content"]["parts"]) > 0 and
                    "text" in result["candidates"][0]["content"]["parts"][0]
                ):
                    return result["candidates"][0]["content"]["parts"][0]["text"], None
                else:
                    error_msg = f"Gemini API response missing expected fields: {result}"
                    logger.error(error_msg)
                    return None, error_msg
            except Exception as ex:
                error_msg = f"Error parsing Gemini API response: {ex}, response: {result}"
                logger.error(error_msg)
                return None, f"Unexpected response format from Gemini: {result}"
        else:
            try:
                error_detail = response.json()
                logger.error(f"Full API error response: {error_detail}")
            except Exception:
                error_detail = response.text
                logger.error(f"Raw API error response: {error_detail}")
            
            error_msg = f"Gemini API error: {response.status_code}, details: {error_detail}"
            logger.error(error_msg)
            return None, error_msg
    except Exception as e:
        error_msg = f"Exception during Gemini API call: {e}"
        logger.error(error_msg)
        return None, error_msg


# Route for generating quiz questions
@app.route("/generate-quiz", methods=["POST"])
def generate_quiz():
    logger.info("Received quiz generation request")
    try:
        # Validate file presence
        if 'file' not in request.files:
            logger.error("No file uploaded in the request")
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['file']
        
        # Validate filename
        if file.filename == '':
            logger.error("Empty filename received")
            return jsonify({"error": "No selected file"}), 400
            
        # Log file details
        logger.info(f"Processing file: {file.filename}")
        
        try:
            content = file.read().decode('utf-8', errors='ignore')
            logger.info(f"Successfully read file content, size: {len(content)} bytes")
        except Exception as read_error:
            logger.error(f"Error reading file content: {str(read_error)}")
            return jsonify({"error": f"Error reading file: {str(read_error)}"}), 400
            
        try:
            slide_content = clean_slide_content(content)
            logger.info("Successfully cleaned slide content")
        except Exception as clean_error:
            logger.error(f"Error cleaning slide content: {str(clean_error)}")
            return jsonify({"error": f"Error processing content: {str(clean_error)}"}), 500
            
        # Generate quiz prompt
        prompt = f"Generate 4 quiz questions (with no answers) based on the following content. Each question should be on a new line.\n{slide_content}"
        logger.info("Calling Gemini API for quiz generation")
        
        quiz, error = call_gemini_completion(prompt, max_tokens=256)
        
        if error:
            logger.error(f"Gemini API error: {error}")
            return jsonify({
                "error": error,
                "details": "Failed to generate quiz using AI model"
            }), 500
            
        if not quiz or not quiz.strip():
            logger.error("Received empty quiz from Gemini API")
            return jsonify({
                "error": "Generated quiz is empty",
                "details": "The AI model returned an empty response"
            }), 500
            
        logger.info("Successfully generated quiz")
        return jsonify({
            "quiz": quiz,
            "message": "Quiz generated successfully"
        }), 200
        
    except Exception as e:
        logger.exception("Unexpected error in generate_quiz endpoint")
        return jsonify({
            "error": str(e),
            "details": "An unexpected error occurred while generating the quiz",
            "type": type(e).__name__
        }), 500

# Route for generating summaries
@app.route("/generate-summary", methods=["POST"])
def generate_summary():
    logger.info("Received summary generation request")
    try:
        # Validate file presence
        if 'file' not in request.files:
            logger.error("No file uploaded in the request")
            return jsonify({"error": "No file uploaded"}), 400
            
        file = request.files['file']
        
        # Validate filename
        if file.filename == '':
            logger.error("Empty filename received")
            return jsonify({"error": "No selected file"}), 400
            
        filename = file.filename.lower()
        logger.info(f"Processing file for summary: {filename}")
        
        try:
            if filename.endswith('.pdf'):
                # Extract text from PDF
                logger.info("Processing PDF file")
                from io import BytesIO
                pdf_reader = PdfReader(BytesIO(file.read()))
                content = " ".join(page.extract_text() or "" for page in pdf_reader.pages)
                logger.info(f"Successfully extracted text from PDF, size: {len(content)} bytes")
            elif filename.endswith('.txt'):
                logger.info("Processing TXT file")
                content = file.read().decode('utf-8', errors='ignore')
                logger.info(f"Successfully read TXT file, size: {len(content)} bytes")
            else:
                logger.error(f"Unsupported file type: {filename}")
                return jsonify({"error": "Unsupported file type for summary generation. Please upload a PDF or TXT file."}), 400
                
            try:
                slide_content = clean_slide_content(content)
                logger.info("Successfully cleaned content")
            except Exception as clean_error:
                logger.error(f"Error cleaning content: {str(clean_error)}")
                return jsonify({"error": f"Error processing content: {str(clean_error)}"}), 500
                
            prompt = f"Summarize the following content in a concise paragraph:\n{slide_content}"
            logger.info("Calling Gemini API for summary generation")
            
            summary, error = call_gemini_completion(prompt, max_tokens=256)
            
            if error:
                logger.error(f"Gemini API error: {error}")
                return jsonify({
                    "error": error,
                    "details": "Failed to generate summary using AI model"
                }), 500
                
            if not summary or not summary.strip():
                logger.error("Received empty summary from Gemini API")
                return jsonify({
                    "error": "Generated summary is empty",
                    "details": "The AI model returned an empty response"
                }), 500
                
            logger.info("Successfully generated summary")
            return jsonify({
                "summary": summary,
                "message": "Summary generated successfully"
            }), 200
            
        except Exception as file_error:
            logger.exception("Error processing file")
            return jsonify({
                "error": str(file_error),
                "details": "Error occurred while processing the file",
                "type": type(file_error).__name__
            }), 500
            
    except Exception as e:
        logger.exception("Unexpected error in generate_summary endpoint")
        return jsonify({
            "error": str(e),
            "details": "An unexpected error occurred while generating the summary",
            "type": type(e).__name__
        }), 500

# Route for fetching related resources
@app.route("/fetch-resources", methods=["POST"])
def fetch_resources():
    try:
        data = request.json
        slides = data.get("slides", [])
        
        # Extract topics from slide names
        topics = []
        for slide in slides:
            slide_name = slide.get("name", "").split('.')[0]
            topics.append(slide_name)
        
        # Remove duplicates and limit to 5 topics
        unique_topics = list(set(topics))[:5]
        
        # Generate resources based on topics
        resources = []
        
        for topic in unique_topics:
            # Add Wikipedia resource
            resources.append({
                "title": f"{topic} - Wikipedia",
                "url": f"https://en.wikipedia.org/wiki/{topic.replace(' ', '_')}"
            })
            
            # Add YouTube search
            resources.append({
                "title": f"{topic} - YouTube Tutorials",
                "url": f"https://www.youtube.com/results?search_query={topic.replace(' ', '+')}+tutorial"
            })
            
            # Add Google Scholar search
            resources.append({
                "title": f"{topic} - Academic Papers",
                "url": f"https://scholar.google.com/scholar?q={topic.replace(' ', '+')}"
            })
            
            # Add Khan Academy search
            resources.append({
                "title": f"{topic} - Khan Academy",
                "url": f"https://www.khanacademy.org/search?page_search_query={topic.replace(' ', '+')}"
            })
        
        # Remove any duplicates
        unique_resources = []
        urls = set()
        
        for resource in resources:
            if resource["url"] not in urls:
                unique_resources.append(resource)
                urls.add(resource["url"])
        
        return jsonify({"resources": unique_resources[:10]}), 200  # Limit to 10 resources
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    try:
        app.run(
            host='127.0.0.1',
            port=5000,
            debug=True,
            use_reloader=True,
            threaded=True  # Enable threading
        )
    except OSError as e:
        if e.winerror == 10038:  # Windows socket error
            logger.error("Windows socket error encountered. Restarting server without threading...")
            app.run(
                host='127.0.0.1',
                port=5000,
                debug=True,
                use_reloader=False,  # Disable reloader
                threaded=False  # Disable threading
            )
        else:
            raise e


def get_huggingface_api_key():
    return os.getenv("HUGGINGFACE_API_KEY")

def call_huggingface_summarization(text):
    api_key = get_huggingface_api_key()
    if not api_key:
        return None, "Hugging Face API key not found. Please set HUGGINGFACE_API_KEY in .env."
    headers = {"Authorization": f"Bearer {api_key}"}
    payload = {"inputs": text}
    response = requests.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        headers=headers,
        json=payload,
        timeout=60
    )
    if response.status_code == 200:
        result = response.json()
        if isinstance(result, list) and len(result) > 0 and "summary_text" in result[0]:
            return result[0]["summary_text"], None
        elif isinstance(result, dict) and "error" in result:
            return None, result["error"]
        else:
            return None, "Unexpected response format from Hugging Face."
    else:
        return None, f"Hugging Face API error: {response.status_code}"






UPLOAD_FOLDER = os.path.join(os.getcwd(), "uploaded_slides")
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {"pdf", "txt", "docx", "pptx", "png", "jpg", "jpeg"}
def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/upload-slide", methods=["POST"])
def upload_slide():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(save_path)
        return jsonify({"message": "File uploaded successfully", "filename": filename}), 200
    else:
        return jsonify({"error": "File type not allowed"}), 400

@app.route("/slides", methods=["GET"])
def list_slides():
    files = os.listdir(app.config["UPLOAD_FOLDER"])
    return jsonify({"slides": files}), 200

@app.route("/slides/<filename>", methods=["GET"])
def read_slide(filename):
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(filename))
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    with open(file_path, "rb") as f:
        content = f.read()
    return content, 200

@app.route("/slides/<filename>", methods=["DELETE"])
def delete_slide(filename):
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], secure_filename(filename))
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    os.remove(file_path)
    return jsonify({"message": "File deleted successfully"}), 200