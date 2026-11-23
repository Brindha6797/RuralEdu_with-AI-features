import os
import sys
# pyrefly: ignore [missing-import]
from flask import Blueprint, request, jsonify, session
# pyrefly: ignore [missing-import]
from werkzeug.security import generate_password_hash, check_password_hash

# Add parent directory to path so 'backend' package can be imported correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.database.db import get_db_connection

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    role = data.get('role')
    name = data.get('name', '').strip()
    email = data.get('email', '').strip() or None
    phone = data.get('phone_number', '').strip() or data.get('phone', '').strip() or None
    password = data.get('password', '')
    
    if not role or not name or not password:
        return jsonify({"error": "Name, password and role are required"}), 400
        
    if role in ['Admin', 'Parent'] and not phone:
        return jsonify({"error": "Phone number is required"}), 400
        
    if role not in ['Admin', 'Student', 'Parent']:
        return jsonify({"error": "Invalid role specified"}), 400

    # Role-specific fields validation
    student_class = data.get('class', '').strip() or data.get('class_name', '').strip()
    primary_parent_phone = data.get('primary_parent_phone', '').strip() or data.get('parent_phone_number', '').strip()
    secondary_parent_phone = data.get('secondary_parent_phone', '').strip() or data.get('second_parent_phone_number', '').strip() or None
    
    if role == 'Student':
        if not student_class or not primary_parent_phone:
            return jsonify({"error": "Class and parent phone number are required for students"}), 400
            
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if parent account already exists for parent role
        if role == 'Parent' and phone:
            cursor.execute("SELECT * FROM parents WHERE phone = %s", (phone,))
            if cursor.fetchone():
                return jsonify({"error": "Parent account already exists."}), 409
            cursor.execute("SELECT * FROM users WHERE phone = %s AND role = 'Parent'", (phone,))
            if cursor.fetchone():
                return jsonify({"error": "Parent account already exists."}), 409

        # Check if phone already exists in users
        if phone:
            cursor.execute("SELECT * FROM users WHERE phone = %s AND role = %s", (phone, role))
            if cursor.fetchone():
                return jsonify({"error": f"{role} account already exists."}), 409
            
        if email:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                return jsonify({"error": "Email is already registered"}), 409
                
        hashed_password = generate_password_hash(password)
        
        # 1. Insert into users table
        cursor.execute("""
            INSERT INTO users (name, email, phone, password, role)
            VALUES (%s, %s, %s, %s, %s)
        """, (name, email, phone, hashed_password, role))
        user_id = cursor.lastrowid
        
        # 2. Insert into role-specific tables
        if role == 'Student':
            cursor.execute("""
                INSERT INTO students (user_id, class, primary_parent_phone, secondary_parent_phone)
                VALUES (%s, %s, %s, %s)
            """, (user_id, student_class, primary_parent_phone, secondary_parent_phone))
            student_id = cursor.lastrowid
            
            # Auto-initialize progress entry
            cursor.execute("""
                INSERT INTO progress (student_id, progress)
                VALUES (%s, %s)
            """, (student_id, '{"completed_topics": [], "quiz_scores": {}}'))
            
        elif role == 'Parent':
            cursor.execute("""
                INSERT INTO parents (user_id, phone)
                VALUES (%s, %s)
            """, (user_id, phone))
            
        conn.commit()
        return jsonify({
            "message": f"{role} registered successfully",
            "user": {"user_id": user_id, "name": name, "email": email, "role": role}
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('identifier', '').strip() # Can be email or phone number
    password = data.get('password', '')
    role = data.get('role')
    
    if not identifier or not password or not role:
        return jsonify({"error": "Identifier, password, and role are required"}), 400
        
    if role not in ['Admin', 'Student', 'Parent']:
        return jsonify({"error": "Invalid role specified"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Search by email OR phone number matching the specific role
        cursor.execute("""
            SELECT * FROM users 
            WHERE (email = %s OR phone = %s) AND role = %s
        """, (identifier, identifier, role))
        
        user = cursor.fetchone()
        
        if not user or not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid credentials"}), 401
            
        # Success - populate session details
        session['user_id'] = user['user_id']
        session['role'] = user['role']
        session['name'] = user['name']
        session['email'] = user['email']
        session['phone'] = user['phone']
        
        # Get specific sub-profile ID if student or parent
        profile_data = {}
        if role == 'Student':
            cursor.execute("SELECT student_id, class FROM students WHERE user_id = %s", (user['user_id'],))
            s_res = cursor.fetchone()
            if s_res:
                session['student_id'] = s_res['student_id']
                session['class'] = s_res['class']
                profile_data = s_res
        elif role == 'Parent':
            cursor.execute("SELECT parent_id, phone FROM parents WHERE user_id = %s", (user['user_id'],))
            p_res = cursor.fetchone()
            if p_res:
                session['parent_id'] = p_res['parent_id']
                profile_data = p_res
                
        return jsonify({
            "message": "Login successful",
            "user": {
                "user_id": user['user_id'],
                "name": user['name'],
                "email": user['email'],
                "phone": user['phone'],
                "role": user['role'],
                **profile_data
            }
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Login failed: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route('/session', methods=['GET'])
def get_session():
    """Verify if session is valid and return logged-in user data."""
    if 'user_id' in session:
        return jsonify({
            "logged_in": True,
            "user": {
                "user_id": session.get('user_id'),
                "role": session.get('role'),
                "name": session.get('name'),
                "email": session.get('email'),
                "phone": session.get('phone'),
                "student_id": session.get('student_id'),
                "parent_id": session.get('parent_id'),
                "class": session.get('class')
            }
        }), 200
    return jsonify({"logged_in": False}), 200
