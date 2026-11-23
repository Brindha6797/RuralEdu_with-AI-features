import os
import sys

# Add parent directory to path so 'backend' package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# pyrefly: ignore [missing-import]
from flask import Flask, jsonify
from flask_cors import CORS
from backend.database.db import init_db
from backend.routes.auth import auth_bp
from backend.routes.user import user_bp
from backend.routes.course import course_bp
from backend.routes.progress import progress_bp
from backend.routes.admin import admin_bp

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'ruraledu_review2_development_secret_key_12345')
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Enable CORS for React dev server on port 5173 with credentials support
CORS(
    app,
    resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}},
    supports_credentials=True
)

# Register Blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(course_bp)
app.register_blueprint(progress_bp)
app.register_blueprint(admin_bp)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "RuralEdu AI Backend"}), 200

if __name__ == '__main__':
    # Initialize the database and seed it on start
    print("Initializing Database...")
    init_db()
    
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting RuralEdu AI Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
