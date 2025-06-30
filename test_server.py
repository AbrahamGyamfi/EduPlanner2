#!/usr/bin/env python3
"""
Minimal test server to debug Flask routing issues
"""
from flask import Flask, jsonify
import os

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Test server is working"})

@app.route('/slides')
def list_slides():
    return jsonify({"slides": [], "message": "Slides endpoint working"})

@app.route('/upload-slide', methods=['POST'])
def upload_slide():
    return jsonify({"message": "Upload endpoint working"})

@app.route('/health')
def health():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    print("Starting test server on port 5001...")
    app.run(host='127.0.0.1', port=5001, debug=True)
