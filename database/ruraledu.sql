-- RuralEdu AI MySQL Database Schema Design
-- Review 2 Execution (Relational Schema Verification)

CREATE DATABASE IF NOT EXISTS ruraledu;
USE ruraledu;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(15),
    password VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Student', 'Parent') NOT NULL
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    class VARCHAR(50) NOT NULL,
    primary_parent_phone VARCHAR(15) NOT NULL,
    secondary_parent_phone VARCHAR(15),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. Parents Table
CREATE TABLE IF NOT EXISTS parents (
    parent_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    phone VARCHAR(15) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. Classes Table
CREATE TABLE IF NOT EXISTS classes (
    class_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL UNIQUE
);

-- 5. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    subject_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    UNIQUE KEY unique_class_subject (class_name, subject_name)
);

-- 6. Chapters Table
CREATE TABLE IF NOT EXISTS chapters (
    chapter_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    chapter_name VARCHAR(100) NOT NULL,
    UNIQUE KEY unique_subject_chapter (class_name, subject_name, chapter_name)
);

-- 7. Topics Table
CREATE TABLE IF NOT EXISTS topics (
    topic_id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(50) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    chapter_name VARCHAR(100) NOT NULL,
    topic_name VARCHAR(100) NOT NULL,
    notes TEXT,
    summary TEXT,
    quiz JSON,
    assignment TEXT,
    UNIQUE KEY unique_chapter_topic (class_name, subject_name, chapter_name, topic_name)
);

-- 8. Legacy Courses Table (for backward compatibility)
CREATE TABLE IF NOT EXISTS courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    class VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    chapter VARCHAR(100) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    notes TEXT,
    summary TEXT,
    quiz JSON,
    assignment TEXT
);

-- 9. Progress Table
CREATE TABLE IF NOT EXISTS progress (
    progress_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    progress JSON NOT NULL, -- Holds JSON mapping or progress configuration: {"completed_topics": [1, 2], "quiz_scores": {"1": 90}}
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);
