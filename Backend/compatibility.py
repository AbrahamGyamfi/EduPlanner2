"""
Backward compatibility module for EduMaster application.
This module provides compatibility routes for the frontend that still uses old endpoint names.
"""

import os
import logging
from flask import request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

def register_compatibility_routes(app):
    """Register backward compatibility routes with the Flask app"""
    
    # Import the actual handlers from other modules
    from file_handler import register_file_routes
    from database import files_collection
    
    # Get the upload folder configuration
    UPLOAD_FOLDER = os.path.join(os.getcwd(), os.getenv('UPLOAD_FOLDER', 'uploads'))
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    @app.route('/upload-slide', methods=['POST'])
    def upload_slide_compat():
        """Backward compatibility route for /upload-slide -> /upload"""
        try:
            if 'file' not in request.files:
                return jsonify({'error': 'No file uploaded'}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            
            # Get additional data from form (with defaults for compatibility)
            user_id = request.form.get('user_id', 'anonymous')
            course_id = request.form.get('course_id', 'general')
            
            # Process the upload using the existing upload logic
            # Import the upload function from file_handler
            from file_handler import FileProcessor
            from utils import allowed_file
            
            ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'ppt', 'pptx', 'txt', 'docx'}
            
            if file and allowed_file(file.filename, ALLOWED_EXTENSIONS):
                filename = secure_filename(file.filename)
                
                # Generate unique filename to prevent conflicts
                from datetime import datetime
                base_name, extension = os.path.splitext(filename)
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                unique_filename = f"{base_name}_{timestamp}{extension}"
                
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                
                # Get file info
                file_size = os.path.getsize(file_path)
                file_extension = filename.rsplit('.', 1)[1].lower()
                
                # Extract text based on file type
                extracted_text = FileProcessor.extract_text_by_extension(file_path, file_extension)
                
                if not extracted_text.strip():
                    extracted_text = "No text could be extracted from this file."
                    logger.warning(f"No text extracted from file: {filename}")
                
                # Store file metadata in database
                file_metadata = {
                    'filename': unique_filename,
                    'original_filename': file.filename,
                    'file_path': file_path,
                    'file_size': file_size,
                    'file_extension': file_extension,
                    'extracted_text': extracted_text,
                    'user_id': user_id,
                    'course_id': course_id,
                    'upload_date': datetime.now(),
                    'is_active': True
                }
                
                result = files_collection.insert_one(file_metadata)
                file_id = str(result.inserted_id)
                
                logger.info(f"File uploaded successfully via compatibility route: {file.filename}")
                
                # Return response in format expected by old frontend
                return jsonify({
                    'status': 'success',
                    'message': 'File uploaded successfully',
                    'filename': unique_filename,
                    'file_id': file_id,
                    'original_filename': file.filename,
                    'extracted_text': extracted_text[:500] + "..." if len(extracted_text) > 500 else extracted_text
                }), 201
            
            return jsonify({'error': 'Invalid file type. Allowed types: PDF, PPT, PPTX, PNG, JPG, JPEG, TXT, DOCX'}), 400
            
        except Exception as e:
            logger.error(f"Error in compatibility upload route: {str(e)}")
            return jsonify({'error': 'Internal server error during file upload'}), 500
    
    @app.route('/slides', methods=['GET'])
    def list_slides_compat():
        """Backward compatibility route for /slides -> list uploaded files"""
        try:
            # Get query parameters
            user_id = request.args.get('user_id')
            course_id = request.args.get('course_id')
            
            # Build query - if no specific filters, show all active files
            query = {
                'is_active': True
            }
            
            if user_id:
                query['user_id'] = user_id
            if course_id and course_id != 'all':
                query['course_id'] = course_id
                
            files = files_collection.find(query).sort('upload_date', -1)
            
            # Convert to format expected by old frontend (list of filenames)
            slide_list = []
            for file in files:
                slide_list.append(file['filename'])
            
            logger.info(f"Listed {len(slide_list)} files")
            
            return jsonify({
                'slides': slide_list,
                'total': len(slide_list)
            })
            
        except Exception as e:
            logger.error(f"Error retrieving slides: {str(e)}")
            return jsonify({'error': 'Error retrieving slides'}), 500
    
    @app.route('/slides/<filename>', methods=['GET'])
    def get_slide_file_compat(filename):
        """Backward compatibility route to serve uploaded files"""
        try:
            # Security check - ensure filename is safe
            safe_filename = secure_filename(filename)
            file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
            
            if not os.path.exists(file_path):
                # Try to find the file by original filename in database
                file_record = files_collection.find_one({
                    'original_filename': filename,
                    'is_active': True
                })
                
                if file_record and os.path.exists(file_record['file_path']):
                    return send_from_directory(
                        os.path.dirname(file_record['file_path']),
                        os.path.basename(file_record['file_path'])
                    )
                
                logger.error(f"File not found: {file_path}")
                return jsonify({'error': 'File not found'}), 404
            
            return send_from_directory(UPLOAD_FOLDER, safe_filename)
            
        except Exception as e:
            logger.error(f"Error serving file {filename}: {str(e)}")
            return jsonify({'error': 'Error serving file'}), 500
    
    @app.route('/slides/<filename>', methods=['DELETE'])
    def delete_slide_compat(filename):
        """Backward compatibility route to delete uploaded files"""
        try:
            # Find the file in database
            file_record = files_collection.find_one({
                '$or': [
                    {'filename': filename},
                    {'original_filename': filename}
                ],
                'is_active': True
            })
            
            if not file_record:
                return jsonify({'error': 'File not found'}), 404
            
            # Mark file as inactive (soft delete)
            from datetime import datetime
            result = files_collection.update_one(
                {'_id': file_record['_id']},
                {'$set': {'is_active': False, 'deleted_at': datetime.now()}}
            )
            
            if result.modified_count > 0:
                # Optionally, delete physical file
                try:
                    if os.path.exists(file_record['file_path']):
                        os.remove(file_record['file_path'])
                except Exception as e:
                    logger.warning(f"Could not delete physical file: {e}")
                
                logger.info(f"File deleted via compatibility route: {filename}")
                return jsonify({
                    'status': 'success',
                    'message': 'File deleted successfully'
                })
            else:
                return jsonify({'error': 'Failed to delete file'}), 500
                
        except Exception as e:
            logger.error(f"Error deleting file {filename}: {str(e)}")
            return jsonify({'error': 'Error deleting file'}), 500
    
    logger.info("Backward compatibility routes registered successfully")
