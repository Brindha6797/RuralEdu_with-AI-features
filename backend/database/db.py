import os
import sys
import json
import mysql.connector
from mysql.connector import Error
from werkzeug.security import generate_password_hash

# Add parent directory to path so 'backend' package can be imported correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASS = os.environ.get('DB_PASS', 'root')
DB_NAME = os.environ.get('DB_NAME', 'ruraledu')

def get_db_connection(use_db=True):
    """Establishes connection to the MySQL database."""
    try:
        if use_db:
            return mysql.connector.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASS,
                database=DB_NAME
            )
        else:
            return mysql.connector.connect(
                host=DB_HOST,
                user=DB_USER,
                password=DB_PASS
            )
    except mysql.connector.Error as err:
        print(f"MySQL Connection Error: {err}")
        raise err

def migrate_courses_to_relational():
    """Migrates existing data from legacy courses table to relational tables (classes, subjects, chapters, topics)."""
    conn = get_db_connection(use_db=True)
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if legacy courses table has any data
        cursor.execute("SHOW TABLES LIKE 'courses'")
        if not cursor.fetchone():
            return
        
        cursor.execute("SELECT COUNT(*) as count FROM courses")
        legacy_count = cursor.fetchone()['count']
        if legacy_count == 0:
            return
            
        # Check if topics table is empty
        cursor.execute("SELECT COUNT(*) as count FROM topics")
        topics_count = cursor.fetchone()['count']
        if topics_count > 0:
            # Already migrated or populated
            return
            
        print(f"Migrating {legacy_count} records from legacy courses to relational tables...")
        cursor.execute("SELECT * FROM courses")
        legacy_courses = cursor.fetchall()
        
        for c in legacy_courses:
            class_name = c['class']
            subject_name = c['subject']
            chapter_name = c['chapter']
            topic_name = c['topic']
            notes = c['notes']
            summary = c['summary']
            quiz = c['quiz']
            if isinstance(quiz, list) or isinstance(quiz, dict):
                import json
                quiz = json.dumps(quiz)
            assignment = c['assignment']
            
            # 1. Insert class if not exists
            cursor.execute("INSERT IGNORE INTO classes (class_name) VALUES (%s)", (class_name,))
            
            # 2. Insert subject if not exists
            cursor.execute("""
                INSERT IGNORE INTO subjects (class_name, subject_name)
                VALUES (%s, %s)
            """, (class_name, subject_name))
            
            # 3. Insert chapter if not exists
            cursor.execute("""
                INSERT IGNORE INTO chapters (class_name, subject_name, chapter_name)
                VALUES (%s, %s, %s)
            """, (class_name, subject_name, chapter_name))
            
            # 4. Insert topic if not exists
            cursor.execute("""
                INSERT IGNORE INTO topics (class_name, subject_name, chapter_name, topic_name, notes, summary, quiz, assignment)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (class_name, subject_name, chapter_name, topic_name, notes, summary, quiz, assignment))
            
        conn.commit()
        print("Data migration completed successfully.")
    except Exception as e:
        print(f"Error during course migration: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

def init_db():
    """Initializes the database by running the ruraledu.sql script and seeding initial data."""
    try:
        # First, connect without selecting database to execute the creation script
        conn = get_db_connection(use_db=False)
        cursor = conn.cursor()
        
        # Determine paths
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        sql_path = os.path.join(base_dir, 'database', 'ruraledu.sql')
        
        if os.path.exists(sql_path):
            print(f"Reading SQL schema from {sql_path}")
            with open(sql_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
            
            # Split by semicolon, filter out empty queries
            statements = sql_content.split(';')
            for statement in statements:
                statement = statement.strip()
                if statement:
                    cursor.execute(statement)
            conn.commit()
            print("Database structure initialized successfully.")
            
            # Ensure users.phone allows NULL values for optional student mobile registration
            try:
                cursor.execute("ALTER TABLE users MODIFY phone VARCHAR(15) NULL")
                conn.commit()
                print("Altered users table: phone is now nullable.")
            except Exception as alter_err:
                print(f"Notice: phone ALTER TABLE warning: {alter_err}")
        else:
            print(f"Warning: SQL script not found at {sql_path}. Tables might not be initialized.")
            
        cursor.close()
        conn.close()
        
        # Now seed default data using the specific DB connection
        seed_data()
        
        # Now migrate to new relational tables if legacy data was seeded/present
        migrate_courses_to_relational()
        
    except Exception as e:
        print(f"Error during DB initialization: {e}")
        raise e


def seed_data():
    """Seeds default courses, learning contents, progress, and user accounts."""
    conn = get_db_connection(use_db=True)
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Check if users already seeded
        cursor.execute("SELECT COUNT(*) as count FROM users")
        if cursor.fetchone()['count'] > 0:
            print("Database already contains data. Skipping seeding.")
            cursor.close()
            conn.close()
            return
            
        print("Seeding default data...")
        
        # 1. Create Admins
        admin_pass = generate_password_hash("admin123")
        cursor.execute("""
            INSERT INTO users (name, email, phone, password, role)
            VALUES (%s, %s, %s, %s, %s)
        """, ("Admin Teacher", "admin@ruraledu.com", "1111111111", admin_pass, "Admin"))
        
        # 2. Create Students
        student_pass = generate_password_hash("student123")
        cursor.execute("""
            INSERT INTO users (name, email, phone, password, role)
            VALUES (%s, %s, %s, %s, %s)
        """, ("Ram Kumar", "student@ruraledu.com", "9876543210", student_pass, "Student"))
        student_user_id = cursor.lastrowid
        
        cursor.execute("""
            INSERT INTO students (user_id, class, primary_parent_phone, secondary_parent_phone)
            VALUES (%s, %s, %s, %s)
        """, (student_user_id, "Class 8", "9000000000", "9000000001"))
        student_id = cursor.lastrowid
        
        # 3. Create Parents
        parent_pass = generate_password_hash("parent123")
        cursor.execute("""
            INSERT INTO users (name, email, phone, password, role)
            VALUES (%s, %s, %s, %s, %s)
        """, ("Somu Kumar", "parent@ruraledu.com", "9000000000", parent_pass, "Parent"))
        parent_user_id = cursor.lastrowid
        
        cursor.execute("""
            INSERT INTO parents (user_id, phone)
            VALUES (%s, %s)
        """, (parent_user_id, "9000000000"))
        
        # 4. Seed Courses
        # Course 1: Math
        math_quiz = [
            {
                "question": "What is the additive identity for rational numbers?",
                "options": ["0", "1", "-1", "None of these"],
                "answer": "0"
            },
            {
                "question": "What is the multiplicative inverse of 2/3?",
                "options": ["-2/3", "3/2", "-3/2", "1"],
                "answer": "3/2"
            }
        ]
        cursor.execute("""
            INSERT INTO courses (class, subject, chapter, topic, notes, summary, quiz, assignment)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            "Class 8",
            "Mathematics",
            "Chapter 1",
            "Rational Numbers",
            "A rational number is defined as a number which can be written in the form p/q, where p and q are integers and q is not equal to zero. Examples: 2/3, -5/8, 7. Rational numbers are closed under addition, subtraction, and multiplication.",
            "Rational numbers can be positive, negative, or zero. They are represented as fractions and cover all integers and decimals that repeat or terminate.",
            json.dumps(math_quiz),
            "Write 5 examples of rational numbers and find their additive and multiplicative inverses."
        ))
        math_course_id = cursor.lastrowid
        
        # Course 2: Science
        science_quiz = [
            {
                "question": "Which of the following is a Kharif crop?",
                "options": ["Wheat", "Paddy", "Gram", "Mustard"],
                "answer": "Paddy"
            },
            {
                "question": "What is the first step in crop production?",
                "options": ["Sowing", "Irrigation", "Preparation of Soil", "Harvesting"],
                "answer": "Preparation of Soil"
            }
        ]
        cursor.execute("""
            INSERT INTO courses (class, subject, chapter, topic, notes, summary, quiz, assignment)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            "Class 8",
            "Science",
            "Chapter 1",
            "Crop Production",
            "Crops are grown for food, fodder, and fiber. Agriculture involves soil preparation, sowing seeds, adding manure and fertilizers, irrigation, weed protection, harvesting, and safe storage. Kharif crops are sown in rainy seasons (e.g., paddy, maize) and Rabi crops in winter seasons (e.g., wheat, gram).",
            "Understanding agricultural practices for sustainable crop cultivation and distinctions between Kharif and Rabi crops.",
            json.dumps(science_quiz),
            "Draw a flowchart showing the step-by-step agricultural practices involved in crop production."
        ))
        science_course_id = cursor.lastrowid
        
        # Course 3: English
        english_quiz = [
            {
                "question": "Which of the following is a transitive verb?",
                "options": ["She sleeps.", "He read a book.", "The sun shines.", "They laughed."],
                "answer": "He read a book."
            },
            {
                "question": "Identify the verb in: 'The boy ran quickly down the street.'",
                "options": ["boy", "ran", "quickly", "street"],
                "answer": "ran"
            }
        ]
        cursor.execute("""
            INSERT INTO courses (class, subject, chapter, topic, notes, summary, quiz, assignment)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            "Class 8",
            "English",
            "Chapter 1",
            "Introduction to Verbs",
            "A verb is a word that asserts action, state of being, or occurrence. Action verbs can be transitive (takes a direct object) or intransitive (does not take a direct object). Auxiliary/helping verbs (e.g., is, are, have) assist the main verb to show tense or mood.",
            "Verbs form the core of sentences, indicating action, state, or relation between grammatical elements.",
            json.dumps(english_quiz),
            "Identify the verbs in 5 sentences of your choice and label them as transitive or intransitive."
        ))
        
        # 5. Create Progress
        initial_progress = {
            "completed_topics": [math_course_id],
            "quiz_scores": {str(math_course_id): 100}
        }
        cursor.execute("""
            INSERT INTO progress (student_id, progress)
            VALUES (%s, %s)
        """, (student_id, json.dumps(initial_progress)))
        
        conn.commit()
        print("Database seeding completed successfully.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        conn.rollback()
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    # Can run this file directly to recreate the DB
    init_db()
