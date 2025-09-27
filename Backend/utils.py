"""
Utility functions for EduMaster application.
This module provides common validation and helper functions.
"""

import re
import logging

logger = logging.getLogger(__name__)

def validate_input(data, required_fields, field_max_lengths=None):
    """
    Validate input data against required fields with customizable length limits.
    
    Args:
        data (dict): The input data to validate
        required_fields (list): List of required field names
        field_max_lengths (dict): Optional dict mapping field names to max lengths
    
    Returns:
        list: List of validation error messages
    """
    errors = []
    
    # Default max lengths for different field types
    default_max_lengths = {
        'summary': 50000,  # Allow up to 50,000 characters for summaries
        'description': 2000,  # Allow longer descriptions
        'content': 50000,  # Allow long content fields
        'text': 50000,  # Allow long text fields
    }
    
    # Merge with provided field_max_lengths
    if field_max_lengths:
        default_max_lengths.update(field_max_lengths)
    
    for field in required_fields:
        if field not in data or not data[field] or not data[field].strip():
            errors.append(f"{field} is required")
        else:
            # Determine max length for this field
            max_length = default_max_lengths.get(field, 255)  # Default to 255 for other fields
            
            if len(data[field].strip()) > max_length:
                errors.append(f"{field} is too long (max {max_length} characters)")
    
    return errors

def validate_password(password):
    """
    Validate password strength according to security requirements.
    
    Args:
        password (str): The password to validate
    
    Returns:
        tuple: (is_valid: bool, message: str)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:"\\|,.<>\/?]', password):
        return False, "Password must contain at least one special character"
    
    return True, "Password is valid"

def validate_email(email):
    """
    Validate email format using regex pattern.
    
    Args:
        email (str): The email address to validate
    
    Returns:
        bool: True if email format is valid, False otherwise
    """
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(email_pattern, email))

def sanitize_string(input_string, max_length=255):
    """
    Sanitize and clean input strings.
    
    Args:
        input_string (str): The string to sanitize
        max_length (int): Maximum allowed length
    
    Returns:
        str: Sanitized string
    """
    if not isinstance(input_string, str):
        return ""
    
    # Strip whitespace and limit length
    sanitized = input_string.strip()[:max_length]
    
    return sanitized

def get_client_ip(request):
    """
    Get client IP address from Flask request object.
    
    Args:
        request: Flask request object
    
    Returns:
        str: Client IP address
    """
    return request.environ.get('HTTP_X_FORWARDED_FOR', 
                              request.environ.get('REMOTE_ADDR', 'unknown'))

def format_file_size(size_bytes):
    """
    Format file size in bytes to human readable format.
    
    Args:
        size_bytes (int): Size in bytes
    
    Returns:
        str: Formatted size string
    """
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"

def allowed_file(filename, allowed_extensions):
    """
    Check if file extension is allowed.
    
    Args:
        filename (str): The filename to check
        allowed_extensions (set): Set of allowed extensions
    
    Returns:
        bool: True if file extension is allowed
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def clean_json_response(response_text):
    """
    Clean JSON response text by removing markdown code blocks.
    
    Args:
        response_text (str): Raw response text
    
    Returns:
        str: Cleaned JSON string
    """
    response_text = response_text.strip()
    
    # Remove markdown code blocks if present
    if response_text.startswith('```json'):
        response_text = response_text[7:-3]
    elif response_text.startswith('```'):
        response_text = response_text[3:-3]
    
    return response_text.strip()

def safe_int_conversion(value, default=0):
    """
    Safely convert value to integer with default fallback.
    
    Args:
        value: Value to convert
        default (int): Default value if conversion fails
    
    Returns:
        int: Converted integer or default value
    """
    try:
        return int(value)
    except (ValueError, TypeError):
        return default

def safe_float_conversion(value, default=0.0):
    """
    Safely convert value to float with default fallback.
    
    Args:
        value: Value to convert
        default (float): Default value if conversion fails
    
    Returns:
        float: Converted float or default value
    """
    try:
        return float(value)
    except (ValueError, TypeError):
        return default

def log_user_action(user_id, action, details=None):
    """
    Log user action for auditing purposes.
    
    Args:
        user_id: User identifier
        action (str): Action description
        details (dict): Additional details
    """
    log_message = f"User {user_id} performed action: {action}"
    if details:
        log_message += f" - Details: {details}"
    
    logger.info(log_message)

class ConfigHelper:
    """Helper class for configuration management"""
    
    @staticmethod
    def get_env_list(env_var, default=None, separator=','):
        """
        Get environment variable as a list.
        
        Args:
            env_var (str): Environment variable name
            default (list): Default value if not found
            separator (str): String separator
        
        Returns:
            list: List of values
        """
        import os
        value = os.getenv(env_var)
        if not value:
            return default or []
        
        return [item.strip() for item in value.split(separator) if item.strip()]
    
    @staticmethod
    def get_env_bool(env_var, default=False):
        """
        Get environment variable as boolean.
        
        Args:
            env_var (str): Environment variable name
            default (bool): Default value if not found
        
        Returns:
            bool: Boolean value
        """
        import os
        value = os.getenv(env_var, '').lower()
        return value in ('true', '1', 'yes', 'on') if value else default
    
    @staticmethod
    def get_env_int(env_var, default=0):
        """
        Get environment variable as integer.
        
        Args:
            env_var (str): Environment variable name
            default (int): Default value if not found
        
    Returns:
            int: Integer value
        """
        import os
        value = os.getenv(env_var)
        return safe_int_conversion(value, default)
