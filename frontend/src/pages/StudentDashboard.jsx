import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function StudentDashboard({ user }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [activeCourse, setActiveCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('video'); // video, notes, quiz, download

  // Quiz submission state
  const [quizAnswers, setQuizAnswers] = useState({});
  
  // AI Simulation states
  const [aiSummary, setAiSummary] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);

  useEffect(() => {
    document.body.className = 'bg-dashboard';
    fetchDashboardData();
    return () => {
      document.body.className = '';
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('http://localhost:5000/student/dashboard', {
        headers: {
          'Cache-Control': 'no-cache'
        },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else if (res.status === 401 || res.status === 403) {
        navigate('/login');
      }
    } catch (err) {
      console.error("Error fetching student dashboard:", err);
    }
  };

  const handleUpdateProgress = async (courseId, quizScore = null) => {
    try {
      const res = await fetch('http://localhost:5000/update-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          course_id: courseId,
          score: quizScore
        })
      });
      if (res.ok) {
        fetchDashboardData(); // Reload progress stats
      }
    } catch (err) {
      console.error("Error saving student progress:", err);
    }
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (!activeCourse || !activeCourse.quiz || activeCourse.quiz.length === 0) return;

    let correctCount = 0;
    activeCourse.quiz.forEach((q, idx) => {
      if (quizAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const scorePercentage = Math.round((correctCount / activeCourse.quiz.length) * 100);
    alert(`${t("flash_quiz_submitted")} You answered ${correctCount}/${activeCourse.quiz.length} correctly (${scorePercentage}%).`);

    handleUpdateProgress(activeCourse.course_id, scorePercentage);
  };

  const simulateAISummary = () => {
    setGeneratingSummary(true);
    setAiSummary('');
    setTimeout(() => {
      setGeneratingSummary(false);
      setAiSummary('done');
    }, 1200);
  };

  const simulateVoiceSpeech = () => {
    alert(t("tts_simulation_msg"));
  };

  if (!dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
        <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Loading Dashboard...</p>
      </div>
    );
  }

  const { profile, courses, progress } = dashboardData;
  const completedTopics = progress.completed_topics || [];
  
  // Calculate average progress percentage
  const totalTopics = courses.length;
  const completedCount = courses.filter(c => completedTopics.includes(c.course_id)).length;
  const overallPercentage = totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0;
  
  // SVG progress ring offset logic: circumference = 2 * pi * r = 2 * 3.14 * 60 = 377
  const ringOffset = 377 - (377 * (overallPercentage || 72)) / 100;

  // View course detail or list
  if (activeCourse) {
    return (
      <div>
        <div style={{ marginBottom: '24px' }}>
          <button 
            onClick={() => { setActiveCourse(null); setQuizAnswers({}); setAiSummary(''); }}
            className="btn btn-secondary btn-sm" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: 'none', background: 'transparent', padding: 0, color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <span>{t("home")} / {t("dashboard")}</span>
          </button>
          
          <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--primary)' }}>{activeCourse.topic}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>{activeCourse.class} • {activeCourse.subject} • {activeCourse.chapter}</p>
            </div>
            <span className="user-badge" style={{ background: 'rgba(46,125,50,0.1)', borderColor: 'rgba(46,125,50,0.25)', color: 'var(--primary)', fontWeight: 700, fontSize: '0.95rem' }}>
              {activeCourse.class}
            </span>
          </div>
        </div>

        {/* Navigation Tabs for Course Materials */}
        <div className="auth-tabs" style={{ marginBottom: '30px' }}>
          <button className={`auth-tab ${activeTab === 'video' ? 'active' : ''}`} onClick={() => setActiveTab('video')}>
            <i className="fa-solid fa-circle-play" style={{ marginRight: '4px' }}></i> {t("video_lesson")}
          </button>
          <button className={`auth-tab ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>
            <i className="fa-solid fa-file-pdf" style={{ marginRight: '4px' }}></i> {t("notes")}
          </button>
          <button className={`auth-tab ${activeTab === 'quiz' ? 'active' : ''}`} onClick={() => setActiveTab('quiz')}>
            <i className="fa-solid fa-circle-question" style={{ marginRight: '4px' }}></i> {t("quiz")}
          </button>
          <button className={`auth-tab ${activeTab === 'download' ? 'active' : ''}`} onClick={() => setActiveTab('download')}>
            <i className="fa-solid fa-download" style={{ marginRight: '4px' }}></i> {t("save")}
          </button>
        </div>

        <div className="dashboard-grid" style={{ marginTop: 0 }}>
          
          {/* MAIN CONTENT VIEW (Left column) */}
          <div className="col-8">
            
            {/* ==================== VIDEO TAB ==================== */}
            {activeTab === 'video' && (
              <div className="glass-card">
                <div className="card-header">
                  <h3 class="card-title"><i className="fa-solid fa-play"></i> {t("video_lesson")}</h3>
                </div>
                
                <div style={{ background: '#000', borderRadius: 'var(--border-radius-md)', overflow: 'hidden', position: 'relative', aspectRatio: '16/9', marginBottom: '24px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                    title="Video Player"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
                <h4 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{activeCourse.topic}</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '20px' }}>
                  <i className="fa-solid fa-clock"></i> {t("duration")}: 12 mins
                </p>

                {/* AI features */}
                <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  {/* AI Summary */}
                  <div style={{ background: 'rgba(46,125,50,0.04)', border: '1px solid var(--border-color)', padding: '20px', borderRadius: 'var(--border-radius-md)' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '10px' }}>
                      <i className="fa-solid fa-wand-magic-sparkles"></i> {t("ai_summary")}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {t("ai_summary_placeholder")}
                    </p>
                    <button className="btn btn-primary btn-sm" onClick={simulateAISummary}>
                      <i className="fa-solid fa-gears"></i> {t("generate_summary")}
                    </button>
                    {generatingSummary && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '16px', borderLeft: '3px solid var(--primary)', paddingLeft: '12px', lineHeight: 1.5 }}>
                        <i className="fa-solid fa-spinner fa-spin"></i> {t("analyzing_content")}
                      </div>
                    )}
                    {aiSummary === 'done' && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '16px', borderLeft: '3px solid var(--primary)', paddingLeft: '12px', lineHeight: 1.5 }}>
                        <strong style={{ color: 'var(--primary)' }}><i className="fa-solid fa-wand-magic-sparkles"></i> {t("ai_summary_insights")}</strong>
                        <ul style={{ marginTop: '6px', paddingLeft: '20px' }}>
                          <li><strong>{t("key_concept")}</strong> {t("main_formulas_desc")}</li>
                          <li><strong>{t("real_world_example")}</strong> {t("rural_app_desc")}</li>
                          <li><strong>{t("summary_advice")}</strong> {t("practice_advice_desc")}</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Voice tutoring assistant */}
                  <div style={{ background: 'rgba(255, 193, 7, 0.06)', border: '1px solid rgba(255, 193, 7, 0.25)', padding: '20px', borderRadius: 'var(--border-radius-md)' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#b45309', marginBottom: '10px' }}>
                      <i className="fa-solid fa-volume-high"></i> {t("voice_assistant")}
                    </h4>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {t("voice_placeholder")}
                    </p>
                    <button className="btn btn-accent btn-sm" onClick={simulateVoiceSpeech} style={{ color: '#1e293b' }}>
                      <i className="fa-solid fa-circle-play"></i> {t("play_explanation")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== NOTES TAB ==================== */}
            {activeTab === 'notes' && (
              <div className="glass-card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-file-invoice"></i> {t("pdf_viewer")}</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="schedule-item" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <i className="fa-solid fa-file-pdf" style={{ fontSize: '2.6rem', color: '#ef4444' }}></i>
                      <div>
                        <div className="schedule-title">{activeCourse.topic} Revision Notes</div>
                        <div className="schedule-subtitle">{t("pdf_notes_subtitle")}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <button onClick={() => { handleUpdateProgress(activeCourse.course_id); alert('Opening PDF viewer...'); }} className="btn btn-secondary btn-sm" style={{ padding: '10px 18px' }}>
                        <i className="fa-solid fa-eye"></i> {t("view")}
                      </button>
                      <button onClick={() => { handleUpdateProgress(activeCourse.course_id); alert('Simulated PDF Download complete.'); }} className="btn btn-primary btn-sm" style={{ padding: '10px 18px' }}>
                        <i className="fa-solid fa-download"></i> {t("save")}
                      </button>
                    </div>
                  </div>
                  <div style={{ borderLeft: '4px solid var(--primary)', paddingLeft: '14px', background: 'rgba(46,125,50,0.02)', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ fontWeight: 700, color: 'var(--primary)' }}>Notes Preview Summary:</h4>
                    <p style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)', marginTop: '8px' }}>
                      {activeCourse.notes || "No preview notes compiled."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== QUIZ TAB ==================== */}
            {activeTab === 'quiz' && (
              <div className="glass-card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-circle-question"></i> {t("quiz")}</h3>
                </div>
                
                {activeCourse.quiz && activeCourse.quiz.length > 0 ? (
                  <form onSubmit={handleQuizSubmit}>
                    {activeCourse.quiz.map((q, idx) => (
                      <div key={idx} style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                        <p style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '16px', display: 'flex', gap: '8px', color: 'var(--text-primary)' }}>
                          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>Q{idx + 1}.</span>
                          <span>{q.question}</span>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {q.options.map((opt, oIdx) => (
                            <label 
                              key={oIdx} 
                              className="checkbox-container" 
                              style={{ 
                                background: quizAnswers[idx] === opt ? 'rgba(46, 125, 50, 0.08)' : 'rgba(255,255,255,0.7)', 
                                border: quizAnswers[idx] === opt ? '1.5px solid var(--primary)' : '1.5px solid var(--border-color)',
                                padding: '14px 20px', 
                                borderRadius: 'var(--border-radius-md)', 
                                fontSize: '0.98rem', 
                                transition: 'var(--transition-smooth)',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <input 
                                type="radio" 
                                name={`question_${idx}`} 
                                value={opt} 
                                checked={quizAnswers[idx] === opt}
                                onChange={() => setQuizAnswers({ ...quizAnswers, [idx]: opt })}
                                required 
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              <span style={{ marginLeft: '10px' }}>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <button type="submit" className="btn btn-accent" style={{ padding: '14px 40px', color: '#1e293b' }}>
                      <i className="fa-solid fa-paper-plane"></i> {t("submit_answers")}
                    </button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
                    <i className="fa-solid fa-list-check" style={{ fontSize: '3.5rem', color: 'var(--text-muted)', marginBottom: '20px' }}></i>
                    <p style={{ fontSize: '1.1rem' }}>{t("no_quiz")}</p>
                  </div>
                )}
              </div>
            )}

            {/* ==================== DOWNLOADS TAB ==================== */}
            {activeTab === 'download' && (
              <div className="glass-card">
                <div className="card-header">
                  <h3 className="card-title"><i className="fa-solid fa-download"></i> {t("save_offline_resources")}</h3>
                </div>
                
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.98rem', lineHeight: '1.6' }}>
                  {t("offline_desc_detail")}
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="schedule-item" style={{ justifyContent: 'space-between', padding: '16px 20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <i className="fa-solid fa-file-pdf" style={{ fontSize: '2rem', color: '#ef4444' }}></i>
                      <div>
                        <div className="schedule-title" style={{ fontSize: '0.95rem' }}>{activeCourse.topic} PDF Revision notes</div>
                        <div className="schedule-subtitle" style={{ fontSize: '0.8rem' }}>{t("pdf_doc_detail")}</div>
                      </div>
                    </div>
                    <button onClick={() => { handleUpdateProgress(activeCourse.course_id); alert("Notes PDF downloaded."); }} className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>
                      <i className="fa-solid fa-cloud-arrow-down" style={{ color: 'var(--primary)' }}></i> {t("save")}
                    </button>
                  </div>
                  
                  <div className="schedule-item" style={{ justifyContent: 'space-between', padding: '16px 20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <i className="fa-solid fa-circle-play" style={{ fontSize: '2rem', color: 'var(--secondary)' }}></i>
                      <div>
                        <div className="schedule-title" style={{ fontSize: '0.95rem' }}>{t("lesson")} 1 {t("video_material")}</div>
                        <div className="schedule-subtitle" style={{ fontSize: '0.8rem' }}>{t("offline_viewing_desc")}</div>
                      </div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => { handleUpdateProgress(activeCourse.course_id); alert(t('video_cached_msg')); }} style={{ padding: '8px 16px' }}>
                      <i className="fa-solid fa-cloud-arrow-down" style={{ color: 'var(--primary)' }}></i> {t("save")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Outlines & Tips */}
          <div className="col-4">
            
            <div className="glass-card card-primary" style={{ marginBottom: '24px' }}>
              <div className="card-header" style={{ marginBottom: '16px' }}>
                <h3 className="card-title" style={{ fontSize: '1.15rem' }}><i className="fa-solid fa-list-ol"></i> Syllabus Contents</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.7)', border: '1.5px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <i className="fa-solid fa-play-circle" style={{ color: 'var(--primary)', fontSize: '1.35rem' }}></i>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{activeCourse.chapter}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{activeCourse.topic}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
                <i className="fa-solid fa-circle-info" style={{ color: 'var(--accent)' }}></i>
                {t("study_tip")}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {t("study_tip_desc")}
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Dashboard landing page
  return (
    <div>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '6px', color: 'var(--primary)' }}>
            {t("hello_student")}, {profile.name}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
            {t("today_schedule")}
          </p>
        </div>
        <div className="user-badge" style={{ background: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.2)', color: '#d97706', padding: '10px 20px', fontSize: '1rem', borderRadius: '30px' }}>
          <i className="fa-solid fa-fire" style={{ color: '#f59e0b', fontSize: '1.25rem' }}></i>
          <span><strong>5 {t("days")}</strong> {t("today_streak")}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* LEFT PANEL: Course Cards */}
        <div className="col-8">
          
          <div className="glass-card card-primary" style={{ marginBottom: '30px', background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(46,125,50,0.05))' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-lightbulb"></i>
                {t("daily_motivation")}
              </h3>
            </div>
            <p style={{ fontSize: '1.1rem', fontStyle: 'italic', color: 'var(--primary)', fontWeight: 500, marginBottom: '12px', lineHeight: '1.6' }}>
              "{t("daily_quote")}"
            </p>
            <div style={{ display: 'flex', gap: '24px', marginTop: '20px', borderTop: '1px solid rgba(46,125,50,0.1)', paddingTop: '16px', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>{t("today_goal")}</span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}><i className="fa-solid fa-circle-check" style={{ color: 'var(--primary)', marginRight: '4px' }}></i> {t("today_goal_desc")}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>{t("recommended_course")}</span>
                <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}><i className="fa-solid fa-star" style={{ color: 'var(--accent)', marginRight: '4px' }}></i> {t("recommended_course_desc")}</strong>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: '30px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-book-open"></i>
                {t("enrolled_courses")} ({profile.class})
              </h3>
            </div>
            
            {courses && courses.length > 0 ? (
              <div className="course-grid">
                {courses.map((course) => {
                  const isMath = course.subject.toLowerCase().includes('math');
                  const isSci = course.subject.toLowerCase().includes('science') || course.subject.toLowerCase().includes('crop');
                  const isCompleted = completedTopics.includes(course.course_id);
                  const progressPct = isCompleted ? 100 : (isMath ? 75 : isSci ? 50 : 90);

                  return (
                    <div key={course.course_id} className={`course-card ${isMath ? 'math' : isSci ? 'science' : 'english'}`}>
                      <div className="course-icon-banner">
                        {isMath ? (
                          <i className="fa-solid fa-calculator"></i>
                        ) : isSci ? (
                          <i className="fa-solid fa-flask"></i>
                        ) : (
                          <i className="fa-solid fa-language"></i>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{course.topic}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', minHeight: '48px', marginBottom: '20px', lineHeight: '1.6' }}>
                        {course.subject} • {course.chapter}
                      </p>
                      
                      {/* Progress Bar */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                          <span>{t("progress")}</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="progress-track" style={{ height: '6px' }}>
                          <div 
                            className="progress-fill" 
                            style={{ 
                              width: `${progressPct}%`, 
                              background: isCompleted ? 'var(--primary)' : (isMath ? 'var(--accent)' : 'var(--secondary)') 
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="course-actions">
                        <button onClick={() => { setActiveCourse(course); setActiveTab('video'); }} className="btn btn-primary btn-sm" title={t('video_lesson')}>
                          <i className="fa-solid fa-circle-play"></i> {t("watch")}
                        </button>
                        <button onClick={() => { setActiveCourse(course); setActiveTab('notes'); }} className="btn btn-secondary btn-sm" title={t('pdf_viewer')}>
                          <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444' }}></i> {t("notes")}
                        </button>
                        <button onClick={() => { setActiveCourse(course); setActiveTab('quiz'); }} className="btn btn-accent btn-sm" style={{ color: '#1e293b' }} title={t('quiz')}>
                          <i className="fa-solid fa-circle-question"></i> {t("quiz")}
                        </button>
                        <button onClick={() => { setActiveCourse(course); setActiveTab('download'); }} className="btn btn-secondary btn-sm" title={t('save_offline_resources')}>
                          <i className="fa-solid fa-download" style={{ color: 'var(--primary)' }}></i> {t("save")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: '3.5rem', marginBottom: '16px', color: 'var(--text-muted)' }}></i>
                <p style={{ fontSize: '1.05rem' }}>{t("no_courses")}</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Stats ring, Achievements & Leaderboard */}
        <div className="col-4">
          {/* Circular Progress Card */}
          <div className="glass-card card-accent" style={{ marginBottom: '30px', textAlign: 'center' }}>
            <div className="card-header" style={{ justifyContent: 'center', marginBottom: '20px' }}>
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
                <i className="fa-solid fa-chart-pie"></i>
                {t("today_progress")}
              </h3>
            </div>
            
            <div className="circular-progress-wrapper">
              <svg className="circular-progress-svg" width="140" height="140">
                <circle className="circular-progress-bg" cx="70" cy="70" r="60" />
                <circle 
                  className="circular-progress-bar" 
                  cx="70" 
                  cy="70" 
                  r="60" 
                  style={{ strokeDashoffset: ringOffset }} 
                />
              </svg>
              <div className="circular-progress-text">{overallPercentage || 72}%</div>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '16px' }}>
              {completedCount > 0 ? `Awesome! You completed ${completedCount} topics so far.` : t("today_progress_desc")}
            </p>
          </div>

          {/* Achievements */}
          <div className="glass-card" style={{ marginBottom: '30px' }}>
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
                <i className="fa-solid fa-trophy" style={{ color: 'var(--accent)' }}></i>
                {t("achievements")}
              </h3>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', width: '80px' }} title="Completed 5 daily study streaks">
                <div style={{ width: '50px', height: '50px', background: 'rgba(251, 191, 36, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '1.4rem', color: '#d97706', border: '1.5px solid var(--accent)' }}>
                  <i className="fa-solid fa-fire-flame-simple"></i>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t("achievement_streak")}</span>
              </div>
              <div style={{ textAlign: 'center', width: '80px' }} title="Scored 100% in a quiz">
                <div style={{ width: '50px', height: '50px', background: 'rgba(46, 125, 50, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '1.4rem', color: 'var(--primary)', border: '1.5px solid var(--primary)' }}>
                  <i className="fa-solid fa-star"></i>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t("achievement_quiz")}</span>
              </div>
              <div style={{ textAlign: 'center', width: '80px' }} title="Study 10+ hours offline">
                <div style={{ width: '50px', height: '50px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px', fontSize: '1.4rem', color: '#2563eb', border: '1.5px solid #2563eb' }}>
                  <i className="fa-solid fa-download"></i>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{t("achievement_offline")}</span>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="glass-card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
                <i className="fa-solid fa-ranking-star"></i>
                {t("leaderboard")}
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'rgba(251,191,36,0.1)', border: '1.5px solid var(--accent)', borderRadius: '8px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 800, color: '#d97706', fontSize: '1.1rem' }}>1.</span>
                  <strong style={{ fontSize: '0.9rem' }}>{profile.name} ({t("you")})</strong>
                </div>
                <span style={{ fontWeight: 700, color: '#d97706', fontSize: '0.95rem' }}>920 XP</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}>2.</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Priya Singh</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>880 XP</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '8px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '1rem' }}>3.</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Amit Patel</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>850 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
