import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function SelectLanguage({ user }) {
  const { locale, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedLang, setSelectedLang] = useState(() => {
    return locale || localStorage.getItem('language') || 'en';
  });

  // If user is already authenticated, redirect to their role dashboard
  useEffect(() => {
    if (user && user.role) {
      navigate(`/dashboard/${user.role.toLowerCase()}`, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    document.body.className = 'bg-language';
    return () => {
      document.body.className = '';
    };
  }, []);

  const languages = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      welcome: 'Welcome',
      desc: 'Learn with AI assistance in English',
      emblem: 'En',
      ariaLabel: 'Select English',
      selectBtn: 'Select'
    },
    {
      code: 'ta',
      name: 'Tamil',
      nativeName: 'தமிழ்',
      welcome: 'வரவேற்கிறோம்',
      desc: 'பாடங்களை தமிழில் எளிதாகக் கற்றுக்கொள்ளுங்கள்',
      emblem: 'அ',
      ariaLabel: 'தமிழ் மொழியைத் தேர்ந்தெடுக்கவும்',
      selectBtn: 'தேர்ந்தெடு'
    },
    {
      code: 'hi',
      name: 'Hindi',
      nativeName: 'हिन्दी',
      welcome: 'स्वागत है',
      desc: 'गणित, विज्ञान और अन्य विषय हिन्दी में सीखें',
      emblem: 'अ',
      ariaLabel: 'हिन्दी भाषा चुनें',
      selectBtn: 'चुनें'
    },
    {
      code: 'te',
      name: 'Telugu',
      nativeName: 'తెలుగు',
      welcome: 'స్వాగతం',
      desc: 'AI సహాయంతో తెలుగులో నేర్చుకోండి',
      emblem: 'తె',
      ariaLabel: 'తెలుగు భాషను ఎంచుకోండి',
      selectBtn: 'ఎంచుకోండి'
    }
  ];

  const handleSelect = (code) => {
    setSelectedLang(code);
    changeLanguage(code);
    localStorage.setItem('language', code);
  };

  const handleContinue = (targetPath = '/login') => {
    if (!selectedLang) return;
    localStorage.setItem('language', selectedLang);
    sessionStorage.setItem('ruraledu_lang_confirmed', 'true');
    localStorage.setItem('language_selected', 'true');
    changeLanguage(selectedLang);

    // If redirected from a protected route, preserve destination
    const destination = location.state?.from?.pathname || targetPath;
    navigate(destination, { replace: true });
  };

  return (
    <div className="onboarding-wrapper" style={{ padding: '24px 16px' }}>
      <div className="lang-selection-card">
        
        {/* Header Branding & Welcome */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '6px 16px', 
              borderRadius: '20px', 
              background: 'rgba(46, 125, 50, 0.1)', 
              color: 'var(--primary)', 
              fontWeight: 600, 
              fontSize: '0.86rem',
              marginBottom: '14px' 
            }}
          >
            <i className="fa-solid fa-graduation-cap"></i>
            <span>RuralEdu • AI Digital Learning Platform</span>
          </div>

          <h1 
            style={{ 
              fontSize: 'clamp(1.8rem, 4vw, 2.35rem)', 
              fontWeight: 800, 
              color: 'var(--text-primary)', 
              lineHeight: 1.25, 
              marginBottom: '8px' 
            }}
          >
            {t('select_language_title')}
          </h1>

          <p 
            style={{ 
              fontSize: 'clamp(0.95rem, 2vw, 1.08rem)', 
              color: 'var(--text-secondary)', 
              maxWidth: '540px', 
              margin: '0 auto',
              lineHeight: 1.5 
            }}
          >
            {t('select_language_subtitle')}
          </p>
        </div>

        {/* 3 Native Language Selection Cards */}
        <div 
          className="language-cards-grid" 
          role="radiogroup" 
          aria-label="Language Options"
        >
          {languages.map((lang) => {
            const isSelected = selectedLang === lang.code;
            return (
              <div
                key={lang.code}
                className={`language-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelect(lang.code)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(lang.code);
                  }
                }}
                tabIndex={0}
                role="radio"
                aria-checked={isSelected}
                aria-label={lang.ariaLabel}
              >
                {isSelected && (
                  <div className="language-card-badge" title="Selected">
                    <i className="fa-solid fa-check"></i>
                  </div>
                )}

                <div>
                  <div className="language-emblem">
                    {lang.emblem}
                  </div>
                  <div className="language-name">
                    {lang.nativeName}
                  </div>
                  <div className="language-welcome">
                    {lang.welcome}
                  </div>
                </div>

                <div className="language-desc">
                  {lang.desc}
                </div>

                <div style={{ marginTop: '14px' }}>
                  <span 
                    style={{
                      display: 'inline-block',
                      padding: '4px 14px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      background: isSelected ? 'var(--primary)' : 'rgba(0,0,0,0.06)',
                      color: isSelected ? 'white' : 'var(--text-secondary)',
                      transition: 'all 0.25s ease'
                    }}
                  >
                    {isSelected ? `✓ ${t('selected')}` : (lang.selectBtn || 'Select')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="continue-btn-wrapper">
          <button
            type="button"
            className="btn-continue"
            onClick={() => handleContinue('/login')}
            disabled={!selectedLang}
          >
            <span>{t('continue')}</span>
            <i className="fa-solid fa-arrow-right"></i>
          </button>

          <div style={{ textAlign: 'center', marginTop: '6px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
              {t('register_prompt')}{' '}
            </span>
            <button
              type="button"
              onClick={() => handleContinue('/register')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0 4px'
              }}
            >
              {t('register_now')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
