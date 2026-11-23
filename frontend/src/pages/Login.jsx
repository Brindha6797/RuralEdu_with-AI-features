import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Login({ onLoginSuccess }) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('Student'); // Student, Parent, Admin
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Forgot Password Modal state
  const [showModal, setShowModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');

  useEffect(() => {
    document.body.className = 'bg-login';
    return () => {
      document.body.className = '';
    };
  }, []);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setIdentifier('');
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier,
          password,
          role
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || t("flash_invalid_credentials"));
        return;
      }

      // Success
      alert(role === 'Student' ? t("flash_login_success") : role === 'Parent' ? t("flash_parent_login_success") : t("flash_admin_login_success"));
      onLoginSuccess(data.user);
      navigate(`/dashboard/${role.toLowerCase()}`);

    } catch (err) {
      console.error(err);
      setErrorMsg(t("flash_db_error"));
    }
  };

  const handleForgotPasswordSubmit = () => {
    if (!forgotInput.trim()) {
      alert(t("forgot_password_error"));
      return;
    }
    alert(`${t("forgot_password_success")} ${forgotInput}`);
    setShowModal(false);
    setForgotInput('');
  };

  // Determine dynamic placeholder and label text based on role
  let labelText = `${t("email_address")} / ${t("mobile_number")}`;
  let placeholderText = t("email_placeholder");
  let inputIconClass = 'fa-solid fa-user-graduate input-icon';

  if (role === 'Parent') {
    labelText = `${t("parent")} ${t("email_address")} / ${t("mobile_number")}`;
    placeholderText = 'parent@ruraledu.com';
    inputIconClass = 'fa-solid fa-users input-icon';
  } else if (role === 'Admin') {
    labelText = `${t("admin")} ${t("email_address")}`;
    placeholderText = 'admin@ruraledu.com';
    inputIconClass = 'fa-solid fa-user-shield input-icon';
  }

  return (
    <div className="onboarding-wrapper">
      <div className="onboarding-card">
        
        {/* Back to Language Selection */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <Link 
            to="/select-language" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.86rem', 
              fontWeight: 600,
              color: 'var(--primary)', 
              textDecoration: 'none', 
              padding: '6px 14px', 
              borderRadius: '20px', 
              background: 'rgba(46, 125, 50, 0.08)', 
              border: '1px solid rgba(46, 125, 50, 0.2)',
              transition: 'all 0.2s ease'
            }}
            title={t("back_to_language")}
          >
            <i className="fa-solid fa-arrow-left"></i>
            <i className="fa-solid fa-globe"></i>
            <span>{t("back_to_language")}</span>
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="logo-icon" style={{ margin: '0 auto 12px', width: '52px', height: '52px', fontSize: '1.6rem' }}>
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{t("login_title")}</h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {t("login_desc")}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="alert-card alert-error">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Selector Tabs - Pills styling */}
        <div className="auth-tabs">
          <div 
            className={`auth-tab ${role === 'Student' ? 'active' : ''}`} 
            onClick={() => handleRoleChange('Student')}
          >
            <i className="fa-solid fa-user-graduate" style={{ marginRight: '4px' }}></i>{t("student")}
          </div>
          <div 
            className={`auth-tab ${role === 'Parent' ? 'active' : ''}`} 
            onClick={() => handleRoleChange('Parent')}
          >
            <i className="fa-solid fa-users" style={{ marginRight: '4px' }}></i>{t("parent")}
          </div>
          <div 
            className={`auth-tab ${role === 'Admin' ? 'active' : ''}`} 
            onClick={() => handleRoleChange('Admin')}
          >
            <i className="fa-solid fa-user-shield" style={{ marginRight: '4px' }}></i>{t("admin")}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label htmlFor="loginIdentifier">{labelText}</label>
            <div className="form-control-wrapper">
              <i className={inputIconClass}></i>
              <input 
                type="text" 
                className="form-control" 
                id="loginIdentifier" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required 
                placeholder={placeholderText} 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="loginPassword">{t("password")}</label>
            <div className="form-control-wrapper">
              <i className="fa-solid fa-lock input-icon"></i>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                id="loginPassword" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="••••••••" 
              />
              <i 
                className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
          </div>

          <div className="auth-options">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>{t("remember_me")}</span>
            </label>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); setShowModal(true); }} 
              style={{ fontWeight: 600, color: 'var(--primary)' }}
            >
              {t("forgot_password")}
            </a>
          </div>

          <button type="submit" className="btn btn-primary btn-block" style={{ width: '100%', marginBottom: '20px', fontSize: '1.05rem', padding: '14px' }}>
            <i className="fa-solid fa-right-to-bracket"></i>
            <span>{t("login")}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px', borderTop: '1px solid rgba(46,125,50,0.1)', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {t("register_prompt")}{' '}
            <Link to="/register" style={{ fontWeight: '700', color: 'var(--primary)' }}>{t("register_now")}</Link>
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showModal && (
        <div className="modal-overlay open">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <i className="fa-solid fa-key" style={{ color: 'var(--accent)' }}></i> {t("forgot_password")}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.3rem', display: 'flex', alignItems: 'center' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                {t("forgot_password_desc")}
              </p>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>{t("email_address")} / {t("mobile_number")}</label>
                <div className="form-control-wrapper">
                  <i className="fa-solid fa-envelope input-icon"></i>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={forgotInput}
                    onChange={(e) => setForgotInput(e.target.value)}
                    placeholder="email@example.com or 9876543210" 
                    style={{ paddingLeft: '46px' }} 
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowModal(false)}>{t("cancel")}</button>
                <button className="btn btn-accent btn-sm" onClick={handleForgotPasswordSubmit} style={{ color: '#1e293b' }}>{t("submit")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
