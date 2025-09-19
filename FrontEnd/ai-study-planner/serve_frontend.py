#!/usr/bin/env python3
"""
Simple server to serve React development files
This is a temporary solution until Node.js is installed
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 3000
DIRECTORY = "public"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    print("🚀 Starting EduMaster Frontend Server...")
    print(f"📁 Serving directory: {DIRECTORY}")
    print(f"🌐 Port: {PORT}")
    print(f"🔗 URL: http://localhost:{PORT}")
    print("\n⚠️  NOTE: This is a basic static server.")
    print("   For full React functionality, install Node.js and run 'npm start'")
    print("\n📥 To install Node.js:")
    print("   1. Go to https://nodejs.org/")
    print("   2. Download and install the LTS version")
    print("   3. Then run: npm start")
    print("\n" + "="*50)
    
    try:
        # Change to the directory containing the public folder
        os.chdir(Path(__file__).parent)
        
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"✅ Server running at http://localhost:{PORT}")
            print("📋 Press Ctrl+C to stop the server")
            
            # Try to open browser automatically
            try:
                webbrowser.open(f'http://localhost:{PORT}')
                print("🌐 Opening browser automatically...")
            except:
                print("⚠️  Could not open browser automatically")
                print(f"   Please open http://localhost:{PORT} manually")
            
            print("\n🔄 Server is running...")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Server stopped by user")
    except Exception as e:
        print(f"\n❌ Error starting server: {e}")
        print("\n💡 Alternative: Install Node.js and run 'npm start'")

if __name__ == "__main__":
    main()
