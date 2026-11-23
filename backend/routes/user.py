import os
import sys
# pyrefly: ignore [missing-import]
from flask import Blueprint, jsonify, session

# Add parent directory to path so 'backend' package can be imported correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.database.db import get_db_connection

user_bp = Blueprint('user', __name__)

@user_bp.route('/profile', methods=['GET'])
def get_profile():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
        
    user_id = session['user_id']
    role = session['role']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Load user basic info
        cursor.execute("SELECT user_id, name, email, phone, role FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Enrich profile with role-specific details
        if role == 'Student':
            cursor.execute("""
                SELECT student_id, class, primary_parent_phone, secondary_parent_phone 
                FROM students WHERE user_id = %s
            """, (user_id,))
            student_details = cursor.fetchone()
            if student_details:
                user.update(student_details)
        elif role == 'Parent':
            cursor.execute("SELECT parent_id, phone FROM parents WHERE user_id = %s", (user_id,))
            parent_details = cursor.fetchone()
            if parent_details:
                user.update(parent_details)
                
        return jsonify({"profile": user}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve profile: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@user_bp.route('/student/profile', methods=['GET'])
def get_student_profile():
    if 'user_id' not in session or session.get('role') != 'Student':
        return jsonify({"error": "Unauthorized. Student only."}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT user_id, name, email, phone, role FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        cursor.execute("""
            SELECT student_id, class, primary_parent_phone, secondary_parent_phone 
            FROM students WHERE user_id = %s
        """, (user_id,))
        student_details = cursor.fetchone()
        if student_details:
            user.update(student_details)
            
        return jsonify({"profile": user}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve student profile: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@user_bp.route('/parent/profile', methods=['GET'])
def get_parent_profile():
    if 'user_id' not in session or session.get('role') != 'Parent':
        return jsonify({"error": "Unauthorized. Parent only."}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT user_id, name, email, phone, role FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        cursor.execute("SELECT parent_id, phone FROM parents WHERE user_id = %s", (user_id,))
        parent_details = cursor.fetchone()
        if parent_details:
            user.update(parent_details)
            
        return jsonify({"profile": user}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve parent profile: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

