import os
import datetime
# pyrefly: ignore [missing-import]
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
# pyrefly: ignore [missing-import]
import mysql.connector
# pyrefly: ignore [missing-import]
from mysql.connector import Error
# pyrefly: ignore [missing-import]
from werkzeug.security import generate_password_hash, check_password_hash
# pyrefly: ignore [missing-import]
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = 'ruraledu_secret_key_for_1st_review'

from translations import t

@app.context_processor
def inject_translation_helper():
    return dict(t=t)

# Configuration
UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size
ALLOWED_EXTENSIONS = {'pdf'}

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Helper function to connect to MySQL
def get_db_connection(use_db=True):
    try:
        if use_db:
            return mysql.connector.connect(
                host='localhost',
                user='root',
                password='root',
                database='ruraledu'
            )
        else:
            return mysql.connector.connect(
                host='localhost',
                user='root',
                password='root'
            )
    except mysql.connector.Error as err:
        print(f"Database connection error: {err}")
        raise err

# Database Initialization
def init_db():
    try:
        # Connect to MySQL server without database first
        conn = get_db_connection(use_db=False)
        cursor = conn.cursor()
        
        # Create database
        cursor.execute("CREATE DATABASE IF NOT EXISTS ruraledu")
        cursor.execute("USE ruraledu")
        
        # Alter existing tables to increase password column length for hashes
        try:
            cursor.execute("ALTER TABLE students MODIFY COLUMN password VARCHAR(255) NOT NULL")
        except Exception as ae1:
            print(f"Notice: students alter skipped or failed: {ae1}")
        try:
            cursor.execute("ALTER TABLE parents MODIFY COLUMN password VARCHAR(255) NOT NULL")
        except Exception as ae2:
            print(f"Notice: parents alter skipped or failed: {ae2}")
        try:
            cursor.execute("ALTER TABLE parents ADD UNIQUE (mobile)")
        except Exception as aeUnique:
            print(f"Notice: parents mobile unique alter skipped or failed: {aeUnique}")
        try:
            cursor.execute("ALTER TABLE students ADD COLUMN parent_phone VARCHAR(15)")
        except Exception as ae0:
            print(f"Notice: students parent_phone alter skipped or failed: {ae0}")
        try:
            cursor.execute("ALTER TABLE students ADD COLUMN primary_parent_phone VARCHAR(15)")
        except Exception as aePrim:
            print(f"Notice: students primary_parent_phone alter skipped or failed: {aePrim}")
        try:
            cursor.execute("ALTER TABLE students ADD COLUMN secondary_parent_phone VARCHAR(15)")
        except Exception as aeSec:
            print(f"Notice: students secondary_parent_phone alter skipped or failed: {aeSec}")
        try:
            cursor.execute("ALTER TABLE quiz ADD COLUMN course_id INT")
            cursor.execute("ALTER TABLE quiz ADD FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE")
        except Exception as ae3:
            print(f"Notice: quiz alter skipped or failed: {ae3}")
        
        # Create Tables
        
        # 1. Students
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS students (
            student_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE,
            mobile VARCHAR(15),
            password VARCHAR(255) NOT NULL,
            class VARCHAR(20),
            language VARCHAR(50),
            parent_phone VARCHAR(15),
            primary_parent_phone VARCHAR(15),
            secondary_parent_phone VARCHAR(15)
        )
        """)
        
        # 2. Parents
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS parents (
            parent_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100),
            mobile VARCHAR(15) UNIQUE,
            password VARCHAR(255) NOT NULL,
            student_id INT,
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE SET NULL
        )
        """)
        
        # 3. Admins
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            admin_id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
        """)
        
        # 4. Courses
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS courses (
            course_id INT AUTO_INCREMENT PRIMARY KEY,
            course_name VARCHAR(100) NOT NULL,
            description TEXT
        )
        """)
        
        # 5. Videos
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS videos (
            video_id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT,
            video_url VARCHAR(500),
            duration VARCHAR(50),
            FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
        )
        """)
        
        # 6. Notes
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            note_id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT,
            note_title VARCHAR(100),
            file_path VARCHAR(500),
            FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
        )
        """)
        
        # 7. Quiz (aligned to schema and links to courses)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz (
            quiz_id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT,
            question TEXT,
            option1 VARCHAR(255),
            option2 VARCHAR(255),
            option3 VARCHAR(255),
            option4 VARCHAR(255),
            answer VARCHAR(255),
            FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
        )
        """)
        
        # 8. Attendance
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            attendance_id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            date DATE,
            status VARCHAR(20),
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
        )
        """)
        
        # 9. Progress
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS progress (
            progress_id INT AUTO_INCREMENT PRIMARY KEY,
            student_id INT,
            course_id INT,
            completion_percentage INT,
            quiz_score INT,
            FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
            FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
        )
        """)
        
        # Check and Seed Default Admin, Student, Parent if database is empty
        cursor.execute("SELECT COUNT(*) FROM admins")
        if cursor.fetchone()[0] == 0:
            print("Seeding default data...")
            hashed_admin = generate_password_hash("admin123")
            hashed_student = generate_password_hash("student123")
            hashed_parent = generate_password_hash("parent123")
            
            # Seed Admin
            cursor.execute("INSERT INTO admins (name, email, password) VALUES (%s, %s, %s)", 
                           ("Admin Teacher", "admin@ruraledu.com", hashed_admin))
            
            # Seed Student
            cursor.execute("""
            INSERT INTO students (name, email, mobile, password, class, language) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """, ("Ram Kumar", "student@ruraledu.com", "9876543210", hashed_student, "Class 8", "english"))
            
            student_id = cursor.lastrowid
            
            # Seed Parent
            cursor.execute("""
            INSERT INTO parents (name, email, mobile, password, student_id) 
            VALUES (%s, %s, %s, %s, %s)
            """, ("Somu Kumar", "parent@ruraledu.com", "9000000000", hashed_parent, student_id))
            
            # Seed Courses
            cursor.execute("INSERT INTO courses (course_name, description) VALUES (%s, %s)", 
                           ("Class 8 Mathematics", "Learn arithmetic, geometry, rational numbers, and basic algebra concepts."))
            math_id = cursor.lastrowid
            
            cursor.execute("INSERT INTO courses (course_name, description) VALUES (%s, %s)", 
                           ("Class 8 Science", "Explore plant science, crop production, cell structure, and physical forces."))
            science_id = cursor.lastrowid
            
            cursor.execute("INSERT INTO courses (course_name, description) VALUES (%s, %s)", 
                           ("Class 8 English", "Improve grammar rules, verbs, adjectives, reading, and vocabulary lessons."))
            english_id = cursor.lastrowid
            
            # Seed Videos
            cursor.execute("INSERT INTO videos (course_id, video_url, duration) VALUES (%s, %s, %s)",
                           (math_id, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "12 mins"))
            cursor.execute("INSERT INTO videos (course_id, video_url, duration) VALUES (%s, %s, %s)",
                           (science_id, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "15 mins"))
            cursor.execute("INSERT INTO videos (course_id, video_url, duration) VALUES (%s, %s, %s)",
                           (english_id, "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "10 mins"))
            
            # Seed Notes files
            math_pdf = os.path.join(UPLOAD_FOLDER, 'Class_8_Math_Rational_Numbers.pdf')
            science_pdf = os.path.join(UPLOAD_FOLDER, 'Class_8_Science_Crop_Production.pdf')
            english_pdf = os.path.join(UPLOAD_FOLDER, 'Class_8_English_Verbs.pdf')
            
            # Create actual dummy PDF placeholder files
            for pdf_path in [math_pdf, science_pdf, english_pdf]:
                if not os.path.exists(pdf_path):
                    with open(pdf_path, 'wb') as f:
                        f.write(b'%PDF-1.4 dummy pdf content for review')
            
            cursor.execute("INSERT INTO notes (course_id, note_title, file_path) VALUES (%s, %s, %s)",
                           (math_id, "Chapter 1 - Rational Numbers Revision Notes", "Class_8_Math_Rational_Numbers.pdf"))
            cursor.execute("INSERT INTO notes (course_id, note_title, file_path) VALUES (%s, %s, %s)",
                           (science_id, "Chapter 1 - Crop Production Study Guide", "Class_8_Science_Crop_Production.pdf"))
            cursor.execute("INSERT INTO notes (course_id, note_title, file_path) VALUES (%s, %s, %s)",
                           (english_id, "Grammar Unit 1 - Introduction to Verbs Notes", "Class_8_English_Verbs.pdf"))
            
            # Seed Quizzes
            cursor.execute("""
            INSERT INTO quiz (course_id, question, option1, option2, option3, option4, answer)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (math_id, "What is 15% of 200?", "20", "30", "40", "15", "30"))
            
            cursor.execute("""
            INSERT INTO quiz (course_id, question, option1, option2, option3, option4, answer)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (science_id, "Which gas do plants absorb during photosynthesis?", "Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen", "Carbon Dioxide"))
            
            cursor.execute("""
            INSERT INTO quiz (course_id, question, option1, option2, option3, option4, answer)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (english_id, "Which of the following words is a verb?", "Beautiful", "Run", "Quickly", "Apple", "Run"))
            
            # Seed Attendance (past 14 days)
            today = datetime.date.today()
            for i in range(14, 0, -1):
                date_rec = today - datetime.timedelta(days=i)
                # Ensure we don't log weekends
                if date_rec.weekday() < 5:
                    status = "present"
                    if i == 5:  # Log one absent day for statistics
                        status = "absent"
                    cursor.execute("INSERT INTO attendance (student_id, date, status) VALUES (%s, %s, %s)",
                                   (student_id, date_rec, status))
            
            # Seed Progress
            cursor.execute("INSERT INTO progress (student_id, course_id, completion_percentage, quiz_score) VALUES (%s, %s, %s, %s)",
                           (student_id, math_id, 75, 8))
            cursor.execute("INSERT INTO progress (student_id, course_id, completion_percentage, quiz_score) VALUES (%s, %s, %s, %s)",
                           (student_id, science_id, 50, 6))
            cursor.execute("INSERT INTO progress (student_id, course_id, completion_percentage, quiz_score) VALUES (%s, %s, %s, %s)",
                           (student_id, english_id, 90, 9))
            
            conn.commit()
            print("Database Seeding Successful!")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Error initializing database: {e}")

