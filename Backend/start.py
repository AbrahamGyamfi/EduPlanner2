#!/usr/bin/env python
"""
Render-specific startup script for EduMaster backend
This script ensures proper Gunicorn configuration for production deployment
"""

import os
from server import create_app

# Create the application instance
app = create_app()

if __name__ == "__main__":
    # For local development only
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)