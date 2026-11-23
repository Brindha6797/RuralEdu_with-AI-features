import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function AdminDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('courses'); // courses, students, parents

  // Modal open states
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);

  // New Course fields
  const [newClass, setNewClass] = useState('Class 8');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newChapter, setNewChapter] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newAssignment, setNewAssignment] = useState('');
  
  // Quiz creation states
  const [quizQuestion, setQuizQuestion] = useState('');
  const [qOpt1, setQOpt1] = useState('');
  const [qOpt2, setQOpt2] = useState('');
  const [qOpt3, setQOpt3] = useState('');
  const [qOpt4, setQOpt4] = useState('');
  const [qAnswer, setQAnswer] = useState('');

  // New Student fields
  const [sName, setSName] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sPass, setSPass] = useState('');
  const [sClass, setSClass] = useState('Class 8');
  const [sParentPhone, setSParentPhone] = useState('');
  const [studentModalMode, setStudentModalMode] = useState('add');
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  // New Parent fields
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pPass, setPPass] = useState('');
  const [parentModalMode, setParentModalMode] = useState('add');
  const [selectedParentId, setSelectedParentId] = useState(null);

  // Review 2 - Sub-tab and CRUD States
  const [activeCourseSubTab, setActiveCourseSubTab] = useState('topics');

  // Class Modal States
  const [showClassModal, setShowClassModal] = useState(false);
  const [classModalMode, setClassModalMode] = useState('add');
  const [classInputName, setClassInputName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);

  // Subject Modal States
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectModalMode, setSubjectModalMode] = useState('add');
  const [subjectInputName, setSubjectInputName] = useState('');
  const [subjectInputClass, setSubjectInputClass] = useState('Class 8');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Chapter Modal States
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [chapterModalMode, setChapterModalMode] = useState('add');
  const [chapterInputName, setChapterInputName] = useState('');
  const [chapterInputSubject, setChapterInputSubject] = useState('Mathematics');
  const [chapterInputClass, setChapterInputClass] = useState('Class 8');
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  // Topic modal edit states
  const [courseModalMode, setCourseModalMode] = useState('add');
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch('http://localhost:5000/admin/dashboard', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
      } else if (res.status === 401 || res.status === 403) {
        navigate('/login');
      }
    } catch (err) {
      console.error("Error fetching admin dashboard:", err);
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newChapter || !newTopic) {
      alert("Chapter and Topic are required.");
      return;
    }

    const quiz = quizQuestion ? [
      {
        question: quizQuestion,
        options: [qOpt1, qOpt2, qOpt3, qOpt4].filter(Boolean),
        answer: qAnswer
      }
    ] : [];

    try {
      const url = courseModalMode === 'add' 
        ? 'http://localhost:5000/add-course'
        : 'http://localhost:5000/admin/topics';
      const method = courseModalMode === 'add' ? 'POST' : 'PUT';
      const body = {
        class: newClass,
        subject: newSubject,
        chapter: newChapter,
        topic: newTopic,
        notes: newNotes,
        summary: newSummary,
        quiz: quiz,
        assignment: newAssignment
      };
      if (courseModalMode === 'edit') {
        body.topic_id = selectedTopicId;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(courseModalMode === 'add' ? "Course added successfully!" : "Topic updated successfully!");
        setShowCourseModal(false);
        // Clear fields
        setNewChapter('');
        setNewTopic('');
        setNewNotes('');
        setNewSummary('');
        setNewAssignment('');
        setQuizQuestion('');
        setQOpt1('');
        setQOpt2('');
        setQOpt3('');
        setQOpt4('');
        setQAnswer('');
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting course.");
    }
  };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    if (!classInputName.trim()) {
      alert("Class name is required.");
      return;
    }
    try {
      const url = 'http://localhost:5000/admin/classes';
      const method = classModalMode === 'add' ? 'POST' : 'PUT';
      const body = classModalMode === 'add' 
        ? { class_name: classInputName } 
        : { class_id: selectedClassId, class_name: classInputName };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(classModalMode === 'add' ? "Class added successfully!" : "Class updated successfully!");
        setShowClassModal(false);
        setClassInputName('');
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error managing class.");
    }
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!subjectInputName.trim()) {
      alert("Subject name is required.");
      return;
    }
    try {
      const url = 'http://localhost:5000/admin/subjects';
      const method = subjectModalMode === 'add' ? 'POST' : 'PUT';
      const body = subjectModalMode === 'add'
        ? { class_name: subjectInputClass, subject_name: subjectInputName }
        : { subject_id: selectedSubjectId, class_name: subjectInputClass, subject_name: subjectInputName };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(subjectModalMode === 'add' ? "Subject added successfully!" : "Subject updated successfully!");
        setShowSubjectModal(false);
        setSubjectInputName('');
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error managing subject.");
    }
  };

  const handleChapterSubmit = async (e) => {
    e.preventDefault();
    if (!chapterInputName.trim()) {
      alert("Chapter name is required.");
      return;
    }
    try {
      const url = 'http://localhost:5000/admin/chapters';
      const method = chapterModalMode === 'add' ? 'POST' : 'PUT';
      const body = chapterModalMode === 'add'
        ? { class_name: chapterInputClass, subject_name: chapterInputSubject, chapter_name: chapterInputName }
        : { chapter_id: selectedChapterId, class_name: chapterInputClass, subject_name: chapterInputSubject, chapter_name: chapterInputName };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (res.ok) {
        alert(chapterModalMode === 'add' ? "Chapter added successfully!" : "Chapter updated successfully!");
        setShowChapterModal(false);
        setChapterInputName('');
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Operation failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error managing chapter.");
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Are you sure you want to delete this class? This will delete all subjects, chapters, and topics in this class.")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/classes?class_id=${classId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert("Class deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/subjects?subject_id=${subjectId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert("Subject deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!window.confirm("Are you sure you want to delete this chapter?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/chapters?chapter_id=${chapterId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert("Chapter deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTopic = async (topicId) => {
    if (!window.confirm("Are you sure you want to delete this topic?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/topics?topic_id=${topicId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert("Topic deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditTopicClick = (topic) => {
    setCourseModalMode('edit');
    setSelectedTopicId(topic.course_id);
    setNewClass(topic.class);
    setNewSubject(topic.subject);
    setNewChapter(topic.chapter);
    setNewTopic(topic.topic);
    setNewNotes(topic.notes || '');
    setNewSummary(topic.summary || '');
    setNewAssignment(topic.assignment || '');
    if (topic.quiz && topic.quiz.length > 0) {
      setQuizQuestion(topic.quiz[0].question || '');
      setQOpt1(topic.quiz[0].options[0] || '');
      setQOpt2(topic.quiz[0].options[1] || '');
      setQOpt3(topic.quiz[0].options[2] || '');
      setQOpt4(topic.quiz[0].options[3] || '');
      setQAnswer(topic.quiz[0].answer || '');
    } else {
      setQuizQuestion('');
      setQOpt1('');
      setQOpt2('');
      setQOpt3('');
      setQOpt4('');
      setQAnswer('');
    }
    setShowCourseModal(true);
  };

  const handleAddTopicClick = () => {
    setCourseModalMode('add');
    setSelectedTopicId(null);
    setNewClass('Class 8');
    setNewSubject('Mathematics');
    setNewChapter('');
    setNewTopic('');
    setNewNotes('');
    setNewSummary('');
    setNewAssignment('');
    setQuizQuestion('');
    setQOpt1('');
    setQOpt2('');
    setQOpt3('');
    setQOpt4('');
    setQAnswer('');
    setShowCourseModal(true);
  };

  const handleAddStudentClick = () => {
    setStudentModalMode('add');
    setSelectedStudentId(null);
    setSName('');
    setSEmail('');
    setSPhone('');
    setSPass('');
    setSClass('Class 8');
    setSParentPhone('');
    setShowStudentModal(true);
  };

  const handleEditStudentClick = (student) => {
    setStudentModalMode('edit');
    setSelectedStudentId(student.student_id);
    setSName(student.name || '');
    setSEmail(student.email || '');
    setSPhone(student.phone || '');
    setSPass('');
    setSClass(student.class || 'Class 8');
    setSParentPhone(student.primary_parent_phone || '');
    setShowStudentModal(true);
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student account? This will permanently remove the student and their learning progress.")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/students?student_id=${studentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert("Student deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete student.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting student.");
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (studentModalMode === 'add') {
        const res = await fetch('http://localhost:5000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            role: 'Student',
            name: sName,
            email: sEmail,
            phone: sPhone,
            password: sPass,
            class: sClass,
            primary_parent_phone: sParentPhone
          })
        });

        if (res.ok) {
          alert(t("flash_reg_success"));
          setShowStudentModal(false);
          setSName('');
          setSEmail('');
          setSPhone('');
          setSPass('');
          setSParentPhone('');
          fetchAdminData();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to register student.");
        }
      } else {
        const res = await fetch('http://localhost:5000/admin/students', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            student_id: selectedStudentId,
            name: sName,
            email: sEmail,
            phone: sPhone,
            password: sPass,
            class: sClass,
            primary_parent_phone: sParentPhone
          })
        });

        if (res.ok) {
          alert("Student updated successfully!");
          setShowStudentModal(false);
          setSName('');
          setSEmail('');
          setSPhone('');
          setSPass('');
          setSParentPhone('');
          fetchAdminData();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to update student.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving student.");
    }
  };

  const handleAddParentClick = () => {
    setParentModalMode('add');
    setSelectedParentId(null);
    setPName('');
    setPEmail('');
    setPPhone('');
    setPPass('');
    setShowParentModal(true);
  };

  const handleEditParentClick = (parent) => {
    setParentModalMode('edit');
    setSelectedParentId(parent.parent_id);
    setPName(parent.name || '');
    setPEmail(parent.email || '');
    setPPhone(parent.phone || '');
    setPPass('');
    setShowParentModal(true);
  };

  const handleDeleteParent = async (parentId) => {
    if (!window.confirm("Are you sure you want to delete this parent account?")) return;
    try {
      const res = await fetch(`http://localhost:5000/admin/parents?parent_id=${parentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert("Parent deleted successfully!");
        fetchAdminData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete parent.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting parent.");
    }
  };

  const handleParentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (parentModalMode === 'add') {
        const res = await fetch('http://localhost:5000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            role: 'Parent',
            name: pName,
            email: pEmail,
            phone: pPhone,
            password: pPass
          })
        });

        if (res.ok) {
          alert(t("flash_parent_reg_success"));
          setShowParentModal(false);
          setPName('');
          setPEmail('');
          setPPhone('');
          setPPass('');
          fetchAdminData();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to register parent.");
        }
      } else {
        const res = await fetch('http://localhost:5000/admin/parents', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            parent_id: selectedParentId,
            name: pName,
            email: pEmail,
            phone: pPhone,
            password: pPass
          })
        });

        if (res.ok) {
          alert("Parent updated successfully!");
          setShowParentModal(false);
          setPName('');
          setPEmail('');
          setPPhone('');
          setPPass('');
          fetchAdminData();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to update parent.");
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error saving parent.");
    }
  };

  if (!adminData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
        <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Loading Dashboard...</p>
      </div>
    );
  }

  const { total_students, total_parents, courses = [], students = [], parents = [], classes = [], subjects = [], chapters = [] } = adminData;

  return (
    <div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--primary)' }}>{t("admin_title")}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>{t("admin_subtitle")}</p>
        </div>
        <span className="user-badge" style={{ background: 'rgba(251, 191, 36, 0.1)', borderColor: 'var(--accent)', color: 'var(--text-primary)', fontWeight: 700 }}>
          <i className="fa-solid fa-user-shield" style={{ color: 'var(--accent)' }}></i> {t("system_owner")}
        </span>
      </div>

      {/* Counts Header */}
      <div className="course-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-card stat-item" style={{ textAlign: 'center', padding: '24px' }}>
          <i className="fa-solid fa-book-open" style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '8px' }}></i>
          <h3>{courses.length}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Total Courses</p>
        </div>
        <div className="glass-card stat-item" style={{ textAlign: 'center', padding: '24px' }}>
          <i className="fa-solid fa-user-graduate" style={{ fontSize: '2rem', color: 'var(--secondary)', marginBottom: '8px' }}></i>
          <h3>{total_students}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Total Students</p>
        </div>
        <div className="glass-card stat-item" style={{ textAlign: 'center', padding: '24px' }}>
          <i className="fa-solid fa-users" style={{ fontSize: '2rem', color: 'var(--accent)', marginBottom: '8px' }}></i>
          <h3>{total_parents}</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Total Parents</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 'var(--border-radius-lg)' }}>
        <div className="admin-layout">
          
          {/* SIDEBAR MENU */}
          <div className="admin-sidebar">
            <button className={`admin-menu-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => setActiveTab('courses')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
              <i className="fa-solid fa-book"></i> <span>{t("courses")}</span>
            </button>
            <button className={`admin-menu-item ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
              <i className="fa-solid fa-user-graduate"></i> <span>{t("student")}</span>
            </button>
            <button className={`admin-menu-item ${activeTab === 'parents' ? 'active' : ''}`} onClick={() => setActiveTab('parents')} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
              <i className="fa-solid fa-users"></i> <span>{t("parent")}</span>
            </button>
          </div>

          {/* MAIN PANEL FOR CRUD */}
          <div className="admin-content">
            
            {/* ==================== TAB: COURSES ==================== */}
            {activeTab === 'courses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.45rem', color: 'var(--primary)' }}>{t("course_directory")}</h2>
                  
                  {activeCourseSubTab === 'topics' && (
                    <button className="btn btn-accent btn-sm" onClick={handleAddTopicClick} style={{ color: '#1e293b' }}>
                      <i className="fa-solid fa-plus"></i> {t("add_course")}
                    </button>
                  )}
                  {activeCourseSubTab === 'classes' && (
                    <button className="btn btn-accent btn-sm" onClick={() => { setClassModalMode('add'); setClassInputName(''); setShowClassModal(true); }} style={{ color: '#1e293b' }}>
                      <i className="fa-solid fa-plus"></i> Add Class
                    </button>
                  )}
                  {activeCourseSubTab === 'subjects' && (
                    <button className="btn btn-accent btn-sm" onClick={() => { setSubjectModalMode('add'); setSubjectInputName(''); setSubjectInputClass('Class 8'); setShowSubjectModal(true); }} style={{ color: '#1e293b' }}>
                      <i className="fa-solid fa-plus"></i> Add Subject
                    </button>
                  )}
                  {activeCourseSubTab === 'chapters' && (
                    <button className="btn btn-accent btn-sm" onClick={() => { setChapterModalMode('add'); setChapterInputName(''); setChapterInputSubject('Mathematics'); setChapterInputClass('Class 8'); setShowChapterModal(true); }} style={{ color: '#1e293b' }}>
                      <i className="fa-solid fa-plus"></i> Add Chapter
                    </button>
                  )}
                </div>

                {/* Sub-tab Selection */}
                <div className="auth-tabs" style={{ marginBottom: '20px', gap: '8px' }}>
                  <div className={`auth-tab ${activeCourseSubTab === 'topics' ? 'active' : ''}`} onClick={() => setActiveCourseSubTab('topics')}>
                    Topics
                  </div>
                  <div className={`auth-tab ${activeCourseSubTab === 'chapters' ? 'active' : ''}`} onClick={() => setActiveCourseSubTab('chapters')}>
                    Chapters
                  </div>
                  <div className={`auth-tab ${activeCourseSubTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveCourseSubTab('subjects')}>
                    Subjects
                  </div>
                  <div className={`auth-tab ${activeCourseSubTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveCourseSubTab('classes')}>
                    Classes
                  </div>
                </div>
                
                {/* 1. Topics Sub-tab */}
                {activeCourseSubTab === 'topics' && (
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Class</th>
                          <th>Subject</th>
                          <th>Chapter</th>
                          <th>Topic</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((c) => (
                          <tr key={c.course_id}>
                            <td>{c.course_id}</td>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{c.class}</td>
                            <td>{c.subject}</td>
                            <td>{c.chapter}</td>
                            <td style={{ fontWeight: 600 }}>{c.topic}</td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => handleEditTopicClick(c)} style={{ marginRight: '8px', padding: '6px 12px' }}>
                                <i className="fa-solid fa-pen-to-square"></i> Edit
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTopic(c.course_id)} style={{ padding: '6px 12px' }}>
                                <i className="fa-solid fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 2. Chapters Sub-tab */}
                {activeCourseSubTab === 'chapters' && (
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Class</th>
                          <th>Subject</th>
                          <th>Chapter</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chapters.map((ch) => (
                          <tr key={ch.chapter_id}>
                            <td>{ch.chapter_id}</td>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{ch.class_name}</td>
                            <td>{ch.subject_name}</td>
                            <td style={{ fontWeight: 600 }}>{ch.chapter_name}</td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => { setChapterModalMode('edit'); setSelectedChapterId(ch.chapter_id); setChapterInputName(ch.chapter_name); setChapterInputSubject(ch.subject_name); setChapterInputClass(ch.class_name); setShowChapterModal(true); }} style={{ marginRight: '8px', padding: '6px 12px' }}>
                                <i className="fa-solid fa-pen-to-square"></i> Edit
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteChapter(ch.chapter_id)} style={{ padding: '6px 12px' }}>
                                <i className="fa-solid fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3. Subjects Sub-tab */}
                {activeCourseSubTab === 'subjects' && (
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Class</th>
                          <th>Subject</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {subjects.map((sub) => (
                          <tr key={sub.subject_id}>
                            <td>{sub.subject_id}</td>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{sub.class_name}</td>
                            <td style={{ fontWeight: 600 }}>{sub.subject_name}</td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => { setSubjectModalMode('edit'); setSelectedSubjectId(sub.subject_id); setSubjectInputName(sub.subject_name); setSubjectInputClass(sub.class_name); setShowSubjectModal(true); }} style={{ marginRight: '8px', padding: '6px 12px' }}>
                                <i className="fa-solid fa-pen-to-square"></i> Edit
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubject(sub.subject_id)} style={{ padding: '6px 12px' }}>
                                <i className="fa-solid fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 4. Classes Sub-tab */}
                {activeCourseSubTab === 'classes' && (
                  <div className="table-wrapper">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Class Name</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((cls) => (
                          <tr key={cls.class_id}>
                            <td>{cls.class_id}</td>
                            <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cls.class_name}</td>
                            <td>
                              <button className="btn btn-secondary btn-sm" onClick={() => { setClassModalMode('edit'); setSelectedClassId(cls.class_id); setClassInputName(cls.class_name); setShowClassModal(true); }} style={{ marginRight: '8px', padding: '6px 12px' }}>
                                <i className="fa-solid fa-pen-to-square"></i> Edit
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClass(cls.class_id)} style={{ padding: '6px 12px' }}>
                                <i className="fa-solid fa-trash"></i> Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ==================== TAB: STUDENTS ==================== */}
            {activeTab === 'students' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.45rem', color: 'var(--primary)' }}>{t("student_mgmt")}</h2>
                  <button className="btn btn-accent btn-sm" onClick={handleAddStudentClick} style={{ color: '#1e293b' }}>
                    <i className="fa-solid fa-plus"></i> {t("add_student")}
                  </button>
                </div>
                
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{t("name")}</th>
                        <th>{t("email_address")}</th>
                        <th>{t("mobile_number")}</th>
                        <th>Parent Phone</th>
                        <th>{t("class_label")}</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s) => (
                        <tr key={s.student_id}>
                          <td>{s.student_id}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</td>
                          <td>{s.email || 'N/A'}</td>
                          <td>{s.phone || 'N/A'}</td>
                          <td>{s.primary_parent_phone || 'N/A'}</td>
                          <td>{s.class}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditStudentClick(s)} style={{ marginRight: '8px', padding: '6px 12px' }}>
                              <i className="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteStudent(s.student_id)} style={{ padding: '6px 12px' }}>
                              <i className="fa-solid fa-trash"></i> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ==================== TAB: PARENTS ==================== */}
            {activeTab === 'parents' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.45rem', color: 'var(--primary)' }}>{t("parent_profiles")}</h2>
                  <button className="btn btn-accent btn-sm" onClick={handleAddParentClick} style={{ color: '#1e293b' }}>
                    <i className="fa-solid fa-plus"></i> Add Parent
                  </button>
                </div>
                
                <div className="table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{t("name")}</th>
                        <th>{t("email_address")}</th>
                        <th>Link Phone</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parents.map((p) => (
                        <tr key={p.parent_id}>
                          <td>{p.parent_id}</td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</td>
                          <td>{p.email || 'N/A'}</td>
                          <td style={{ fontWeight: 600 }}>{p.phone}</td>
                          <td>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleEditParentClick(p)} style={{ marginRight: '8px', padding: '6px 12px' }}>
                              <i className="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteParent(p.parent_id)} style={{ padding: '6px 12px' }}>
                              <i className="fa-solid fa-trash"></i> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* modal add/edit course */}
      {showCourseModal && (
        <div className="modal-overlay open">
          <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 className="modal-title"><i className="fa-solid fa-book"></i> {courseModalMode === 'add' ? 'Add Course Syllabus & Resources' : 'Edit Topic Syllabus'}</h3>
              <button onClick={() => setShowCourseModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleAddCourse} className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Class</label>
                  <select className="form-control" value={newClass} onChange={(e) => setNewClass(e.target.value)}>
                    {classes.length > 0 ? (
                      classes.map(c => <option key={c.class_id} value={c.class_name}>{c.class_name}</option>)
                    ) : (
                      <>
                        <option value="Class 8">Class 8</option>
                        <option value="Class 9">Class 9</option>
                        <option value="Class 10">Class 10</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select className="form-control" value={newSubject} onChange={(e) => setNewSubject(e.target.value)}>
                    {subjects.filter(s => s.class_name === newClass).map(s => (
                      <option key={s.subject_id} value={s.subject_name}>{s.subject_name}</option>
                    ))}
                    {subjects.filter(s => s.class_name === newClass).length === 0 && (
                      <>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="English">English</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Chapter Name</label>
                <input type="text" className="form-control" value={newChapter} onChange={(e) => setNewChapter(e.target.value)} required placeholder="e.g. Chapter 2" />
              </div>

              <div className="form-group">
                <label>Topic / Title</label>
                <input type="text" className="form-control" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} required placeholder="e.g. Linear Equations" />
              </div>

              <div className="form-group">
                <label>Revision Notes Text</label>
                <textarea className="form-control" rows="3" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Revision pointers..."></textarea>
              </div>

              <div className="form-group">
                <label>Lesson Summary</label>
                <textarea className="form-control" rows="2" value={newSummary} onChange={(e) => setNewSummary(e.target.value)} placeholder="Lesson highlights..."></textarea>
              </div>

              <div style={{ border: '1px dashed var(--border-color)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <h4 style={{ fontWeight: 700, marginBottom: '10px' }}><i className="fa-solid fa-list-check"></i> Practice Question</h4>
                <div className="form-group">
                  <label>Question Text</label>
                  <input type="text" className="form-control" value={quizQuestion} onChange={(e) => setQuizQuestion(e.target.value)} placeholder="Enter query..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input type="text" className="form-control" value={qOpt1} onChange={(e) => setQOpt1(e.target.value)} placeholder="Option 1" />
                  <input type="text" className="form-control" value={qOpt2} onChange={(e) => setQOpt2(e.target.value)} placeholder="Option 2" />
                  <input type="text" className="form-control" value={qOpt3} onChange={(e) => setQOpt3(e.target.value)} placeholder="Option 3" />
                  <input type="text" className="form-control" value={qOpt4} onChange={(e) => setQOpt4(e.target.value)} placeholder="Option 4" />
                </div>
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label>Correct Answer Text</label>
                  <input type="text" className="form-control" value={qAnswer} onChange={(e) => setQAnswer(e.target.value)} placeholder="Must match option text exactly" />
                </div>
              </div>

              <div className="form-group">
                <label>Written Assignment</label>
                <input type="text" className="form-control" value={newAssignment} onChange={(e) => setNewAssignment(e.target.value)} placeholder="Assignment homework..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>{t("cancel")}</button>
                <button type="submit" className="btn btn-primary">{courseModalMode === 'add' ? t("submit") : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal add/edit class */}
      {showClassModal && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title"><i className="fa-solid fa-graduation-cap"></i> {classModalMode === 'add' ? 'Add Class' : 'Edit Class'}</h3>
              <button onClick={() => setShowClassModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleClassSubmit} className="modal-body">
              <div className="form-group">
                <label>Class Name</label>
                <input type="text" className="form-control" value={classInputName} onChange={(e) => setClassInputName(e.target.value)} required placeholder="e.g. Class 11" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowClassModal(false)}>{t("cancel")}</button>
                <button type="submit" className="btn btn-primary">{t("submit")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal add/edit subject */}
      {showSubjectModal && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title"><i className="fa-solid fa-book"></i> {subjectModalMode === 'add' ? 'Add Subject' : 'Edit Subject'}</h3>
              <button onClick={() => setShowSubjectModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSubjectSubmit} className="modal-body">
              <div className="form-group">
                <label>Class</label>
                <select className="form-control" value={subjectInputClass} onChange={(e) => setSubjectInputClass(e.target.value)}>
                  {classes.length > 0 ? (
                    classes.map(c => <option key={c.class_id} value={c.class_name}>{c.class_name}</option>)
                  ) : (
                    <>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Subject Name</label>
                <input type="text" className="form-control" value={subjectInputName} onChange={(e) => setSubjectInputName(e.target.value)} required placeholder="e.g. Geography" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>{t("cancel")}</button>
                <button type="submit" className="btn btn-primary">{t("submit")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal add/edit chapter */}
      {showChapterModal && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title"><i className="fa-solid fa-folder-open"></i> {chapterModalMode === 'add' ? 'Add Chapter' : 'Edit Chapter'}</h3>
              <button onClick={() => setShowChapterModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleChapterSubmit} className="modal-body">
              <div className="form-group">
                <label>Class</label>
                <select className="form-control" value={chapterInputClass} onChange={(e) => setChapterInputClass(e.target.value)}>
                  {classes.length > 0 ? (
                    classes.map(c => <option key={c.class_id} value={c.class_name}>{c.class_name}</option>)
                  ) : (
                    <>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Subject</label>
                <select className="form-control" value={chapterInputSubject} onChange={(e) => setChapterInputSubject(e.target.value)}>
                  {subjects.filter(s => s.class_name === chapterInputClass).map(s => (
                    <option key={s.subject_id} value={s.subject_name}>{s.subject_name}</option>
                  ))}
                  {subjects.filter(s => s.class_name === chapterInputClass).length === 0 && (
                    <>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Science">Science</option>
                      <option value="English">English</option>
                    </>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label>Chapter Name</label>
                <input type="text" className="form-control" value={chapterInputName} onChange={(e) => setChapterInputName(e.target.value)} required placeholder="e.g. Chapter 5" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowChapterModal(false)}>{t("cancel")}</button>
                <button type="submit" className="btn btn-primary">{t("submit")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal add/edit student */}
      {showStudentModal && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fa-solid fa-user-graduate"></i> {studentModalMode === 'add' ? 'Add Student' : 'Edit Student'}
              </h3>
              <button onClick={() => setShowStudentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleStudentSubmit} className="modal-body">
              <div className="form-group">
                <label>{t("full_name")}</label>
                <input type="text" className="form-control" value={sName} onChange={(e) => setSName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{t("email_address")}</label>
                <input type="email" className="form-control" value={sEmail} onChange={(e) => setSEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>{t("mobile_number")}</label>
                <input type="text" className="form-control" value={sPhone} onChange={(e) => setSPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>
                  {t("password")} {studentModalMode === 'edit' && <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(Leave blank to keep current)</span>}
                </label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={sPass} 
                  onChange={(e) => setSPass(e.target.value)} 
                  required={studentModalMode === 'add'} 
                  placeholder={studentModalMode === 'edit' ? "Leave blank to keep current password" : ""}
                />
              </div>
              <div className="form-group">
                <label>Parent Phone</label>
                <input type="text" className="form-control" value={sParentPhone} onChange={(e) => setSParentPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Class</label>
                <select className="form-control" value={sClass} onChange={(e) => setSClass(e.target.value)}>
                  {classes.length > 0 ? (
                    classes.map(c => <option key={c.class_id} value={c.class_name}>{c.class_name}</option>)
                  ) : (
                    <>
                      <option value="Class 8">Class 8</option>
                      <option value="Class 9">Class 9</option>
                      <option value="Class 10">Class 10</option>
                    </>
                  )}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStudentModal(false)}>{t("cancel")}</button>
                <button type="submit" className="btn btn-primary">{studentModalMode === 'add' ? t("submit") : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* modal add/edit parent */}
      {showParentModal && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fa-solid fa-users"></i> {parentModalMode === 'add' ? 'Add Parent' : 'Edit Parent'}
              </h3>
              <button onClick={() => setShowParentModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleParentSubmit} className="modal-body">
              <div className="form-group">
                <label>{t("full_name")}</label>
                <input type="text" className="form-control" value={pName} onChange={(e) => setPName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>{t("email_address")}</label>
                <input type="email" className="form-control" value={pEmail} onChange={(e) => setPEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Link phone (Matches child student primary parent phone)</label>
                <input type="text" className="form-control" value={pPhone} onChange={(e) => setPPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>
                  {t("password")} {parentModalMode === 'edit' && <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>(Leave blank to keep current)</span>}
                </label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={pPass} 
                  onChange={(e) => setPPass(e.target.value)} 
                  required={parentModalMode === 'add'} 
                  placeholder={parentModalMode === 'edit' ? "Leave blank to keep current password" : ""}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowParentModal(false)}>{t("cancel")}</button>
                <button type="submit" className="btn btn-primary">{parentModalMode === 'add' ? t("submit") : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