# Call init_db immediately
init_db()

# File type filter
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== CONTROLLER ROUTES ====================

@app.before_request
def enforce_language_and_login():
    allowed_endpoints = ['static', 'change_language', 'login', 'register', 'index']
    if request.endpoint in allowed_endpoints or not request.endpoint:
        return
    if 'language' not in session:
        return redirect(url_for('index'))
    if 'user_id' not in session:
        flash(t("flash_auth_required"), "error")
        return redirect(url_for('login'))

@app.route('/')
def index():
    if 'user_id' in session:
        return render_template('index.html')
    if 'language' not in session:
        return render_template('select_language.html')
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'GET':
        if 'user_id' in session:
            role = session.get('role')
            role_map = {
                'student': 'student_dashboard',
                'parent': 'parent_dashboard',
                'admin': 'admin_dashboard',
            }
            dashboard_fn = role_map.get(role)
            if dashboard_fn:
                return redirect(url_for(dashboard_fn))
        return render_template('login.html')

    role = request.form.get('role')
    identifier = (request.form.get('identifier') or '').strip()
    password = request.form.get('password')
    language = request.form.get('language', 'en')
    
    lang_map = {
        'english': 'en', 'en': 'en',
        'tamil': 'ta', 'ta': 'ta',
        'hindi': 'hi', 'hi': 'hi',
        'telugu': 'te', 'te': 'te'
    }
    normalized_lang = lang_map.get(language.lower(), 'en')

    if not role or not identifier or not password:
        flash(t("flash_fill_credentials"), "error")
        return redirect(url_for('login'))
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify role and credentials
        if role == 'student':
            cursor.execute("SELECT * FROM students WHERE email = %s OR mobile = %s", (identifier, identifier))
            user = cursor.fetchone()
            if user and check_password_hash(user['password'], password):
                session['user_id'] = user['student_id']
                session['name'] = user['name']
                session['role'] = 'student'
                session['class'] = user['class']
                
                # Keep selected session language, otherwise fall back to DB language
                if 'language' not in session:
                    session['language'] = lang_map.get((user['language'] or 'english').lower(), 'en')
                else:
                    db_lang = 'english' if session['language'] == 'en' else ('tamil' if session['language'] == 'ta' else ('hindi' if session['language'] == 'hi' else 'telugu'))
                    cursor.execute("UPDATE students SET language = %s WHERE student_id = %s", (db_lang, user['student_id']))
                    conn.commit()
                    
                flash(t("flash_login_success"), "success")
                conn.close()
                return redirect(url_for('student_dashboard'))
                
        elif role == 'parent':
            cursor.execute("SELECT * FROM parents WHERE email = %s OR mobile = %s", (identifier, identifier))
            user = cursor.fetchone()
            if user and check_password_hash(user['password'], password):
                session['user_id'] = user['parent_id']
                session['name'] = user['name']
                session['role'] = 'parent'
                session['student_id'] = user['student_id']
                if 'language' not in session:
                    session['language'] = normalized_lang
                flash(t("flash_parent_login_success"), "success")
                conn.close()
                return redirect(url_for('parent_dashboard'))
                
        elif role == 'admin':
            cursor.execute("SELECT * FROM admins WHERE email = %s", (identifier,))
            user = cursor.fetchone()
            if user and check_password_hash(user['password'], password):
                session['user_id'] = user['admin_id']
                session['name'] = user['name']
                session['role'] = 'admin'
                if 'language' not in session:
                    session['language'] = normalized_lang
                flash(t("flash_admin_login_success"), "success")
                conn.close()
                return redirect(url_for('admin_dashboard'))
                
        flash(t("flash_invalid_credentials"), "error")
        conn.close()
    except Exception as e:
        flash(f"{t('flash_db_error')}: {e}", "error")
        
    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.clear()
    flash(t("flash_logout_success"), "success")
    return redirect(url_for('index'))

