import os
import sys
import json
# pyrefly: ignore [missing-import]
from flask import Blueprint, request, jsonify, session

# Add parent directory to path so 'backend' package can be imported correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.database.db import get_db_connection

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/student/progress', methods=['GET'])
@progress_bp.route('/student-progress', methods=['GET'])
def get_student_progress():
    if 'user_id' not in session or session.get('role') != 'Student':
        return jsonify({"error": "Unauthorized"}), 401
        
    student_id = session.get('student_id')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM progress WHERE student_id = %s", (student_id,))
        prog_row = cursor.fetchone()
        progress_data = {"completed_topics": [], "quiz_scores": {}}
        if prog_row:
            try:
                progress_data = json.loads(prog_row['progress'])
            except Exception:
                pass
        return jsonify({"progress": progress_data}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve student progress: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@progress_bp.route('/parent/student', methods=['GET'])
def get_parent_student():
    if 'user_id' not in session or session.get('role') != 'Parent':
        return jsonify({"error": "Unauthorized"}), 401
        
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # Fetch parent phone
        cursor.execute("SELECT parent_id, phone FROM parents WHERE user_id = %s", (user_id,))
        parent = cursor.fetchone()
        if not parent:
            return jsonify({"error": "Parent profile not found"}), 404
            
        parent_phone = parent['phone']
        
        # Link children
        cursor.execute("""
            SELECT s.student_id, u.name, s.class, u.email, u.phone
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.primary_parent_phone = %s OR s.secondary_parent_phone = %s
        """, (parent_phone, parent_phone))
        children = cursor.fetchall()
        
        if not children:
            return jsonify({
                "message": "No child available",
                "children": []
            }), 200
            
        enriched_children = []
        for child in children:
            # Fetch courses for child's class
            cursor.execute("""
                SELECT topic_id AS course_id, class_name AS class, subject_name AS subject, 
                       chapter_name AS chapter, topic_name AS topic
                FROM topics WHERE class_name = %s
            """, (child['class'],))
            courses = cursor.fetchall()
            
            # Fetch child progress
            cursor.execute("SELECT * FROM progress WHERE student_id = %s", (child['student_id'],))
            prog_row = cursor.fetchone()
            
            progress_data = {"completed_topics": [], "quiz_scores": {}}
            if prog_row:
                try:
                    progress_data = json.loads(prog_row['progress'])
                except Exception:
                    pass
            enriched_children.append({
                "profile": child,
                "courses": courses,
                "progress": progress_data
            })
            
        return jsonify({"children": enriched_children}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve parent students: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@progress_bp.route('/student/dashboard', methods=['GET'])
def get_student_dashboard():
    if 'user_id' not in session or session.get('role') != 'Student':
        return jsonify({"error": "Unauthorized"}), 401
        
    user_id = session['user_id']
    student_id = session.get('student_id')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Fetch Student profile info
        cursor.execute("""
            SELECT u.name, u.email, u.phone, s.student_id, s.class, s.primary_parent_phone, s.secondary_parent_phone
            FROM users u
            JOIN students s ON u.user_id = s.user_id
            WHERE u.user_id = %s
        """, (user_id,))
        profile = cursor.fetchone()
        
        if not profile:
            return jsonify({"error": "Student profile not found"}), 404
            
        student_id = profile['student_id']
        student_class = profile['class']
        
        # 2. Fetch syllabus courses matching class
        cursor.execute("""
            SELECT topic_id AS course_id, class_name AS class, subject_name AS subject, 
                   chapter_name AS chapter, topic_name AS topic, notes, summary, quiz, assignment
            FROM topics
            WHERE class_name = %s
        """, (student_class,))
        courses = cursor.fetchall()
        for c in courses:
            if c.get('quiz'):
                try:
                    c['quiz'] = json.loads(c['quiz'])
                except Exception:
                    c['quiz'] = []
            else:
                c['quiz'] = []
                
        # 3. Fetch progress details
        cursor.execute("SELECT * FROM progress WHERE student_id = %s", (student_id,))
        prog_row = cursor.fetchone()
        
        progress_data = {"completed_topics": [], "quiz_scores": {}}
        if prog_row:
            try:
                progress_data = json.loads(prog_row['progress'])
            except Exception:
                pass
                
        return jsonify({
            "profile": profile,
            "courses": courses,
            "progress": progress_data
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve student dashboard: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@progress_bp.route('/parent/dashboard', methods=['GET'])
def get_parent_dashboard():
    if 'user_id' not in session or session.get('role') != 'Parent':
        return jsonify({"error": "Unauthorized"}), 401
        
    user_id = session['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # 1. Fetch parent phone number
        cursor.execute("SELECT parent_id, phone FROM parents WHERE user_id = %s", (user_id,))
        parent = cursor.fetchone()
        
        if not parent:
            return jsonify({"error": "Parent profile not found"}), 404
            
        parent_phone = parent['phone']
        
        # 2. Link child/children matching primary_parent_phone or secondary_parent_phone
        cursor.execute("""
            SELECT s.student_id, u.name, s.class, u.email, u.phone
            FROM students s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.primary_parent_phone = %s OR s.secondary_parent_phone = %s
        """, (parent_phone, parent_phone))
        children = cursor.fetchall()
        
        if not children:
            return jsonify({
                "message": "No child available",
                "children": []
            }), 200
            
        # 3. Enrich children profiles with course & progress data
        enriched_children = []
        for child in children:
            # Fetch courses for child's class
            cursor.execute("""
                SELECT topic_id AS course_id, class_name AS class, subject_name AS subject, 
                       chapter_name AS chapter, topic_name AS topic
                FROM topics WHERE class_name = %s
            """, (child['class'],))
            courses = cursor.fetchall()
            
            # Fetch child progress
            cursor.execute("SELECT * FROM progress WHERE student_id = %s", (child['student_id'],))
            prog_row = cursor.fetchone()
            
            progress_data = {"completed_topics": [], "quiz_scores": {}}
            if prog_row:
                try:
                    progress_data = json.loads(prog_row['progress'])
                except Exception:
                    pass
                    
            enriched_children.append({
                "profile": child,
                "courses": courses,
                "progress": progress_data
            })
            
        return jsonify({
            "parent": {
                "name": session.get('name'),
                "phone": parent_phone,
                "email": session.get('email')
            },
            "children": enriched_children
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve parent dashboard: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@progress_bp.route('/admin/dashboard', methods=['GET'])
def get_admin_dashboard():
    if 'user_id' not in session or session.get('role') != 'Admin':
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Count students
        cursor.execute("SELECT COUNT(*) as cnt FROM students")
        total_students = cursor.fetchone()['cnt']
        
        # Count parents
        cursor.execute("SELECT COUNT(*) as cnt FROM parents")
        total_parents = cursor.fetchone()['cnt']
        
        # Fetch all student users list
        cursor.execute("""
            SELECT u.user_id, u.name, u.email, u.phone, s.student_id, s.class, s.primary_parent_phone
            FROM users u
            JOIN students s ON u.user_id = s.user_id
        """)
        students = cursor.fetchall()
        
        # Fetch all parent users list
        cursor.execute("""
            SELECT u.user_id, u.name, u.email, u.phone, p.parent_id
            FROM users u
            JOIN parents p ON u.user_id = p.user_id
        """)
        parents = cursor.fetchall()
        
        # Fetch all courses list from topics
        cursor.execute("""
            SELECT topic_id AS course_id, class_name AS class, subject_name AS subject, 
                   chapter_name AS chapter, topic_name AS topic, notes, summary, quiz, assignment
            FROM topics
        """)
        courses = cursor.fetchall()
        for c in courses:
            if c.get('quiz'):
                try:
                    c['quiz'] = json.loads(c['quiz'])
                except Exception:
                    c['quiz'] = []
            else:
                c['quiz'] = []
        
        # Fetch classes
        cursor.execute("SELECT class_id, class_name FROM classes ORDER BY class_name")
        classes = cursor.fetchall()
        
        # Fetch subjects
        cursor.execute("SELECT subject_id, class_name, subject_name FROM subjects ORDER BY class_name, subject_name")
        subjects = cursor.fetchall()
        
        # Fetch chapters
        cursor.execute("SELECT chapter_id, class_name, subject_name, chapter_name FROM chapters ORDER BY class_name, subject_name, chapter_name")
        chapters = cursor.fetchall()
        
        return jsonify({
            "total_students": total_students,
            "total_parents": total_parents,
            "students": students,
            "parents": parents,
            "courses": courses,
            "classes": classes,
            "subjects": subjects,
            "chapters": chapters
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve admin dashboard: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@progress_bp.route('/update-progress', methods=['POST'])
def update_progress():
    if 'user_id' not in session or session.get('role') != 'Student':
        return jsonify({"error": "Access denied. Students only."}), 403
        
    student_id = session.get('student_id')
    data = request.get_json() or {}
    course_id = data.get('course_id')
    score = data.get('score')
    
    if not course_id:
        return jsonify({"error": "course_id is required"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT * FROM progress WHERE student_id = %s", (student_id,))
        row = cursor.fetchone()
        
        progress_data = {"completed_topics": [], "quiz_scores": {}}
        
        if row:
            try:
                progress_data = json.loads(row['progress'])
            except Exception:
                pass
                
        # Append completed course topic ID
        if int(course_id) not in progress_data["completed_topics"]:
            progress_data["completed_topics"].append(int(course_id))
            
        # If score is provided, save quiz score
        if score is not None:
            if "quiz_scores" not in progress_data:
                progress_data["quiz_scores"] = {}
            progress_data["quiz_scores"][str(course_id)] = int(score)
            
        progress_json = json.dumps(progress_data)
        
        if row:
            cursor.execute("""
                UPDATE progress SET progress = %s WHERE student_id = %s
            """, (progress_json, student_id))
        else:
            cursor.execute("""
                INSERT INTO progress (student_id, progress) VALUES (%s, %s)
            """, (student_id, progress_json))
            
        conn.commit()
        return jsonify({"message": "Progress recorded successfully", "progress": progress_data}), 200
        
    except Exception as e:
        conn.rollback()
        return jsonify({"error": f"Failed to save progress: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()
