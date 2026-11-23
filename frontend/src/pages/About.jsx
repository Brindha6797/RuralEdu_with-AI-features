import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  useEffect(() => {
    document.body.className = 'bg-dashboard';
    return () => {
      document.body.className = '';
    };
  }, []);

  return (
    <div className="glass-card card-primary" style={{ maxWidth: '800px', margin: '40px auto', padding: '40px' }}>
      <div className="card-header" style={{ justifyContent: 'center', textAlign: 'center', marginBottom: '30px' }}>
        <h2 className="card-title" style={{ fontSize: '2rem', color: 'var(--primary)' }}>
          <i className="fa-solid fa-circle-info" style={{ fontSize: '1.8rem', marginRight: '8px' }}></i>
          {t("about_title")}
        </h2>
      </div>
      
      <div style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-primary)', textAlign: 'center', marginBottom: '24px' }}>
        <p>{t("about_text")}</p>
      </div>

      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', textAlign: 'center', marginTop: '30px' }}>
        <h4 style={{ fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '12px', fontWeight: '700' }}>
          {t("ai_branding_title")}
        </h4>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          {t("footer_text")}
        </p>
      </div>
    </div>
  );
}
