import os
import sys
import json
from flask import Blueprint, request, jsonify, session
from werkzeug.security import generate_password_hash

# Add parent directory to path so 'backend' package can be imported correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from backend.database.db import get_db_connection

admin_bp = Blueprint('admin', __name__)

def is_admin():
    return session.get('role') == 'Admin'

# Helper to automatically sync Class, Subject, Chapter structure
def ensure_hierarchy(cursor, class_name, subject_name=None, chapter_name=None):
    if class_name:
        cursor.execute("INSERT IGNORE INTO classes (class_name) VALUES (%s)", (class_name,))
    if class_name and subject_name:
        cursor.execute("""
            INSERT IGNORE INTO subjects (class_name, subject_name)
            VALUES (%s, %s)
        """, (class_name, subject_name))
    if class_name and subject_name and chapter_name:
        cursor.execute("""
            INSERT IGNORE INTO chapters (class_name, subject_name, chapter_name)
            VALUES (%s, %s, %s)
        """, (class_name, subject_name, chapter_name))

# ==================== CLASSES ====================

@admin_bp.route('/admin/classes', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_classes():
    if not is_admin():
        return jsonify({"error": "Access denied. Admins only."}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("SELECT class_id, class_name FROM classes ORDER BY class_name")
            res = cursor.fetchall()
            return jsonify({"classes": res}), 200

        elif request.method == 'POST':
            data = request.get_json() or {}
            class_name = data.get('class_name', '').strip()
            if not class_name:
                return jsonify({"error": "Class name is required"}), 400

            cursor.execute("INSERT INTO classes (class_name) VALUES (%s)", (class_name,))
            conn.commit()
            return jsonify({"message": "Class created successfully", "class_id": cursor.lastrowid}), 201

        elif request.method == 'PUT':
            data = request.get_json() or {}
            class_id = data.get('class_id')
            class_name = data.get('class_name', '').strip()
            if not class_id or not class_name:
                return jsonify({"error": "Class ID and class name are required"}), 400

            cursor.execute("UPDATE classes SET class_name = %s WHERE class_id = %s", (class_name, class_id))
            conn.commit()
            return jsonify({"message": "Class updated successfully"}), 200

        elif request.method == 'DELETE':
            class_id = request.args.get('class_id') or (request.get_json() or {}).get('class_id')
            if not class_id:
                return jsonify({"error": "Class ID is required"}), 400

            cursor.execute("DELETE FROM classes WHERE class_id = %s", (class_id,))
            conn.commit()
            return jsonify({"message": "Class deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==================== SUBJECTS ====================

@admin_bp.route('/admin/subjects', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_subjects():
    if not is_admin():
        return jsonify({"error": "Access denied. Admins only."}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("SELECT subject_id, class_name, subject_name FROM subjects ORDER BY class_name, subject_name")
            res = cursor.fetchall()
            return jsonify({"subjects": res}), 200

        elif request.method == 'POST':
            data = request.get_json() or {}
            class_name = data.get('class_name', '').strip()
            subject_name = data.get('subject_name', '').strip()
            if not class_name or not subject_name:
                return jsonify({"error": "Class name and subject name are required"}), 400

            ensure_hierarchy(cursor, class_name)
            cursor.execute("INSERT INTO subjects (class_name, subject_name) VALUES (%s, %s)", (class_name, subject_name))
            conn.commit()
            return jsonify({"message": "Subject created successfully", "subject_id": cursor.lastrowid}), 201

        elif request.method == 'PUT':
            data = request.get_json() or {}
            subject_id = data.get('subject_id')
            class_name = data.get('class_name', '').strip()
            subject_name = data.get('subject_name', '').strip()
            if not subject_id or not class_name or not subject_name:
                return jsonify({"error": "Subject ID, class name and subject name are required"}), 400

            ensure_hierarchy(cursor, class_name)
            cursor.execute("""
                UPDATE subjects 
                SET class_name = %s, subject_name = %s 
                WHERE subject_id = %s
            """, (class_name, subject_name, subject_id))
            conn.commit()
            return jsonify({"message": "Subject updated successfully"}), 200

        elif request.method == 'DELETE':
            subject_id = request.args.get('subject_id') or (request.get_json() or {}).get('subject_id')
            if not subject_id:
                return jsonify({"error": "Subject ID is required"}), 400

            cursor.execute("DELETE FROM subjects WHERE subject_id = %s", (subject_id,))
            conn.commit()
            return jsonify({"message": "Subject deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==================== CHAPTERS ====================

@admin_bp.route('/admin/chapters', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_chapters():
    if not is_admin():
        return jsonify({"error": "Access denied. Admins only."}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("SELECT chapter_id, class_name, subject_name, chapter_name FROM chapters ORDER BY class_name, subject_name, chapter_name")
            res = cursor.fetchall()
            return jsonify({"chapters": res}), 200

        elif request.method == 'POST':
            data = request.get_json() or {}
            class_name = data.get('class_name', '').strip()
            subject_name = data.get('subject_name', '').strip()
            chapter_name = data.get('chapter_name', '').strip()
            if not class_name or not subject_name or not chapter_name:
                return jsonify({"error": "Class, subject and chapter name are required"}), 400

            ensure_hierarchy(cursor, class_name, subject_name)
            cursor.execute("""
                INSERT INTO chapters (class_name, subject_name, chapter_name) 
                VALUES (%s, %s, %s)
            """, (class_name, subject_name, chapter_name))
            conn.commit()
            return jsonify({"message": "Chapter created successfully", "chapter_id": cursor.lastrowid}), 201

        elif request.method == 'PUT':
            data = request.get_json() or {}
            chapter_id = data.get('chapter_id')
            class_name = data.get('class_name', '').strip()
            subject_name = data.get('subject_name', '').strip()
            chapter_name = data.get('chapter_name', '').strip()
            if not chapter_id or not class_name or not subject_name or not chapter_name:
                return jsonify({"error": "All fields are required for update"}), 400

            ensure_hierarchy(cursor, class_name, subject_name)
            cursor.execute("""
                UPDATE chapters 
                SET class_name = %s, subject_name = %s, chapter_name = %s 
                WHERE chapter_id = %s
            """, (class_name, subject_name, chapter_name, chapter_id))
            conn.commit()
            return jsonify({"message": "Chapter updated successfully"}), 200

        elif request.method == 'DELETE':
            chapter_id = request.args.get('chapter_id') or (request.get_json() or {}).get('chapter_id')
            if not chapter_id:
                return jsonify({"error": "Chapter ID is required"}), 400

            cursor.execute("DELETE FROM chapters WHERE chapter_id = %s", (chapter_id,))
            conn.commit()
            return jsonify({"message": "Chapter deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==================== TOPICS ====================

@admin_bp.route('/admin/topics', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_topics():
    if not is_admin():
        return jsonify({"error": "Access denied. Admins only."}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("""
                SELECT topic_id, class_name, subject_name, chapter_name, topic_name, notes, summary, quiz, assignment 
                FROM topics ORDER BY class_name, subject_name, chapter_name, topic_name
            """)
            res = cursor.fetchall()
            # Deserialize quiz JSON fields
            for item in res:
                if item.get('quiz'):
                    try:
                        item['quiz'] = json.loads(item['quiz'])
                    except Exception:
                        item['quiz'] = []
                else:
                    item['quiz'] = []
            return jsonify({"topics": res}), 200

        elif request.method == 'POST':
            data = request.get_json() or {}
            class_name = data.get('class_name', '').strip() or data.get('class', '').strip()
            subject_name = data.get('subject_name', '').strip() or data.get('subject', '').strip()
            chapter_name = data.get('chapter_name', '').strip() or data.get('chapter', '').strip()
            topic_name = data.get('topic_name', '').strip() or data.get('topic', '').strip()
            notes = data.get('notes', '').strip()
            summary = data.get('summary', '').strip()
            quiz = data.get('quiz', [])
            assignment = data.get('assignment', '').strip()

            if not class_name or not subject_name or not chapter_name or not topic_name:
                return jsonify({"error": "Class, subject, chapter and topic name are required"}), 400

            ensure_hierarchy(cursor, class_name, subject_name, chapter_name)
            
            quiz_json = json.dumps(quiz)
            cursor.execute("""
                INSERT INTO topics (class_name, subject_name, chapter_name, topic_name, notes, summary, quiz, assignment) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (class_name, subject_name, chapter_name, topic_name, notes, summary, quiz_json, assignment))
            
            # Also keep courses table in sync for Review 1 code compatibility
            try:
                cursor.execute("""
                    INSERT INTO courses (class, subject, chapter, topic, notes, summary, quiz, assignment)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (class_name, subject_name, chapter_name, topic_name, notes, summary, quiz_json, assignment))
            except Exception as ex_sync:
                print(f"Notice: failed to sync to legacy courses table: {ex_sync}")

            conn.commit()
            return jsonify({"message": "Topic created successfully", "topic_id": cursor.lastrowid}), 201

        elif request.method == 'PUT':
            data = request.get_json() or {}
            topic_id = data.get('topic_id')
            class_name = data.get('class_name', '').strip() or data.get('class', '').strip()
            subject_name = data.get('subject_name', '').strip() or data.get('subject', '').strip()
            chapter_name = data.get('chapter_name', '').strip() or data.get('chapter', '').strip()
            topic_name = data.get('topic_name', '').strip() or data.get('topic', '').strip()
            notes = data.get('notes', '').strip()
            summary = data.get('summary', '').strip()
            quiz = data.get('quiz', [])
            assignment = data.get('assignment', '').strip()

            if not topic_id or not class_name or not subject_name or not chapter_name or not topic_name:
                return jsonify({"error": "Topic ID, class, subject, chapter and topic name are required"}), 400

            ensure_hierarchy(cursor, class_name, subject_name, chapter_name)

            # Get old topic name to sync with legacy courses table
            cursor.execute("SELECT class_name, subject_name, chapter_name, topic_name FROM topics WHERE topic_id = %s", (topic_id,))
            old_topic = cursor.fetchone()

            quiz_json = json.dumps(quiz)
            cursor.execute("""
                UPDATE topics 
                SET class_name = %s, subject_name = %s, chapter_name = %s, topic_name = %s,
                    notes = %s, summary = %s, quiz = %s, assignment = %s 
                WHERE topic_id = %s
            """, (class_name, subject_name, chapter_name, topic_name, notes, summary, quiz_json, assignment, topic_id))

            # Sync legacy courses table
            if old_topic:
                try:
                    cursor.execute("""
                        UPDATE courses 
                        SET class = %s, subject = %s, chapter = %s, topic = %s,
                            notes = %s, summary = %s, quiz = %s, assignment = %s
                        WHERE class = %s AND subject = %s AND chapter = %s AND topic = %s
                    """, (class_name, subject_name, chapter_name, topic_name, notes, summary, quiz_json, assignment,
                          old_topic['class_name'], old_topic['subject_name'], old_topic['chapter_name'], old_topic['topic_name']))
                except Exception as ex_sync:
                    print(f"Notice: failed to sync update to legacy courses table: {ex_sync}")

            conn.commit()
            return jsonify({"message": "Topic updated successfully"}), 200

        elif request.method == 'DELETE':
            topic_id = request.args.get('topic_id') or (request.get_json() or {}).get('topic_id')
            if not topic_id:
                return jsonify({"error": "Topic ID is required"}), 400

            # Get topic details to delete from legacy courses table
            cursor.execute("SELECT class_name, subject_name, chapter_name, topic_name FROM topics WHERE topic_id = %s", (topic_id,))
            topic_row = cursor.fetchone()

            cursor.execute("DELETE FROM topics WHERE topic_id = %s", (topic_id,))

            if topic_row:
                try:
                    cursor.execute("""
                        DELETE FROM courses 
                        WHERE class = %s AND subject = %s AND chapter = %s AND topic = %s
                    """, (topic_row['class_name'], topic_row['subject_name'], topic_row['chapter_name'], topic_row['topic_name']))
                except Exception as ex_sync:
                    print(f"Notice: failed to sync delete to legacy courses table: {ex_sync}")

            conn.commit()
            return jsonify({"message": "Topic deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==================== STUDENTS ====================

@admin_bp.route('/admin/students', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_students():
    if not is_admin():
        return jsonify({"error": "Access denied. Admins only."}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("""
                SELECT u.user_id, u.name, u.email, u.phone, s.student_id, s.class, s.primary_parent_phone, s.secondary_parent_phone
                FROM users u
                JOIN students s ON u.user_id = s.user_id
                ORDER BY s.student_id DESC
            """)
            students = cursor.fetchall()
            return jsonify({"students": students}), 200

        elif request.method == 'POST':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            email = data.get('email', '').strip() or None
            phone = data.get('phone', '').strip()
            password = data.get('password', '').strip()
            class_name = data.get('class', '').strip() or data.get('class_name', '').strip()
            primary_parent_phone = data.get('primary_parent_phone', '').strip()
            secondary_parent_phone = data.get('secondary_parent_phone', '').strip() or None

            if not name or not phone or not password or not class_name or not primary_parent_phone:
                return jsonify({"error": "Name, phone, password, class and primary parent phone are required"}), 400

            if email:
                cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return jsonify({"error": "Email already registered"}), 400

            hashed_password = generate_password_hash(password)
            cursor.execute("""
                INSERT INTO users (name, email, phone, password, role)
                VALUES (%s, %s, %s, %s, 'Student')
            """, (name, email, phone, hashed_password))
            user_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO students (user_id, class, primary_parent_phone, secondary_parent_phone)
                VALUES (%s, %s, %s, %s)
            """, (user_id, class_name, primary_parent_phone, secondary_parent_phone))
            student_id = cursor.lastrowid

            # Initialize empty progress row
            cursor.execute("""
                INSERT INTO progress (student_id, progress)
                VALUES (%s, %s)
            """, (student_id, json.dumps({"completed_topics": [], "quiz_scores": {}})))

            conn.commit()
            return jsonify({
                "message": "Student created successfully",
                "student_id": student_id,
                "user_id": user_id
            }), 201

        elif request.method == 'PUT':
            data = request.get_json() or {}
            student_id = data.get('student_id')
            name = data.get('name', '').strip()
            email = data.get('email', '').strip() or None
            phone = data.get('phone', '').strip()
            password = data.get('password', '').strip()
            class_name = data.get('class', '').strip() or data.get('class_name', '').strip()
            primary_parent_phone = data.get('primary_parent_phone', '').strip()
            secondary_parent_phone = data.get('secondary_parent_phone', '').strip() or None

            if not student_id:
                return jsonify({"error": "Student ID is required"}), 400
            if not name or not phone or not class_name or not primary_parent_phone:
                return jsonify({"error": "Name, phone, class and primary parent phone are required"}), 400

            cursor.execute("SELECT student_id, user_id FROM students WHERE student_id = %s", (student_id,))
            student_row = cursor.fetchone()
            if not student_row:
                return jsonify({"error": "Student not found"}), 404

            user_id = student_row['user_id']

            # Check email uniqueness against other users
            if email:
                cursor.execute("SELECT user_id FROM users WHERE email = %s AND user_id != %s", (email, user_id))
                if cursor.fetchone():
                    return jsonify({"error": "Email is already in use by another user"}), 400

            # Update users table
            if password:
                hashed_password = generate_password_hash(password)
                cursor.execute("""
                    UPDATE users
                    SET name = %s, email = %s, phone = %s, password = %s
                    WHERE user_id = %s
                """, (name, email, phone, hashed_password, user_id))
            else:
                cursor.execute("""
                    UPDATE users
                    SET name = %s, email = %s, phone = %s
                    WHERE user_id = %s
                """, (name, email, phone, user_id))

            # Update students table
            cursor.execute("""
                UPDATE students
                SET class = %s, primary_parent_phone = %s, secondary_parent_phone = %s
                WHERE student_id = %s
            """, (class_name, primary_parent_phone, secondary_parent_phone, student_id))

            conn.commit()
            return jsonify({"message": "Student updated successfully"}), 200

        elif request.method == 'DELETE':
            student_id = request.args.get('student_id') or (request.get_json() or {}).get('student_id')
            if not student_id:
                return jsonify({"error": "Student ID is required"}), 400

            cursor.execute("SELECT student_id, user_id FROM students WHERE student_id = %s", (student_id,))
            student_row = cursor.fetchone()
            if not student_row:
                return jsonify({"error": "Student not found"}), 404

            user_id = student_row['user_id']

            # Safely remove progress, student, and user records
            cursor.execute("DELETE FROM progress WHERE student_id = %s", (student_id,))
            cursor.execute("DELETE FROM students WHERE student_id = %s", (student_id,))
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))

            conn.commit()
            return jsonify({"message": "Student deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# ==================== PARENTS ====================

@admin_bp.route('/admin/parents', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_parents():
    if not is_admin():
        return jsonify({"error": "Access denied. Admins only."}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        if request.method == 'GET':
            cursor.execute("""
                SELECT u.user_id, u.name, u.email, u.phone, p.parent_id
                FROM users u
                JOIN parents p ON u.user_id = p.user_id
                ORDER BY p.parent_id DESC
            """)
            parents = cursor.fetchall()
            return jsonify({"parents": parents}), 200

        elif request.method == 'POST':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            email = data.get('email', '').strip() or None
            phone = data.get('phone', '').strip()
            password = data.get('password', '').strip()

            if not name or not phone or not password:
                return jsonify({"error": "Name, phone and password are required"}), 400

            if email:
                cursor.execute("SELECT user_id FROM users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return jsonify({"error": "Email already registered"}), 400

            hashed_password = generate_password_hash(password)
            cursor.execute("""
                INSERT INTO users (name, email, phone, password, role)
                VALUES (%s, %s, %s, %s, 'Parent')
            """, (name, email, phone, hashed_password))
            user_id = cursor.lastrowid

            cursor.execute("""
                INSERT INTO parents (user_id, phone)
                VALUES (%s, %s)
            """, (user_id, phone))
            parent_id = cursor.lastrowid

            conn.commit()
            return jsonify({
                "message": "Parent created successfully",
                "parent_id": parent_id,
                "user_id": user_id
            }), 201

        elif request.method == 'PUT':
            data = request.get_json() or {}
            parent_id = data.get('parent_id')
            name = data.get('name', '').strip()
            email = data.get('email', '').strip() or None
            phone = data.get('phone', '').strip()
            password = data.get('password', '').strip()

            if not parent_id:
                return jsonify({"error": "Parent ID is required"}), 400
            if not name or not phone:
                return jsonify({"error": "Name and phone are required"}), 400

            cursor.execute("SELECT parent_id, user_id FROM parents WHERE parent_id = %s", (parent_id,))
            parent_row = cursor.fetchone()
            if not parent_row:
                return jsonify({"error": "Parent not found"}), 404

            user_id = parent_row['user_id']

            if email:
                cursor.execute("SELECT user_id FROM users WHERE email = %s AND user_id != %s", (email, user_id))
                if cursor.fetchone():
                    return jsonify({"error": "Email is already in use by another user"}), 400

            if password:
                hashed_password = generate_password_hash(password)
                cursor.execute("""
                    UPDATE users
                    SET name = %s, email = %s, phone = %s, password = %s
                    WHERE user_id = %s
                """, (name, email, phone, hashed_password, user_id))
            else:
                cursor.execute("""
                    UPDATE users
                    SET name = %s, email = %s, phone = %s
                    WHERE user_id = %s
                """, (name, email, phone, user_id))

            cursor.execute("""
                UPDATE parents
                SET phone = %s
                WHERE parent_id = %s
            """, (phone, parent_id))

            conn.commit()
            return jsonify({"message": "Parent updated successfully"}), 200

        elif request.method == 'DELETE':
            parent_id = request.args.get('parent_id') or (request.get_json() or {}).get('parent_id')
            if not parent_id:
                return jsonify({"error": "Parent ID is required"}), 400

            cursor.execute("SELECT parent_id, user_id FROM parents WHERE parent_id = %s", (parent_id,))
            parent_row = cursor.fetchone()
            if not parent_row:
                return jsonify({"error": "Parent not found"}), 404

            user_id = parent_row['user_id']

            cursor.execute("DELETE FROM parents WHERE parent_id = %s", (parent_id,))
            cursor.execute("DELETE FROM users WHERE user_id = %s", (user_id,))

            conn.commit()
            return jsonify({"message": "Parent deleted successfully"}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