@app.route('/change_language/<lang>')
def change_language(lang):
    if 'user_id' in session:
        flash("Language cannot be changed after login.", "error")
        return redirect(request.referrer or url_for('index'))
        
    lang_map = {
        'en': 'en', 'english': 'en',
        'ta': 'ta', 'tamil': 'ta',
        'hi': 'hi', 'hindi': 'hi',
        'te': 'te', 'telugu': 'te'
    }
    mapped_lang = lang_map.get(lang.lower())
    if mapped_lang:
        session['language'] = mapped_lang
        flash(t("flash_language_updated"), "success")
    return redirect(request.referrer or url_for('index'))

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        role = request.form.get('role', 'student')
        name = request.form.get('name')
        email = request.form.get('email')
        mobile = request.form.get('mobile')
        password = request.form.get('password')
        
        if not name or not password:
            flash(t("flash_name_pass_required"), "error")
            return redirect(url_for('register'))
            
        hashed_password = generate_password_hash(password)
        
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            if role == 'student':
                student_class = request.form.get('class', 'LKG')
                language = request.form.get('language', 'english')
                mobile = (mobile or '').strip()
                primary_parent_phone = request.form.get('primary_parent_phone', '').strip()
                secondary_parent_phone = request.form.get('secondary_parent_phone', '').strip()
                
                if not primary_parent_phone:
                    flash("Primary Parent Phone Number is required.", "error")
                    conn.close()
                    return redirect(url_for('register'))
                    
                if len(primary_parent_phone) != 10 or not primary_parent_phone.isdigit():
                    flash("Primary parent phone number must be exactly 10 digits.", "error")
                    conn.close()
                    return redirect(url_for('register'))
                    
                if secondary_parent_phone:
                    if len(secondary_parent_phone) != 10 or not secondary_parent_phone.isdigit():
                        flash("Secondary parent phone number must be exactly 10 digits.", "error")
                        conn.close()
                        return redirect(url_for('register'))
                    if primary_parent_phone == secondary_parent_phone:
                        flash("Primary and Secondary parent phone numbers cannot be identical.", "error")
                        conn.close()
                        return redirect(url_for('register'))
                else:
                    secondary_parent_phone = None
                    
                cursor.execute("""
                INSERT INTO students (name, email, mobile, parent_phone, primary_parent_phone, secondary_parent_phone, password, class, language)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (name, email, mobile, primary_parent_phone, primary_parent_phone, secondary_parent_phone, hashed_password, student_class, language))
                student_id = cursor.lastrowid
                
                # Dynamic mapping update for backward compatibility:
                try:
                    cursor.execute("SELECT parent_id FROM parents WHERE mobile = %s OR mobile = %s", (primary_parent_phone, secondary_parent_phone))
                    parents_match = cursor.fetchall()
                    for parent_row in parents_match:
                        cursor.execute("UPDATE parents SET student_id = %s WHERE parent_id = %s", (student_id, parent_row[0]))
                except Exception as ex_link:
                    print(f"Notice: failed to link existing parents to new student: {ex_link}")
                    
                conn.commit()
                flash(t("flash_reg_success"), "success")
                
            elif role == 'parent':
                mobile = (mobile or '').strip()
                if not mobile:
                    flash("Mobile number is required.", "error")
                    conn.close()
                    return redirect(url_for('register'))
                    
                if len(mobile) != 10 or not mobile.isdigit():
                    flash("Mobile number must be exactly 10 digits.", "error")
                    conn.close()
                    return redirect(url_for('register'))
                    
                # Enforce unique phone number verification for parents
                cursor.execute("SELECT parent_id FROM parents WHERE mobile = %s", (mobile,))
                existing_parent = cursor.fetchone()
                if existing_parent:
                    flash("An account with this phone number already exists. Please login or use another phone number.", "error")
                    conn.close()
                    return redirect(url_for('register'))
                    
                # Dynamically look up a matching student already registered with this parent's mobile number
                matched_student_id = None
                try:
                    cursor.execute("SELECT student_id FROM students WHERE primary_parent_phone = %s OR secondary_parent_phone = %s LIMIT 1", (mobile, mobile))
                    student_match = cursor.fetchone()
                    if student_match:
                        matched_student_id = student_match[0]
                except Exception as ex_match:
                    print(f"Notice: failed to search for matching student during parent registration: {ex_match}")

                cursor.execute("""
                INSERT INTO parents (name, email, mobile, password, student_id)
                VALUES (%s, %s, %s, %s, %s)
                """, (name, email, mobile, hashed_password, matched_student_id))
                conn.commit()
                flash(t("flash_parent_reg_success"), "success")
                
            elif role == 'admin':
                # Admins must have an email
                if not email:
                    flash(t("flash_email_required"), "error")
                    conn.close()
                    return redirect(url_for('register'))
                cursor.execute("""
                INSERT INTO admins (name, email, password)
                VALUES (%s, %s, %s)
                """, (name, email, hashed_password))
                conn.commit()
                flash(t("flash_admin_reg_success"), "success")
                
            conn.close()
            return redirect(url_for('login'))
        except Exception as e:
            flash(f"{t('flash_reg_failed')}: {e}", "error")
            return redirect(url_for('register'))
            
    # GET: fetch students to link parent account
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT student_id, name, email, class FROM students")
        students = cursor.fetchall()
        conn.close()
    except Exception:
        students = []
        
    return render_template('register.html', students=students)

# ==================== STUDENT ROUTES ====================

@app.route('/student/dashboard')
def student_dashboard():
    if 'user_id' not in session or session.get('role') != 'student':
        flash(t("flash_student_login_required"), "error")
        return redirect(url_for('login'))
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Load courses for student class
        cursor.execute("SELECT * FROM courses WHERE course_name LIKE %s", (f"%{session.get('class')}%",))
        courses = cursor.fetchall()
        
        conn.close()
        return render_template('dashboard.html', courses=courses)
    except Exception as e:
        flash(f"Failed to load dashboard: {e}", "error")
        return render_template('dashboard.html', courses=[])

@app.route('/course/<int:course_id>')
def course_details(course_id):
    if 'user_id' not in session or session.get('role') != 'student':
        flash(t("flash_auth_required"), "error")
        return redirect(url_for('login'))
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get course details
        cursor.execute("SELECT * FROM courses WHERE course_id = %s", (course_id,))
        course = cursor.fetchone()
        
        if not course:
            flash("Course not found.", "error")
            conn.close()
            return redirect(url_for('student_dashboard'))
            
        # Get videos
        cursor.execute("SELECT * FROM videos WHERE course_id = %s", (course_id,))
        videos = cursor.fetchall()
        
        # Get notes
        cursor.execute("SELECT * FROM notes WHERE course_id = %s", (course_id,))
        notes = cursor.fetchall()
        
        # Get quizzes
        cursor.execute("SELECT * FROM quiz WHERE course_id = %s", (course_id,))
        quizzes = cursor.fetchall()
        
        conn.close()
        return render_template('courses.html', course=course, videos=videos, notes=notes, quizzes=quizzes)
    except Exception as e:
        flash(f"Failed to load course details: {e}", "error")
        return redirect(url_for('student_dashboard'))

@app.route('/quiz/submit', methods=['POST'])
def submit_quiz():
    if 'user_id' not in session or session.get('role') != 'student':
        flash(t("flash_auth_required"), "error")
        return redirect(url_for('login'))
        
    student_id = session.get('user_id')
    course_id = request.form.get('course_id')
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch quizzes for this course
        cursor.execute("SELECT * FROM quiz WHERE course_id = %s", (course_id,))
        quizzes = cursor.fetchall()
        
        if not quizzes:
            flash("No quizzes found.", "error")
            conn.close()
            return redirect(url_for('student_dashboard'))
            
        score = 0
        total_questions = len(quizzes)
        
        for q in quizzes:
            # Get submitted answer
            sub_ans = request.form.get(f"answer_{q['quiz_id']}")
            if sub_ans and sub_ans.strip() == q['answer'].strip():
                score += 1
                
        # Calculate percentage
        percentage = int((score / total_questions) * 100) if total_questions > 0 else 0
        score_out_of_10 = int((score / total_questions) * 10) if total_questions > 0 else 0
        
        # Insert/Update progress
        cursor.execute("""
        SELECT progress_id FROM progress WHERE student_id = %s AND course_id = %s
        """, (student_id, course_id))
        prog = cursor.fetchone()
        
        if prog:
            cursor.execute("""
            UPDATE progress SET completion_percentage = %s, quiz_score = %s 
            WHERE progress_id = %s
            """, (percentage, score_out_of_10, prog['progress_id']))
        else:
            cursor.execute("""
            INSERT INTO progress (student_id, course_id, completion_percentage, quiz_score)
            VALUES (%s, %s, %s, %s)
            """, (student_id, course_id, percentage, score_out_of_10))
            
        conn.commit()
        conn.close()
        
        flash(f"{t('flash_quiz_submitted')} Score: {score}/{total_questions} ({percentage}%)", "success")
    except Exception as e:
        flash(f"Failed to submit quiz: {e}", "error")
        
    # Cast course_id to int to satisfy Flask's <int:course_id> route converter
    try:
        return redirect(url_for('course_details', course_id=int(course_id), action='quiz'))
    except (TypeError, ValueError):
        return redirect(url_for('student_dashboard'))

# ==================== PARENT ROUTES ====================

@app.route('/parent/dashboard')
def parent_dashboard():
    if 'user_id' not in session or session.get('role') != 'parent':
        flash(t("flash_parent_login_required"), "error")
        return redirect(url_for('login'))
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # 1. Fetch parent details to get their mobile number
        cursor.execute("SELECT * FROM parents WHERE parent_id = %s", (session.get('user_id'),))
        parent = cursor.fetchone()
        
        if not parent:
            flash("Parent profile not found.", "error")
            conn.close()
            return redirect(url_for('logout'))
            
        parent_mobile = parent['mobile']
        
        # 2. Retrieve children by parent phone number matching parent's mobile in primary or secondary
        cursor.execute("SELECT * FROM students WHERE primary_parent_phone = %s OR secondary_parent_phone = %s", (parent_mobile, parent_mobile))
        children = cursor.fetchall()
        
        if not children:
            conn.close()
            return render_template('parent_dashboard.html', 
                                   children=[],
                                   selected_student_id=None,
                                   student_name="None Linked", 
                                   student_class="N/A",
                                   student_lang="english", 
                                   attendance_percentage=0, 
                                   attendance_records=[], 
                                   quiz_marks=[],
                                   learning_progress=[],
                                   assignments=[])
                                   
        # 3. Determine selected child
        selected_student_id = request.args.get('student_id', type=int)
        selected_child = None
        if selected_student_id:
            for child in children:
                if child['student_id'] == selected_student_id:
                    selected_child = child
                    break
                    
        if not selected_child:
            selected_child = children[0]
            selected_student_id = selected_child['student_id']
            
        student_name = selected_child['name']
        student_class = selected_child['class'] or "Class 8"
        student_lang = selected_child['language'] or "english"
        
        # 4. Fetch Attendance Records
        cursor.execute("SELECT date, status FROM attendance WHERE student_id = %s ORDER BY date DESC", (selected_student_id,))
        attendance_records = cursor.fetchall()
        
        # Calculate attendance rate
        total_days = len(attendance_records)
        present_days = sum(1 for d in attendance_records if d['status'] == 'present')
        attendance_percentage = int((present_days / total_days) * 100) if total_days > 0 else 0
        
        # 5. Fetch Quiz scores mapped through progress table
        cursor.execute("""
        SELECT c.course_name, p.quiz_score as score, p.completion_percentage as percentage, NOW() as date_taken
        FROM progress p
        JOIN courses c ON p.course_id = c.course_id
        WHERE p.student_id = %s
        """, (selected_student_id,))
        quiz_marks = cursor.fetchall()
        
        # Standardize dates for rendering
        today_str = datetime.date.today().strftime('%B %d, %Y')
        for q in quiz_marks:
            q['date_taken'] = today_str
            
        # 6. Fetch Learning progress details
        cursor.execute("""
        SELECT c.course_name, COALESCE(p.completion_percentage, 0) as percentage
        FROM courses c
        LEFT JOIN progress p ON p.course_id = c.course_id AND p.student_id = %s
        WHERE c.course_name LIKE %s
        """, (selected_student_id, f"%{student_class}%"))
        learning_progress = cursor.fetchall()
        
        # 7. Fetch Notes/Revision materials to represent Assignments
        assignments = []
        cursor.execute("SELECT course_id FROM courses WHERE course_name LIKE %s", (f"%{student_class}%",))
        child_courses = cursor.fetchall()
        if child_courses:
            course_ids = [cc['course_id'] for cc in child_courses]
            format_strings = ','.join(['%s'] * len(course_ids))
            cursor.execute(f"""
            SELECT n.note_title as title, c.course_name 
            FROM notes n
            JOIN courses c ON n.course_id = c.course_id
            WHERE n.course_id IN ({format_strings})
            """, tuple(course_ids))
            assignments = cursor.fetchall()
            
        conn.close()
        return render_template('parent_dashboard.html', 
                               children=children,
                               selected_student_id=selected_student_id,
                               student_name=student_name, 
                               student_class=student_class,
                               student_lang=student_lang,
                               attendance_records=attendance_records,
                               attendance_percentage=attendance_percentage,
                               quiz_marks=quiz_marks,
                               learning_progress=learning_progress,
                               assignments=assignments)
                               
    except Exception as e:
        flash(f"Failed to load parent dashboard: {e}", "error")
        return render_template('parent_dashboard.html', 
                               children=[],
                               selected_student_id=None,
                               student_name="Error", 
                               student_class="N/A",
                               student_lang="english", 
                               attendance_percentage=0, 
                               attendance_records=[], 
                               quiz_marks=[],
                               learning_progress=[],
                               assignments=[])

# ==================== ADMIN ROUTES (CRUD) ====================

@app.route('/admin/dashboard')
def admin_dashboard():
    if 'user_id' not in session or session.get('role') != 'admin':
        flash(t("flash_admin_login_required"), "error")
        return redirect(url_for('login'))
        
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch courses
        cursor.execute("SELECT * FROM courses")
        courses = cursor.fetchall()
        
        # Fetch videos with course name
        cursor.execute("""
        SELECT v.*, c.course_name FROM videos v 
        JOIN courses c ON v.course_id = c.course_id
        """)
        videos = cursor.fetchall()
        
        # Fetch notes with course name
        cursor.execute("""
        SELECT n.*, c.course_name FROM notes n
        JOIN courses c ON n.course_id = c.course_id
        """)
        notes = cursor.fetchall()
        
        # Fetch quizzes with course name
        cursor.execute("""
        SELECT q.*, c.course_name FROM quiz q
        JOIN courses c ON q.course_id = c.course_id
        """)
        quizzes = cursor.fetchall()
        
        # Fetch students
        cursor.execute("SELECT * FROM students")
        students = cursor.fetchall()
        
        # Fetch parents with linked child name(s) based on parent phone relationship
        cursor.execute("""
        SELECT p.*, GROUP_CONCAT(s.name SEPARATOR ', ') as student_name 
        FROM parents p
        LEFT JOIN students s ON p.mobile = s.primary_parent_phone OR p.mobile = s.secondary_parent_phone
        GROUP BY p.parent_id
        """)
        parents = cursor.fetchall()
        
        conn.close()
        return render_template('admin_dashboard.html', 
                               courses=courses, 
                               videos=videos, 
                               notes=notes, 
                               quizzes=quizzes, 
                               students=students, 
                               parents=parents)
    except Exception as e:
        flash(f"Database loading failed: {e}", "error")
        return redirect(url_for('index'))

# COURSE CRUD
@app.route('/admin/course/add', methods=['POST'])
def admin_add_course():
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    name = request.form.get('course_name')
    desc = request.form.get('description')
    if name:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO courses (course_name, description) VALUES (%s, %s)", (name, desc))
            conn.commit()
            conn.close()
            flash(f"Course '{name}' added successfully.", "success")
        except Exception as e:
            flash(f"Failed to add course: {e}", "error")
    return redirect(url_for('admin_dashboard', tab='courses'))

@app.route('/admin/course/delete/<int:id>')
def admin_delete_course(id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM courses WHERE course_id = %s", (id,))
        conn.commit()
        conn.close()
        flash("Course deleted successfully.", "success")
    except Exception as e:
        flash(f"Failed to delete course: {e}", "error")
    return redirect(url_for('admin_dashboard', tab='courses'))

# VIDEO CRUD
@app.route('/admin/video/add', methods=['POST'])
def admin_add_video():
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    course_id = request.form.get('course_id')
    video_url = request.form.get('video_url')
    duration = request.form.get('duration')
    if course_id and video_url:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("INSERT INTO videos (course_id, video_url, duration) VALUES (%s, %s, %s)", (course_id, video_url, duration))
            conn.commit()
            conn.close()
            flash("Video link added successfully.", "success")
        except Exception as e:
            flash(f"Failed to add video: {e}", "error")
    return redirect(url_for('admin_dashboard', tab='videos'))

@app.route('/admin/video/delete/<int:id>')
def admin_delete_video(id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM videos WHERE video_id = %s", (id,))
        conn.commit()
        conn.close()
        flash("Video deleted successfully.", "success")
    except Exception as e:
        flash(f"Failed to delete video: {e}", "error")
    return redirect(url_for('admin_dashboard', tab='videos'))

# NOTES CRUD
@app.route('/admin/notes/add', methods=['POST'])
def admin_add_notes():
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    course_id = request.form.get('course_id')
    note_title = request.form.get('note_title')
    file = request.files.get('notes_file')
    
    if course_id and note_title and file:
        if file.filename == '':
            flash("No file selected.", "error")
            return redirect(url_for('admin_dashboard', tab='notes'))
            
        if allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add microsecond timestamp to prevent overwrite collision
            filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S%f')}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("INSERT INTO notes (course_id, note_title, file_path) VALUES (%s, %s, %s)",
                               (course_id, note_title, filename))
                conn.commit()
                conn.close()
                flash("Revision PDF notes uploaded successfully.", "success")
            except Exception as e:
                flash(f"Failed to save record to database: {e}", "error")
        else:
            flash("Invalid file format. Only PDF files are allowed.", "error")
            
    return redirect(url_for('admin_dashboard', tab='notes'))

@app.route('/admin/notes/delete/<int:id>')
def admin_delete_notes(id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get notes file path first to delete the file locally too
        cursor.execute("SELECT file_path FROM notes WHERE note_id = %s", (id,))
        record = cursor.fetchone()
        if record:
            file_to_del = os.path.join(app.config['UPLOAD_FOLDER'], record[0])
            if os.path.exists(file_to_del):
                os.remove(file_to_del)
                
        cursor.execute("DELETE FROM notes WHERE note_id = %s", (id,))
        conn.commit()
        conn.close()
        flash("Revision notes deleted successfully.", "success")
    except Exception as e:
        flash(f"Failed to delete note: {e}", "error")
    return redirect(url_for('admin_dashboard', tab='notes'))

# QUIZ CRUD
@app.route('/admin/quiz/add', methods=['POST'])
def admin_add_quiz():
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    course_id = request.form.get('course_id')
    question = request.form.get('question')
    option1 = request.form.get('option1')
    option2 = request.form.get('option2')
    option3 = request.form.get('option3')
    option4 = request.form.get('option4')
    answer = request.form.get('answer')
    
    if course_id and question and answer:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO quiz (course_id, question, option1, option2, option3, option4, answer)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (course_id, question, option1, option2, option3, option4, answer))
            conn.commit()
            conn.close()
            flash("Quiz question created successfully.", "success")
        except Exception as e:
            flash(f"Failed to add quiz question: {e}", "error")
            
    return redirect(url_for('admin_dashboard', tab='quizzes'))

@app.route('/admin/quiz/delete/<int:id>')
def admin_delete_quiz(id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM quiz WHERE quiz_id = %s", (id,))
        conn.commit()
        conn.close()
        flash("Quiz question deleted successfully.", "success")
    except Exception as e:
        flash(f"Failed to delete quiz question: {e}", "error")
    return redirect(url_for('admin_dashboard', tab='quizzes'))

@app.route('/admin/student/add', methods=['POST'])
def admin_add_student():
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    name = request.form.get('name')
    email = request.form.get('email')
    mobile = (request.form.get('mobile') or '').strip()
    primary_parent_phone = (request.form.get('primary_parent_phone') or '').strip()
    secondary_parent_phone = (request.form.get('secondary_parent_phone') or '').strip()
    password = request.form.get('password')
    student_class = request.form.get('class', 'LKG')
    language = request.form.get('language', 'english')
    
    if name and password and primary_parent_phone:
        if len(primary_parent_phone) != 10 or not primary_parent_phone.isdigit():
            flash("Primary parent phone number must be exactly 10 digits.", "error")
            return redirect(url_for('admin_dashboard', tab='students'))
            
        if secondary_parent_phone:
            if len(secondary_parent_phone) != 10 or not secondary_parent_phone.isdigit():
                flash("Secondary parent phone number must be exactly 10 digits.", "error")
                return redirect(url_for('admin_dashboard', tab='students'))
            if primary_parent_phone == secondary_parent_phone:
                flash("Primary and Secondary parent phone numbers cannot be identical.", "error")
                return redirect(url_for('admin_dashboard', tab='students'))
        else:
            secondary_parent_phone = None
            
        hashed_password = generate_password_hash(password)
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO students (name, email, mobile, parent_phone, primary_parent_phone, secondary_parent_phone, password, class, language)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (name, email, mobile, primary_parent_phone, primary_parent_phone, secondary_parent_phone, hashed_password, student_class, language))
            student_id = cursor.lastrowid
            
            # Legacy link mapping update:
            try:
                cursor.execute("SELECT parent_id FROM parents WHERE mobile = %s OR mobile = %s", (primary_parent_phone, secondary_parent_phone))
                parents_match = cursor.fetchall()
                for parent_row in parents_match:
                    cursor.execute("UPDATE parents SET student_id = %s WHERE parent_id = %s", (student_id, parent_row[0]))
            except Exception as ex_link:
                print(f"Notice: failed to link existing parents to new student: {ex_link}")
                
            conn.commit()
            conn.close()
            flash(f"Student '{name}' added successfully.", "success")
        except Exception as e:
            flash(f"Failed to add student: {e}", "error")
            
    return redirect(url_for('admin_dashboard', tab='students'))

@app.route('/admin/student/delete/<int:id>')
def admin_delete_student(id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM students WHERE student_id = %s", (id,))
        conn.commit()
        conn.close()
        flash("Student account deleted successfully.", "success")
    except Exception as e:
        flash(f"Failed to delete student: {e}", "error")
    return redirect(url_for('admin_dashboard', tab='students'))

# PARENT CRUD
@app.route('/admin/parent/add', methods=['POST'])
def admin_add_parent():
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    name = request.form.get('name')
    email = request.form.get('email')
    mobile = (request.form.get('mobile') or '').strip()
    password = request.form.get('password')
    student_id = request.form.get('student_id')
    
    if name and password and mobile:
        if len(mobile) != 10 or not mobile.isdigit():
            flash("Mobile number must be exactly 10 digits.", "error")
            return redirect(url_for('admin_dashboard', tab='parents'))
            
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Check unique parent phone in admin too
            cursor.execute("SELECT parent_id FROM parents WHERE mobile = %s", (mobile,))
            existing_parent = cursor.fetchone()
            if existing_parent:
                flash("An account with this phone number already exists. Please login or use another phone number.", "error")
                conn.close()
                return redirect(url_for('admin_dashboard', tab='parents'))
                
            hashed_password = generate_password_hash(password)
            cursor.execute("""
            INSERT INTO parents (name, email, mobile, password, student_id)
            VALUES (%s, %s, %s, %s, %s)
            """, (name, email, mobile, hashed_password, student_id))
            conn.commit()
            conn.close()
            flash(f"Parent '{name}' added successfully.", "success")
        except Exception as e:
            flash(f"Failed to add parent: {e}", "error")
            
    return redirect(url_for('admin_dashboard', tab='parents'))

@app.route('/admin/parent/delete/<int:id>')
def admin_delete_parent(id):
    if 'user_id' not in session or session.get('role') != 'admin':
        return redirect(url_for('index'))
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM parents WHERE parent_id = %s", (id,))
        conn.commit()
        conn.close()
        flash("Parent account deleted successfully.", "success")
    except Exception as e:
        flash(f"Failed to delete parent: {e}", "error")
    return redirect(url_for('admin_dashboard', tab='parents'))

# ==================== RUN APPLICATION ====================

if __name__ == '__main__':
    # Running local server in debug mode
    app.run(host='0.0.0.0', port=5000, debug=True)
