import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function Contact() {
  const { t } = useLanguage();

  useEffect(() => {
    document.body.className = 'bg-dashboard';
    return () => {
      document.body.className = '';
    };
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    alert(t("message_sent"));
    e.target.reset();
  };

  return (
    <div className="glass-card card-accent" style={{ maxWidth: '600px', margin: '40px auto', padding: '40px' }}>
      <div className="card-header" style={{ justifyContent: 'center', textAlign: 'center', marginBottom: '24px' }}>
        <h2 className="card-title" style={{ fontSize: '2rem', color: 'var(--primary)' }}>
          <i className="fa-solid fa-envelope" style={{ fontSize: '1.8rem', marginRight: '8px' }}></i>
          {t("contact_title")}
        </h2>
      </div>
      
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '0.98rem', lineHeight: '1.6' }}>
        {t("contact_desc")}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.5)', padding: '16px 20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <i className="fa-solid fa-envelope" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}></i>
          <div>
            <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t("email")}</strong>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>support@ruraledu.com</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.5)', padding: '16px 20px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)' }}>
          <i className="fa-solid fa-phone" style={{ fontSize: '1.4rem', color: 'var(--primary)' }}></i>
          <div>
            <strong style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{t("mobile_number")}</strong>
            <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>+91 98765 43210</span>
          </div>
        </div>
      </div>

      {/* Simulation form */}
      <form onSubmit={handleFormSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
        <div className="form-group">
          <label>{t("full_name")}</label>
          <div className="form-control-wrapper">
            <i className="fa-solid fa-user input-icon"></i>
            <input type="text" className="form-control" required placeholder="e.g. John Doe" />
          </div>
        </div>
        <div className="form-group">
          <label>{t("email_address")}</label>
          <div className="form-control-wrapper">
            <i className="fa-solid fa-envelope input-icon"></i>
            <input type="email" className="form-control" required placeholder="e.g. john@example.com" />
          </div>
        </div>
        <div className="form-group">
          <label>{t("description")}</label>
          <textarea className="form-control" rows="4" required style={{ paddingLeft: '16px', resize: 'none' }} placeholder="Type your message here..."></textarea>
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px', padding: '14px' }}>
          <i className="fa-solid fa-paper-plane"></i>
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
