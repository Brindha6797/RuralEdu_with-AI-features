import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function ParentDashboard() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [parentData, setParentData] = useState(null);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);

  useEffect(() => {
    document.body.className = 'bg-dashboard';
    fetchParentData();
    return () => {
      document.body.className = '';
    };
  }, []);

  const fetchParentData = async () => {
    try {
      const res = await fetch('http://localhost:5000/parent/dashboard', {
        headers: { 'Cache-Control': 'no-cache' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setParentData(data);
      } else if (res.status === 401 || res.status === 403) {
        navigate('/login');
      }
    } catch (err) {
      console.error("Error fetching parent dashboard:", err);
    }
  };

  const handleRequestCallback = () => {
    alert("Simulation: Request sent. Teacher will contact you on your registered parent mobile number.");
  };

  if (!parentData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
        <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Loading Dashboard...</p>
      </div>
    );
  }

  const { children, parent } = parentData;

  // Render "No child available" if unlinked
  if (!children || children.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px', margin: '40px auto', maxWidth: '600px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', margin: '0 auto 24px', justifyContent: 'center' }}>
          <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '2.5rem', color: '#ef4444' }}></i>
        </div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>{t("no_child_title")}</h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: 0 }}>
          {t("no_child_available")}
        </p>
      </div>
    );
  }

  // Current active child
  const child = children[selectedChildIndex] || children[0];
  const { profile: childProfile, courses, progress } = child;
  const completedTopics = progress.completed_topics || [];
  const quizScores = progress.quiz_scores || {};

  // Formulate static attendance list for visual dots (13 present, 1 absent, 4 upcoming classes)
  const attendanceRecords = [
    { date: 'July 14', status: 'present' },
    { date: 'July 15', status: 'present' },
    { date: 'July 16', status: 'present' },
    { date: 'July 17', status: 'present' },
    { date: 'July 18', status: 'present' },
    { date: 'July 19', status: 'absent' },
    { date: 'July 20', status: 'present' },
    { date: 'July 21', status: 'present' },
    { date: 'July 22', status: 'present' },
    { date: 'July 23', status: 'present' },
    { date: 'July 24', status: 'present' },
    { date: 'July 25', status: 'present' },
    { date: 'July 26', status: 'present' },
    { date: 'July 27', status: 'present' }
  ];

  return (
    <div>
      {/* Child Selector (only if multiple children connected) */}
      {children.length > 1 && (
        <div className="glass-card" style={{ marginBottom: '24px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <label htmlFor="childSelector" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              <i className="fa-solid fa-users" style={{ color: 'var(--primary)', marginRight: '6px' }}></i>{t("select_child")}
            </label>
            <select 
              id="childSelector" 
              className="form-control" 
              value={selectedChildIndex}
              onChange={(e) => setSelectedChildIndex(Number(e.target.value))}
              style={{ maxWidth: '280px', display: 'inline-block', padding: '8px 12px' }}
            >
              {children.map((ch, idx) => (
                <option key={idx} value={idx}>
                  {ch.profile.name} ({ch.profile.class})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--primary)' }}>{t("parent_title")}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          {t("parent_subtitle")}:{' '}
          <strong style={{ color: 'var(--primary)' }}>{childProfile.name}</strong> ({childProfile.class})
        </p>
      </div>

      <div className="dashboard-grid">
        
        {/* LEFT PANEL: Learning Duration, Quiz Marks, Progress, & Attendance */}
        <div className="col-8">
          
          {/* Daily Learning Time Chart (Pure CSS) */}
          <div className="glass-card card-primary" style={{ marginBottom: '30px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-chart-bar"></i>
                {t("daily_learning_time")}
              </h3>
              <span className="user-badge" style={{ background: 'rgba(46,125,50,0.1)', borderColor: 'rgba(46,125,50,0.25)', color: 'var(--primary)' }}>
                <i className="fa-solid fa-clock"></i> {t("avg_learning_time")}
              </span>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Weekly visual analysis of daily learning sessions.
            </p>
            
            <div className="chart-bar-container">
              <div className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: '90px' }} title="1.5 Hours">
                  <span className="chart-bar-tooltip">1.5h</span>
                </div>
                <span className="chart-day">{t("mon")}</span>
              </div>
              <div className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: '120px' }} title="2.0 Hours">
                  <span className="chart-bar-tooltip">2.0h</span>
                </div>
                <span className="chart-day">{t("tue")}</span>
              </div>
              <div className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: '60px' }} title="1.0 Hour">
                  <span className="chart-bar-tooltip">1.0h</span>
                </div>
                <span className="chart-day">{t("wed")}</span>
              </div>
              <div className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: '140px' }} title="2.3 Hours">
                  <span className="chart-bar-tooltip">2.3h</span>
                </div>
                <span className="chart-day">{t("thu")}</span>
              </div>
              <div className="chart-bar-wrapper">
                <div className="chart-bar" style={{ height: '110px' }} title="1.8 Hours">
                  <span className="chart-bar-tooltip">1.8h</span>
                </div>
                <span className="chart-day">{t("fri")}</span>
              </div>
            </div>
          </div>

          {/* Quiz Marks Overview */}
          <div className="glass-card" style={{ marginBottom: '30px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-square-poll-vertical"></i>
                {t("recent_quizzes")}
              </h3>
            </div>
            
            <div className="table-wrapper" style={{ marginTop: 0 }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{t("subject")}</th>
                    <th>{t("quiz_date")}</th>
                    <th>{t("score_got")}</th>
                    <th>{t("grade")}</th>
                    <th>{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {courses && courses.length > 0 ? (
                    courses.map((course) => {
                      const scoreVal = quizScores[String(course.course_id)];
                      const hasScore = scoreVal !== undefined;
                      const displayScore = hasScore ? scoreVal : 80; // Fallback or dynamic
                      const isPassing = displayScore >= 70;

                      return (
                        <tr key={course.course_id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{course.topic}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>2026-07-28</td>
                          <td style={{ fontWeight: 'bold' }}>
                            <span style={{ color: isPassing ? 'var(--primary)' : 'var(--accent)' }}>
                              {hasScore ? `${scoreVal}%` : '80%'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700 }}>
                            {displayScore >= 90 ? 'A+' : displayScore >= 80 ? 'A' : displayScore >= 70 ? 'B' : 'C'}
                          </td>
                          <td>
                            {isPassing ? (
                              <span className="user-badge" style={{ padding: '4px 12px', fontSize: '0.75rem', background: 'rgba(46,125,50,0.1)', color: 'var(--primary)', border: 'none' }}>
                                <i className="fa-solid fa-circle-check" style={{ color: 'var(--primary)', fontSize: '0.8rem' }}></i> {t("passed")}
                              </span>
                            ) : (
                              <span className="user-badge" style={{ padding: '4px 12px', fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none' }}>
                                <i className="fa-solid fa-circle-exclamation" style={{ color: '#ef4444', fontSize: '0.8rem' }}></i> {t("review_needed")}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '30px' }}>{t("no_quizzes")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Learning Progress Section */}
          <div className="glass-card" style={{ marginBottom: '30px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-bars-progress"></i>
                {t("my_progress")}
              </h3>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {courses && courses.length > 0 ? (
                courses.map((course) => {
                  const isCompleted = completedTopics.includes(course.course_id);
                  const percentage = isCompleted ? 100 : (course.subject.includes('Math') ? 75 : 50);

                  return (
                    <div key={course.course_id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        <span>{course.topic}</span>
                        <span style={{ color: 'var(--primary)' }}>{percentage}%</span>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.06)', height: '10px', borderRadius: '5px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.02)' }}>
                        <div style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, var(--primary) 0%, #66bb6a 100%)', height: '100%', borderRadius: '5px', transition: 'width 0.6s ease' }}></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem', padding: '15px 0' }}>No progress tracked yet.</p>
              )}
            </div>
          </div>

          {/* Student Attendance history */}
          <div className="glass-card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-calendar-check"></i>
                {t("attendance_history")}
              </h3>
              <span className="user-badge" style={{ background: 'rgba(46,125,50,0.1)', color: 'var(--primary)', borderColor: 'rgba(46,125,50,0.25)', fontWeight: 700 }}>
                92% Present
              </span>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
              {t("attendance_notice")}
            </p>
            
            <div className="attendance-grid">
              {attendanceRecords.map((record, idx) => (
                <div 
                  key={idx} 
                  className={`attendance-dot ${record.status === 'present' ? 'present' : 'absent'}`} 
                  title={`${record.date}: ${record.status}`}
                >
                  {record.status === 'present' ? '✔' : '✘'}
                </div>
              ))}
              <div className="attendance-dot future" title="Upcoming Class">18</div>
              <div className="attendance-dot future" title="Upcoming Class">19</div>
              <div className="attendance-dot future" title="Upcoming Class">20</div>
              <div className="attendance-dot future" title="Upcoming Class">21</div>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Stats report & weak recommendations */}
        <div className="col-4">
          
          {/* Quick Report */}
          <div className="glass-card card-accent" style={{ marginBottom: '30px' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}><i className="fa-solid fa-chart-pie"></i> {t("quick_report")}</h3>
            </div>
            <div className="stats-grid" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
              <div className="stat-item" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
                <span className="stat-label">{t("total_days")}</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>14 {t("days")}</strong>
              </div>
              <div className="stat-item" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
                <span className="stat-label">{t("avg_score")}</span>
                <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>80%</strong>
              </div>
              <div className="stat-item" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px' }}>
                <span className="stat-label">{t("completed_classes")}</span>
                <strong style={{ fontSize: '1.1rem', color: '#f59e0b' }}>3 {t("courses")}</strong>
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="glass-card" style={{ marginBottom: '30px' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}><i className="fa-solid fa-list-check"></i> {t("today_schedule")}</h3>
            </div>
            <div className="schedule-list" style={{ gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Math - Rational Numbers</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>10:00 AM</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{t("completed")}</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: 'var(--border-radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Science - Crop Production</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>02:00 PM</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 700 }}>{t("active")}</span>
              </div>
            </div>
          </div>

          {/* Weak Subjects & Smart Recommendations */}
          <div className="glass-card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}><i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--accent)' }}></i> {t("weak_subjects")}</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '14px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t("science")} ({t("grade_c")})</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                  {t("science_recommendation_desc")}
                </p>
                <div style={{ marginTop: '10px', fontSize: '0.8rem', background: 'rgba(251,191,36,0.12)', padding: '10px', borderRadius: '8px', color: '#d97706', border: '1px solid rgba(251,191,36,0.25)', lineHeight: 1.5 }}>
                  <i className="fa-solid fa-lightbulb"></i> <strong>{t("recommendation")}:</strong> {t("weak_subject_rec")}
                </div>
              </div>
              
              <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '14px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t("math")} ({t("grade_b")})</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                  {t("math_recommendation_desc")}
                </p>
              </div>
            </div>
            
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '24px', padding: '12px', fontWeight: 700 }} onClick={handleRequestCallback}>
              <i className="fa-solid fa-comment-dots" style={{ color: 'var(--primary)' }}></i> {t("request_callback")}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
