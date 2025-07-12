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

# Quiz results collection
quiz_results_collection = db.quiz_results

@app.route('/api/quiz-results', methods=['POST'])
def save_quiz_result():
    """Save quiz result to database"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Required fields
        required_fields = ['userId', 'quizTitle', 'score', 'maxScore', 'questions', 'userAnswers']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create quiz result document
        quiz_result = {
            'userId': data['userId'],
            'quizTitle': data['quizTitle'],
            'score': data['score'],
            'maxScore': data['maxScore'],
            'percentage': round((data['score'] / data['maxScore']) * 100, 2),
            'questions': data['questions'],
            'userAnswers': data['userAnswers'],
            'courseId': data.get('courseId'),
            'courseName': data.get('courseName'),
            'courseCode': data.get('courseCode'),
            'difficulty': data.get('difficulty', 'Medium'),
            'topic': data.get('topic', 'General'),
            'timeSpent': data.get('timeSpent', 0),
            'attemptsUsed': data.get('attemptsUsed', 1),
            'maxAttempts': data.get('maxAttempts', 3),
            'timestamp': datetime.now().isoformat(),
            'dateTaken': datetime.now().strftime('%Y-%m-%d'),
            'metadata': data.get('metadata', {})
        }
        
        # Insert into database
        result = quiz_results_collection.insert_one(quiz_result)
        
        return jsonify({
            'message': 'Quiz result saved successfully',
            'quizResultId': str(result.inserted_id),
            'timestamp': quiz_result['timestamp']
        }), 201
        
    except Exception as e:
        print(f"Error saving quiz result: {str(e)}")
        return jsonify({'error': 'Failed to save quiz result'}), 500

@app.route('/api/quiz-results/<user_id>', methods=['GET'])
def get_quiz_results(user_id):
    """Get quiz results for a specific user"""
    try:
        # Get query parameters
        limit = request.args.get('limit', 50, type=int)
        course_id = request.args.get('courseId')
        start_date = request.args.get('startDate')
        end_date = request.args.get('endDate')
        
        # Build query
        query = {'userId': user_id}
        
        if course_id:
            query['courseId'] = course_id
        
        if start_date and end_date:
            query['dateTaken'] = {
                '$gte': start_date,
                '$lte': end_date
            }
        
        # Get quiz results
        quiz_results = list(quiz_results_collection.find(query)
                           .sort('timestamp', -1)
                           .limit(limit))
        
        # Convert ObjectId to string
        for result in quiz_results:
            result['_id'] = str(result['_id'])
        
        # Calculate summary statistics
        total_quizzes = len(quiz_results)
        if total_quizzes > 0:
            avg_score = sum(r['percentage'] for r in quiz_results) / total_quizzes
            recent_quizzes = quiz_results[:5]  # Last 5 quizzes
            recent_avg = sum(r['percentage'] for r in recent_quizzes) / len(recent_quizzes)
            
            # Calculate other metrics
            first_attempt_success = len([r for r in quiz_results if r.get('attemptsUsed', 1) == 1])
            preparation_level = (first_attempt_success / total_quizzes) * 100
            
            # Calculate consistency (standard deviation)
            scores = [r['percentage'] for r in quiz_results]
            variance = sum((x - avg_score) ** 2 for x in scores) / len(scores)
            std_dev = variance ** 0.5
            consistency_score = max(0, 100 - std_dev * 2)
            
            # Difficulty handling
            hard_quizzes = [r for r in quiz_results if r.get('difficulty') == 'Hard']
            difficulty_handling = (sum(r['percentage'] for r in hard_quizzes) / len(hard_quizzes)) if hard_quizzes else avg_score
            
            summary = {
                'totalQuizzes': total_quizzes,
                'averageScore': round(avg_score, 1),
                'recentPerformance': round(recent_avg, 1),
                'preparationLevel': round(preparation_level, 1),
                'consistencyScore': round(consistency_score, 1),
                'difficultyHandling': round(difficulty_handling, 1),
                'timeEfficiency': round(sum(r['percentage'] / max(r.get('timeSpent', 1), 1) for r in quiz_results) / total_quizzes * 10, 1)
            }
        else:
            summary = {
                'totalQuizzes': 0,
                'averageScore': 0,
                'recentPerformance': 0,
                'preparationLevel': 0,
                'consistencyScore': 0,
                'difficultyHandling': 0,
                'timeEfficiency': 0
            }
        
        return jsonify({
            'quizResults': quiz_results,
            'summary': summary,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error getting quiz results: {str(e)}")
        return jsonify({'error': 'Failed to get quiz results'}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_cwa():
    """Endpoint for CWA (Comprehensive Weighted Average) analysis"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        student_profile = data.get('studentProfile', {})
        courses = data.get('courses', [])
        behavior_metrics = data.get('behaviorMetrics', {})
        user_id = data.get('userId')
        
        # Get quiz results for enhanced analysis
        quiz_metrics = {'averageScore': 0, 'totalQuizzes': 0, 'preparationLevel': 0, 'consistencyScore': 0, 'difficultyHandling': 0}
        if user_id:
            try:
                quiz_results = list(quiz_results_collection.find({'userId': user_id}).sort('timestamp', -1).limit(20))
                if quiz_results:
                    total_quizzes = len(quiz_results)
                    avg_score = sum(r['percentage'] for r in quiz_results) / total_quizzes
                    
                    # Calculate preparation level
                    first_attempt_success = len([r for r in quiz_results if r.get('attemptsUsed', 1) == 1])
                    preparation_level = (first_attempt_success / total_quizzes) * 100
                    
                    # Calculate consistency
                    scores = [r['percentage'] for r in quiz_results]
                    variance = sum((x - avg_score) ** 2 for x in scores) / len(scores)
                    std_dev = variance ** 0.5
                    consistency_score = max(0, 100 - std_dev * 2)
                    
                    # Difficulty handling
                    hard_quizzes = [r for r in quiz_results if r.get('difficulty') == 'Hard']
                    difficulty_handling = (sum(r['percentage'] for r in hard_quizzes) / len(hard_quizzes)) if hard_quizzes else avg_score
                    
                    quiz_metrics = {
                        'averageScore': round(avg_score, 1),
                        'totalQuizzes': total_quizzes,
                        'preparationLevel': round(preparation_level, 1),
                        'consistencyScore': round(consistency_score, 1),
                        'difficultyHandling': round(difficulty_handling, 1)
                    }
            except Exception as e:
                print(f"Error getting quiz data for CWA analysis: {str(e)}")
        
        if not courses:
            return jsonify({'error': 'No courses provided for analysis'}), 400
        
        # Calculate current GPA
        total_quality_points = 0
        total_credit_hours = 0
        
        for course in courses:
            credit_hours = course.get('creditHours', 0)
            assignments = course.get('assignments', [])
            
            if assignments:
                # Calculate course score
                total_weighted_score = 0
                total_weight = 0
                
                for assignment in assignments:
                    score = assignment.get('score', 0)
                    max_score = assignment.get('maxScore', 100)
                    weight = assignment.get('weight', 1)
                    
                    percent_score = (score / max_score) * 100 if max_score > 0 else 0
                    total_weighted_score += percent_score * weight
                    total_weight += weight
                
                course_score = total_weighted_score / total_weight if total_weight > 0 else 0
                
                # Convert to GPA (4.0 scale)
                if course_score >= 90:
                    grade_point = 4.0
                elif course_score >= 80:
                    grade_point = 3.0
                elif course_score >= 70:
                    grade_point = 2.0
                elif course_score >= 60:
                    grade_point = 1.0
                else:
                    grade_point = 0.0
                
                total_quality_points += grade_point * credit_hours
                total_credit_hours += credit_hours
        
        current_gpa = total_quality_points / total_credit_hours if total_credit_hours > 0 else 0
        
        # Calculate projected GPA with AI insights
        projected_gpa_adjustment = 0.2  # Base improvement
        
        # Quiz-based adjustments
        if quiz_metrics:
            avg_quiz_score = quiz_metrics.get('averageScore', 0)
            preparation_level = quiz_metrics.get('preparationLevel', 0)
            consistency_score = quiz_metrics.get('consistencyScore', 0)
            difficulty_handling = quiz_metrics.get('difficultyHandling', 0)
            
            # Quiz performance contributes to prediction
            projected_gpa_adjustment += (avg_quiz_score / 100) * 0.4
            projected_gpa_adjustment += (preparation_level / 100) * 0.15
            projected_gpa_adjustment += (consistency_score / 100) * 0.1
            projected_gpa_adjustment += (difficulty_handling / 100) * 0.15
        
        # Behavior-based adjustments
        if behavior_metrics:
            study_consistency = behavior_metrics.get('studyConsistency', 0)
            procrastination_level = behavior_metrics.get('procrastinationLevel', 5)
            planner_usage = behavior_metrics.get('plannerUsage', 0)
            
            projected_gpa_adjustment += (study_consistency / 100) * 0.3
            projected_gpa_adjustment -= (procrastination_level / 10) * 0.15
            projected_gpa_adjustment += (planner_usage / 100) * 0.1
        
        # Profile-based adjustments
        if student_profile:
            motivation_level = student_profile.get('motivationLevel', 5)
            stress_level = student_profile.get('stressLevel', 5)
            study_hours = student_profile.get('studyHoursPerWeek', 10)
            
            projected_gpa_adjustment += (motivation_level / 10) * 0.2
            projected_gpa_adjustment -= ((stress_level - 5) / 10) * 0.1
            projected_gpa_adjustment += min(0.2, (study_hours / 40) * 0.2)
        
        projected_gpa = min(4.0, max(0, current_gpa + projected_gpa_adjustment))
        
        # Generate recommendations
        recommendations = []
        
        # Course-specific recommendations
        weak_courses = []
        strong_courses = []
        
        for course in courses:
            assignments = course.get('assignments', [])
            if assignments:
                total_weighted_score = 0
                total_weight = 0
                
                for assignment in assignments:
                    score = assignment.get('score', 0)
                    max_score = assignment.get('maxScore', 100)
                    weight = assignment.get('weight', 1)
                    
                    percent_score = (score / max_score) * 100 if max_score > 0 else 0
                    total_weighted_score += percent_score * weight
                    total_weight += weight
                
                course_score = total_weighted_score / total_weight if total_weight > 0 else 0
                
                if course_score < 70:
                    weak_courses.append(course.get('name', 'Unknown Course'))
                elif course_score >= 80:
                    strong_courses.append(course.get('name', 'Unknown Course'))
        
        # Generate personalized recommendations
        if student_profile:
            if student_profile.get('studyHoursPerWeek', 0) < 15:
                recommendations.append("📚 Increase your weekly study hours to 15-20 hours for better retention and understanding")
            
            if student_profile.get('stressLevel', 5) > 7:
                recommendations.append("🧘 Practice stress management techniques like meditation or regular breaks to improve focus")
            
            if student_profile.get('motivationLevel', 5) < 6:
                recommendations.append("💪 Set small, achievable daily goals to build momentum and motivation")
        
        if behavior_metrics:
            if behavior_metrics.get('studyConsistency', 0) < 60:
                recommendations.append("⏰ Establish a consistent daily study schedule to improve learning retention")
            
            if behavior_metrics.get('procrastinationLevel', 5) > 6:
                recommendations.append("🎯 Use the Pomodoro technique to break tasks into manageable chunks")
            
            if behavior_metrics.get('plannerUsage', 0) < 50:
                recommendations.append("📋 Use your planner more regularly to stay organized and track progress")
        
        if weak_courses:
            recommendations.append(f"📖 Focus additional effort on challenging courses: {', '.join(weak_courses[:3])}")
        
        # Add general recommendations if needed
        if len(recommendations) < 4:
            general_recommendations = [
                "📝 Review material within 24 hours of learning to improve retention",
                "👥 Form study groups with classmates for collaborative learning",
                "🎯 Practice active recall instead of passive reading",
                "💡 Seek help from professors during office hours when struggling",
                "📊 Track your progress weekly to stay motivated"
            ]
            
            for rec in general_recommendations:
                if len(recommendations) >= 6:
                    break
                if rec not in recommendations:
                    recommendations.append(rec)
        
        # Generate behavioral insights
        behavioral_insights = []
        
        if behavior_metrics:
            study_consistency = behavior_metrics.get('studyConsistency', 0)
            procrastination_level = behavior_metrics.get('procrastinationLevel', 5)
            
            if study_consistency > 80:
                behavioral_insights.append("Your consistent study pattern is a key strength - maintain this habit!")
            elif study_consistency < 40:
                behavioral_insights.append("Irregular study patterns may be limiting your potential - try to establish a routine")
            
            if procrastination_level < 3:
                behavioral_insights.append("Excellent self-discipline! You start tasks early and manage time well")
            elif procrastination_level > 7:
                behavioral_insights.append("High procrastination levels detected - consider time management strategies")
        
        # Prepare response
        analysis_result = {
            'currentGPA': round(current_gpa, 2),
            'projectedGPA': round(projected_gpa, 2),
            'recommendations': recommendations[:6],  # Limit to 6 recommendations
            'strongAreas': strong_courses if strong_courses else ["Continue building on your current progress"],
            'weakAreas': weak_courses if weak_courses else ["No significant weak areas identified"],
            'behavioralInsights': behavioral_insights,
            'improvementPotential': round(projected_gpa - current_gpa, 2),
            'analysisDate': datetime.now().isoformat()
        }
        
        return jsonify(analysis_result)
        
    except Exception as e:
        print(f"CWA Analysis error: {str(e)}")
        return jsonify({'error': 'Analysis failed. Please try again.'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
