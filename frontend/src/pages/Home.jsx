import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Home({ user }) {
  const { t } = useLanguage();

  useEffect(() => {
    document.body.className = 'bg-landing';
    return () => {
      document.body.className = '';
    };
  }, []);

  return (
    <div>
      <div className="hero-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', textAlign: 'center', color: 'white', padding: '60px 20px' }}>
        <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '40px', borderRadius: 'var(--border-radius-lg)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', maxWidth: '800px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: 'var(--shadow-lg)' }}>
          <div className="logo-icon" style={{ margin: '0 auto 20px', width: '60px', height: '60px', fontSize: '1.8rem' }}>
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: '800', lineHeight: '1.2', marginBottom: '16px', background: 'linear-gradient(135deg, #ffffff, #e2e8f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {t("learn_without_limits")}
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)', color: 'var(--accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '24px' }}>
            {t("hero_subheading")}
          </p>
          <p style={{ fontSize: '1.05rem', color: '#f1f5f9', marginBottom: '36px', lineHeight: '1.7', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            {t("about_text")}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link to={`/dashboard/${user.role.toLowerCase()}`} className="btn btn-primary">
                <i className="fa-solid fa-gauge"></i>
                <span>{t("dashboard")}</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  <i className="fa-solid fa-circle-play"></i>
                  <span>{t("get_started")}</span>
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  <i className="fa-solid fa-right-to-bracket"></i>
                  <span>{t("login")}</span>
                </Link>
              </>
            )}
            <a href="#features" className="btn btn-secondary" style={{ background: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)', color: 'white' }}>
              <i className="fa-solid fa-circle-info"></i>
              <span>{t("about")}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" style={{ padding: '80px 0', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(15px)', borderRadius: 'var(--border-radius-lg)', marginTop: '40px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px', padding: '0 20px' }}>
          <h2 style={{ fontSize: '2.25rem', color: 'var(--primary)', fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
            {t("ai_features")}
          </h2>
          <div style={{ width: '80px', height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))', margin: '0 auto 16px', borderRadius: '2px' }}></div>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            {t("features_desc")}
          </p>
        </div>

        <div className="course-grid" style={{ padding: '0 40px' }}>
          {/* Feature 1: AI Learning */}
          <div className="course-card english">
            <div className="course-icon-banner">
              <i className="fa-solid fa-robot"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {t("ai_learning")}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {t("ai_learning_desc")}
            </p>
          </div>

          {/* Feature 2: Offline Learning */}
          <div className="course-card math">
            <div className="course-icon-banner">
              <i className="fa-solid fa-wifi-slash"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {t("offline_learning")}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {t("offline_learning_desc")}
            </p>
          </div>

          {/* Feature 3: Quizzes */}
          <div className="course-card">
            <div className="course-icon-banner" style={{ background: 'rgba(46, 125, 50, 0.1)', color: 'var(--primary)' }}>
              <i className="fa-solid fa-square-poll-vertical"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {t("quiz")}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {t("quiz_desc")}
            </p>
          </div>

          {/* Feature 4: Voice Learning */}
          <div className="course-card english">
            <div className="course-icon-banner">
              <i className="fa-solid fa-volume-high"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {t("voice_learning")}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {t("voice_learning_desc")}
            </p>
          </div>

          {/* Feature 5: Parents Monitoring */}
          <div className="course-card math">
            <div className="course-icon-banner">
              <i className="fa-solid fa-users"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {t("parents_monitoring")}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {t("parents_monitoring_desc")}
            </p>
          </div>

          {/* Feature 6: Multilingual Learning */}
          <div className="course-card">
            <div className="course-icon-banner" style={{ background: 'rgba(46, 125, 50, 0.1)', color: 'var(--primary)' }}>
              <i className="fa-solid fa-globe"></i>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              {t("multilingual_learning")}
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {t("multilingual_learning_desc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
