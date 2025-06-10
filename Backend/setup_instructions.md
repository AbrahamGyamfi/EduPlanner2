# Setup Instructions for EduPlanner Backend

## Python Version
This project works best with Python 3.9-3.11. If you're using Python 3.13, you may encounter compatibility issues with some libraries.

## Virtual Environment Setup
It's recommended to use a virtual environment to avoid package conflicts:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Starting the Backend Server
After installing dependencies, start the server with:

```bash
python server.py
```

The server will be available at http://localhost:5000

## Troubleshooting

If you encounter the error "cannot import name 'url_quote' from 'werkzeug.urls'", try these solutions:

1. Downgrade Python to version 3.9-3.11
2. Or install Flask with its dependencies manually:
   ```
   pip install flask==2.3.3 werkzeug==2.3.7
   ```

3. Or use an earlier version of Werkzeug that's compatible with your Flask version:
   ```
   pip install werkzeug==2.2.3
   ```
