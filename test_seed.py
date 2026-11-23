# -*- coding: utf-8 -*-
"""
RuralEdu - Database & Project Health Check Script
Run this script independently to verify DB connectivity and table integrity.

Usage:
    python test_seed.py

Expected output: All checks pass with [OK] markers.
"""

import os
import sys

try:
    # pyrefly: ignore [missing-import]
    import mysql.connector
    # pyrefly: ignore [missing-import]
    from mysql.connector import Error
    MYSQL_AVAILABLE = True
except ImportError:
    MYSQL_AVAILABLE = False
    print("[WARN] mysql-connector-python not installed. Run: pip install mysql-connector-python")

# ── Database Config ──────────────────────────────────────────────────────────
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASS = 'root'
DB_NAME = 'ruraledu'

REQUIRED_TABLES = [
    'students', 'parents', 'admins',
    'courses', 'videos', 'notes',
    'quiz', 'attendance', 'progress'
]

REQUIRED_DIRS = [
    'templates',
    'static/css',
    'static/uploads',
    'uploads/notes',
    'uploads/videos',
]

REQUIRED_FILES = [
    'app.py',
    'templates/base.html',
    'templates/login.html',
    'templates/register.html',
    'templates/dashboard.html',
    'templates/parent_dashboard.html',
    'templates/admin_dashboard.html',
    'templates/courses.html',
    'static/css/style.css',
]

# ── Print helpers ─────────────────────────────────────────────────────────────
def ok(msg):
    print("  [OK]   " + msg)

def fail(msg):
    print("  [FAIL] " + msg)
    return 1

def warn(msg):
    print("  [WARN] " + msg)

# ── Check 1: File Structure ───────────────────────────────────────────────────
def check_file_structure():
    print("\n--- Checking project file structure ---")
    errors = 0
    base = os.path.dirname(os.path.abspath(__file__))

    for d in REQUIRED_DIRS:
        full = os.path.join(base, d.replace('/', os.sep))
        if os.path.isdir(full):
            ok("Directory exists: " + d + "/")
        else:
            errors += fail("Missing directory: " + d + "/")
            os.makedirs(full, exist_ok=True)
            warn("  Auto-created: " + d + "/")

    for f in REQUIRED_FILES:
        full = os.path.join(base, f.replace('/', os.sep))
        if os.path.isfile(full):
            ok("File exists: " + f)
        else:
            errors += fail("Missing file: " + f)

    return errors

# ── Check 2: MySQL Connection ─────────────────────────────────────────────────
def check_db_connection():
    print("\n--- Checking MySQL connection ---")
    if not MYSQL_AVAILABLE:
        return fail("mysql-connector-python not installed.")
    try:
        conn = mysql.connector.connect(
            host=DB_HOST, user=DB_USER, password=DB_PASS
        )
        ok("Connected to MySQL server at " + DB_HOST + " as '" + DB_USER + "'")
        conn.close()
        return 0
    except Error as e:
        return fail("MySQL connection failed: " + str(e))

# ── Check 3: Database Existence ───────────────────────────────────────────────
def check_database():
    print("\n--- Checking database ---")
    errors = 0
    try:
        conn = mysql.connector.connect(
            host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME
        )
        ok("Database '" + DB_NAME + "' exists and is accessible")
        cursor = conn.cursor()

        print("\n--- Checking required tables ---")
        cursor.execute("SHOW TABLES")
        existing = {row[0] for row in cursor.fetchall()}

        for table in REQUIRED_TABLES:
            if table in existing:
                cursor.execute("SELECT COUNT(*) FROM " + table)
                count = cursor.fetchone()[0]
                ok("Table '" + table + "' exists (" + str(count) + " rows)")
            else:
                errors += fail("Table '" + table + "' is MISSING from database!")

        cursor.close()
        conn.close()
    except Error as e:
        errors += fail("Database check failed: " + str(e))

    return errors

# ── Check 4: Seeded data ──────────────────────────────────────────────────────
def check_seed_data():
    print("\n--- Checking seed data (default accounts) ---")
    errors = 0
    try:
        conn = mysql.connector.connect(
            host=DB_HOST, user=DB_USER, password=DB_PASS, database=DB_NAME
        )
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT email FROM admins WHERE email = 'admin@ruraledu.com'")
        if cursor.fetchone():
            ok("Default admin exists (admin@ruraledu.com / admin123)")
        else:
            warn("Default admin not found -- run app.py to auto-seed")

        cursor.execute("SELECT email FROM students WHERE email = 'student@ruraledu.com'")
        if cursor.fetchone():
            ok("Default student exists (student@ruraledu.com / student123)")
        else:
            warn("Default student not found -- run app.py to auto-seed")

        cursor.execute("SELECT email FROM parents WHERE email = 'parent@ruraledu.com'")
        if cursor.fetchone():
            ok("Default parent exists (parent@ruraledu.com / parent123)")
        else:
            warn("Default parent not found -- run app.py to auto-seed")

        cursor.execute("SELECT COUNT(*) as cnt FROM courses")
        c = cursor.fetchone()['cnt']
        if c > 0:
            ok("Courses seeded: " + str(c) + " courses found")
        else:
            warn("No courses seeded -- run app.py to initialize")

        cursor.close()
        conn.close()
    except Error as e:
        errors += fail("Seed check failed: " + str(e))

    return errors

# ── Main Runner ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 60)
    print("   RuralEdu -- Project Health Check")
    print("=" * 60)

    total_errors = 0
    total_errors += check_file_structure()
    db_ok = check_db_connection()
    total_errors += db_ok

    if db_ok == 0:
        total_errors += check_database()
        total_errors += check_seed_data()
    else:
        warn("Skipping DB table checks due to connection failure.")

    print("\n" + "=" * 60)
    if total_errors == 0:
        print("ALL CHECKS PASSED! Project is healthy.")
        print("  Run:       python app.py")
        print("  Then visit: http://127.0.0.1:5000")
    else:
        print("ISSUES FOUND: " + str(total_errors) + " problem(s). See above.")
    print("=" * 60)
    sys.exit(0 if total_errors == 0 else 1)
