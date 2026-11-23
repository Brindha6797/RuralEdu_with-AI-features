import os
import sys
import json
from flask import Blueprint, request, jsonify, session

# Add parent directory to path so 'backend' package can be imported correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.database.db import get_db_connection

course_bp = Blueprint('course', __name__)

@course_bp.route('/add-course', methods=['POST'])
def add_course():
    # Only Admin should be allowed
    if 'user_id' not in session or session.get('role') != 'Admin':
        return jsonify({"error": "Access denied. Admins only."}), 403
        
    data = request.get_json() or {}
    class_val = data.get('class', '').strip() or data.get('class_name', '').strip()
    subject_val = data.get('subject', '').strip() or data.get('subject_name', '').strip()
    chapter = data.get('chapter', '').strip()
    topic = data.get('topic', '').strip()
    
    if not class_val or not subject_val or not chapter or not topic:
        return jsonify({"error": "class, subject, chapter, and topic are required."}), 400
        
    # Optional learning content fields
    notes = data.get('notes', '').strip()
    summary = data.get('summary', '').strip()
    quiz = data.get('quiz', []) # Should be a list/array of question objects
    assignment = data.get('assignment', '').strip()
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Ensure hierarchy
        cursor.execute("INSERT IGNORE INTO classes (class_name) VALUES (%s)", (class_val,))
        cursor.execute("INSERT IGNORE INTO subjects (class_name, subject_name) VALUES (%s, %s)", (class_val, subject_val))
        cursor.execute("INSERT IGNORE INTO chapters (class_name, subject_name, chapter_name) VALUES (%s, %s, %s)", (class_val, subject_val, chapter))
        
        quiz_json = json.dumps(quiz)
        
        # Insert into topics table
        cursor.execute("""
            INSERT INTO topics (class_name, subject_name, chapter_name, topic_name, notes, summary, quiz, assignment)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (class_val, subject_val, chapter, topic, notes, summary, quiz_json, assignment))
        course_id = cursor.lastrowid
        
        # Also keep courses table in sync
        try:
            cursor.execute("""
                INSERT INTO courses (class, subject, chapter, topic, notes, summary, quiz, assignment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (class_val, subject_val, chapter, topic, notes, summary, quiz_json, assignment))
        except Exception as ex_sync:
            print(f"Notice: failed to sync add-course to legacy courses table: {ex_sync}")
        
        conn.commit()
        return jsonify({
            "message": "Course added successfully",
            "course_id": course_id
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to add course: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@course_bp.route('/courses', methods=['GET'])
def get_courses():
    class_filter = request.args.get('class') or request.args.get('class_name')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT topic_id AS course_id, class_name AS class, subject_name AS subject, 
                   chapter_name AS chapter, topic_name AS topic, notes, summary, quiz, assignment
            FROM topics
        """
        params = ()
        if class_filter:
            query += " WHERE class_name = %s"
            params = (class_filter,)
            
        cursor.execute(query, params)
        courses = cursor.fetchall()
        
        # Deserialize quiz fields from JSON strings back into objects
        for course in courses:
            if course.get('quiz'):
                try:
                    course['quiz'] = json.loads(course['quiz'])
                except Exception:
                    course['quiz'] = []
            else:
                course['quiz'] = []
                
        return jsonify({"courses": courses}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to fetch courses: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()
