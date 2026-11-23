import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';

// Import Pages
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import SelectLanguage from './pages/SelectLanguage';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ user, allowedRoles, sessionLoading, children }) {
  const location = useLocation();

  if (sessionLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
        <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Verifying Session...</p>
      </div>
    );
  }

  if (!user) {
    // If not authenticated, ensure language selection is completed first
    const langConfirmed = sessionStorage.getItem('ruraledu_lang_confirmed') === 'true';
    if (!langConfirmed) {
      return <Navigate to="/select-language" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />;
  }

  return children;
}

// Enforces Language Selection before reaching Login or Registration
function RequireLanguageSelection({ user, sessionLoading, children }) {
  const location = useLocation();

  if (sessionLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
        <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Loading RuralEdu...</p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />;
  }

  const langConfirmed = sessionStorage.getItem('ruraledu_lang_confirmed') === 'true';
  if (!langConfirmed) {
    return <Navigate to="/select-language" state={{ from: location }} replace />;
  }

  return children;
}

function AppContent({ user, setUser, darkMode, setDarkMode, sessionLoading }) {
  const { t, locale, changeLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Chatbot panel state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: t("ai_tutor_desc") },
    { sender: 'ai', text: `${t("ai_summary_placeholder")} (Gemini Integration Architectural Placeholder).`, isInfo: true }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Handle Logout
  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        alert(t("flash_logout_success"));
        setUser(null);
        navigate('/login');
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Toggle theme mode
  const toggleDarkMode = () => {
    const nextVal = !darkMode;
    setDarkMode(nextVal);
    localStorage.setItem('darkTheme', nextVal ? 'true' : 'false');
    if (nextVal) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  };

  // Send message to AI assistant
  const handleSendAIMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    // Simulate response delay
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev,
        { sender: 'ai', text: "This is a smart tutor placeholder. The Google Gemini API connection will handle dynamic tutoring and explanations in the next review." }
      ]);
      // Scroll to bottom
      const chatBody = document.getElementById('aiChatBody');
      if (chatBody) {
        chatBody.scrollTop = chatBody.scrollHeight;
      }
    }, 800);
  };

  return (
    <>
      {/* Navigation Header */}
      <nav className="app-nav">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <span className="logo-text">{t("logo_text")}</span>
        </Link>

        {/* Public Tabs Links */}
        <div className="nav-links">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
            <i className="fa-solid fa-house"></i>
            <span>{t("home")}</span>
          </Link>
          <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
            <i className="fa-solid fa-circle-info"></i>
            <span>{t("about")}</span>
          </Link>
          <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
            <i className="fa-solid fa-envelope"></i>
            <span>{t("contact")}</span>
          </Link>
        </div>

        {/* Actions bar: Dropdown language, toggle themes & login/logout buttons */}
        <div className="nav-actions">
          {/* Theme switcher */}
          <button 
            id="darkModeToggle" 
            onClick={toggleDarkMode}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '8px' }}
          >
            {darkMode ? (
              <i className="fa-solid fa-sun" style={{ color: 'var(--accent)' }}></i>
            ) : (
              <i className="fa-solid fa-moon"></i>
            )}
          </button>

          {/* Persistent global language selection dropdown */}
          <div className="lang-dropdown">
            <span style={{ cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-globe"></i>
              <span style={{ textTransform: 'uppercase' }}>{locale}</span>
              <i className="fa-solid fa-chevron-down" style={{ fontSize: '0.7rem' }}></i>
            </span>
            <div className="lang-dropdown-content">
              <a href="#" onClick={(e) => { e.preventDefault(); changeLanguage('en'); }}>English</a>
              <a href="#" onClick={(e) => { e.preventDefault(); changeLanguage('ta'); }}>தமிழ் (Tamil)</a>
              <a href="#" onClick={(e) => { e.preventDefault(); changeLanguage('hi'); }}>हिन्दी (Hindi)</a>
              <a href="#" onClick={(e) => { e.preventDefault(); changeLanguage('te'); }}>తెలుగు (Telugu)</a>
            </div>
          </div>

          {user ? (
            <>
              <span className="user-badge" title="User Profile">
                <i className="fa-solid fa-user"></i>
                <span>{user.name} ({user.role})</span>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ padding: '10px 18px' }}>
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>{t("logout")}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/select-language" className="btn btn-secondary btn-sm" style={{ padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-language"></i>
                <span>{t("language")}</span>
              </Link>
              <Link to="/login" className="btn btn-primary btn-sm" style={{ padding: '10px 18px' }}>
                <i className="fa-solid fa-right-to-bracket"></i>
                <span>{t("login")}</span>
              </Link>
              <Link to="/register" className="btn btn-secondary btn-sm" style={{ padding: '10px 18px' }}>
                <i className="fa-solid fa-user-plus"></i>
                <span>{t("register")}</span>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="app-container">
        <Routes>
          {/* Language Selection Route */}
          <Route path="/select-language" element={<SelectLanguage user={user} />} />

          {/* Root Application Launch Route: Unauthenticated goes to Language Selection, Authenticated goes to Role Dashboard */}
          <Route 
            path="/" 
            element={
              sessionLoading ? (
                <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-secondary)' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--primary)' }}></i>
                  <p style={{ marginTop: '20px', fontSize: '1.2rem', fontWeight: 600 }}>Loading RuralEdu...</p>
                </div>
              ) : user ? (
                <Navigate to={`/dashboard/${user.role.toLowerCase()}`} replace />
              ) : (
                <Navigate to="/select-language" replace />
              )
            } 
          />

          <Route path="/home" element={<Home user={user} />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Authentication Routes - Enforce Language Selection First */}
          <Route 
            path="/login" 
            element={
              <RequireLanguageSelection user={user} sessionLoading={sessionLoading}>
                <Login onLoginSuccess={setUser} />
              </RequireLanguageSelection>
            } 
          />
          <Route 
            path="/register" 
            element={
              <RequireLanguageSelection user={user} sessionLoading={sessionLoading}>
                <Register />
              </RequireLanguageSelection>
            } 
          />

          {/* Role-Based Protected Dashboards */}
          <Route 
            path="/dashboard/student" 
            element={
              <ProtectedRoute user={user} allowedRoles={['Student']} sessionLoading={sessionLoading}>
                <StudentDashboard user={user} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/parent" 
            element={
              <ProtectedRoute user={user} allowedRoles={['Parent']} sessionLoading={sessionLoading}>
                <ParentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard/admin" 
            element={
              <ProtectedRoute user={user} allowedRoles={['Admin']} sessionLoading={sessionLoading}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)', marginTop: '60px', fontSize: '0.9rem', borderTop: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)' }}>
        <p>{t("footer_text")}</p>
      </footer>

      {/* Global Floating AI Assistant (Only for logged-in students or parents) */}
      {user && (user.role === 'Student' || user.role === 'Parent') && (
        <>
          <div className="ai-assistant-btn" onClick={() => setShowAIPanel(!showAIPanel)} title="Ask AI Assistant">
            <i className="fa-solid fa-robot"></i>
          </div>

          <div className={`ai-assistant-panel ${showAIPanel ? 'open' : ''}`} id="aiPanel">
            <div className="ai-panel-header">
              <span className="ai-panel-title">
                <i className="fa-solid fa-robot" style={{ color: 'var(--primary)' }}></i>
                {t("ai_learning")}
              </span>
              <button onClick={() => setShowAIPanel(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="ai-panel-body" id="aiChatBody">
              {chatMessages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`ai-bubble ${msg.sender === 'ai' ? 'incoming' : 'outgoing'}`}
                  style={msg.isInfo ? { fontSize: '0.8rem', color: 'var(--accent)', background: 'rgba(0,0,0,0.05)', borderLeft: '3px solid var(--accent)' } : {}}
                >
                  {msg.sender === 'ai' && !msg.isInfo && <><i className="fa-solid fa-robot"></i>&nbsp;</>}
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendAIMessage} className="ai-panel-footer">
              <input 
                type="text" 
                className="ai-input" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={t('chatbot_placeholder')} 
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '10px 14px' }}>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkTheme') === 'true';
  });

  useEffect(() => {
    // Initial verification of session from backend
    verifySession();
    
    // Set initial theme
    if (darkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }, []);

  const verifySession = async () => {
    try {
      const res = await fetch('http://localhost:5000/session', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.logged_in) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.error("Session verification failed:", err);
    } finally {
      setSessionLoading(false);
    }
  };

  return (
    <Router>
      <AppContent 
        user={user} 
        setUser={setUser} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        sessionLoading={sessionLoading}
      />
    </Router>
  );
}
