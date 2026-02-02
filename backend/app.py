"""
Flask backend API for the community-driven platform.
Authentication, welcome content from database, and health check.
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from datetime import datetime
from dotenv import load_dotenv
from services.welcome_service import get_welcome_message
from services.auth_service import authenticate_user

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        user = authenticate_user(username, password)
        
        if user:
            return jsonify({
                'success': True,
                'user': user
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/welcome', methods=['GET'])
def get_welcome():
    """Get welcome message from database"""
    try:
        data = get_welcome_message()
        
        if data:
            return jsonify({
                'title': data['title'],
                'message': data['message'],
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({'error': 'No welcome message found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'python-backend'}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=port, debug=False)
