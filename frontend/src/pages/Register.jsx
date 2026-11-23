import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('Student'); // Student, Parent, Admin
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student specific
  const [studentClass, setStudentClass] = useState('Class 8');
  const [primaryParentPhone, setPrimaryParentPhone] = useState('');
  const [secondaryParentPhone, setSecondaryParentPhone] = useState('');

  // Password strength
  const [strengthText, setStrengthText] = useState('-');
  const [strengthFillWidth, setStrengthFillWidth] = useState('0%');
  const [strengthColor, setStrengthColor] = useState('transparent');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    document.body.className = 'bg-register';
    return () => {
      document.body.className = '';
    };
  }, []);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const checkPasswordStrength = (pwd) => {
    setPassword(pwd);
    if (!pwd) {
      setStrengthText('-');
      setStrengthFillWidth('0%');
      setStrengthColor('transparent');
      return;
    }

    let strength = 0;
    if (pwd.length >= 6) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    if (strength <= 1) {
      setStrengthText(t("weak"));
      setStrengthFillWidth('30%');
      setStrengthColor('#ef4444');
    } else if (strength === 2 || strength === 3) {
      setStrengthText(t("medium"));
      setStrengthFillWidth('60%');
      setStrengthColor('#FFC107');
    } else {
      setStrengthText(t("strong"));
      setStrengthFillWidth('100%');
      setStrengthColor('#2E7D32');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setErrorMsg(t("passwords_not_match"));
      return;
    }

    // Phone format validation (optional for Student)
    const phoneRegex = /^[0-9]{10}$/;
    if (role !== 'Student' || phone) {
      if (!phoneRegex.test(phone)) {
        setErrorMsg(t("phone_valid"));
        return;
      }
    }

    if (role === 'Student') {
      if (!primaryParentPhone) {
        setErrorMsg(t("flash_fill_credentials"));
        return;
      }
      if (!phoneRegex.test(primaryParentPhone)) {
        setErrorMsg(t("phone_valid") + " (Parent Phone)");
        return;
      }
      if (phone && phone === primaryParentPhone) {
        setErrorMsg(t("phones_identical_error") || "Student phone and parent phone cannot be identical.");
        return;
      }
      if (secondaryParentPhone && !phoneRegex.test(secondaryParentPhone)) {
        setErrorMsg(t("phone_valid") + " (Secondary Parent Phone)");
        return;
      }
      if (secondaryParentPhone && primaryParentPhone === secondaryParentPhone) {
        setErrorMsg(t("phones_identical_error") || "Primary and Secondary parent phone numbers cannot be identical.");
        return;
      }
    }

    try {
      const payload = {
        role,
        name,
        email,
        phone,
        password,
        class: studentClass,
        primary_parent_phone: primaryParentPhone,
        secondary_parent_phone: secondaryParentPhone
      };

      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || t("flash_reg_failed"));
        return;
      }

      // Success
      alert(role === 'Student' ? t("flash_reg_success") : role === 'Parent' ? t("flash_parent_reg_success") : t("flash_admin_reg_success"));
      navigate('/login');

    } catch (err) {
      console.error(err);
      setErrorMsg(t("flash_db_error"));
    }
  };

  return (
    <div className="onboarding-wrapper">
      <div className="onboarding-card" style={{ maxWidth: '560px' }}>
        
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

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="logo-icon" style={{ margin: '0 auto 12px', width: '52px', height: '52px', fontSize: '1.6rem' }}>
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>{t("register_title")}</h2>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {t("register_desc")}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="alert-card alert-error">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Role Select Tabs - Pills styling */}
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

        <form onSubmit={handleRegisterSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="regName">{t("full_name")}</label>
            <div className="form-control-wrapper">
              <i className="fa-solid fa-user input-icon"></i>
              <input 
                type="text" 
                className="form-control" 
                id="regName" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
                placeholder="John Doe" 
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label htmlFor="regEmail">{t("email_address")}</label>
            <div className="form-control-wrapper">
              <i className="fa-solid fa-envelope input-icon"></i>
              <input 
                type="email" 
                className="form-control" 
                id="regEmail" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email_placeholder")} 
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div className="form-group">
            <label htmlFor="regMobile">{t("mobile_number")}{role === 'Student' && ' (Optional)'}</label>
            <div className="form-control-wrapper">
              <i className="fa-solid fa-phone input-icon"></i>
              <input 
                type="text" 
                className="form-control" 
                id="regMobile" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required={role !== 'Student'}
                placeholder="9876543210" 
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="regPassword">{t("password")}</label>
            <div className="form-control-wrapper">
              <i className="fa-solid fa-lock input-icon"></i>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                id="regPassword" 
                value={password}
                onChange={(e) => checkPasswordStrength(e.target.value)}
                required 
                placeholder="••••••••" 
              />
              <i 
                className={`fa-solid ${showPassword ? 'fa-eye' : 'fa-eye-slash'} toggle-password`}
                onClick={() => setShowPassword(!showPassword)}
              ></i>
            </div>
            {/* Password Strength Meter */}
            <div className="strength-meter-wrapper">
              <div className="strength-meter-bar">
                <div 
                  className="strength-meter-fill" 
                  style={{ width: strengthFillWidth, backgroundColor: strengthColor }}
                ></div>
              </div>
              <span className="strength-text">{t("pass_strength")}: {strengthText}</span>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="regConfirmPassword">{t("confirm_password")}</label>
            <div className="form-control-wrapper">
              <i className="fa-solid fa-lock input-icon"></i>
              <input 
                type={showPassword ? 'text' : 'password'} 
                className="form-control" 
                id="regConfirmPassword" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
                placeholder="••••••••" 
              />
            </div>
          </div>

          {/* Student Specific Fields */}
          {role === 'Student' && (
            <div>
              <div className="form-group">
                <label htmlFor="regPrimaryParentPhone">{t("primary_parent_phone")}</label>
                <div className="form-control-wrapper">
                  <i className="fa-solid fa-phone input-icon"></i>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="regPrimaryParentPhone" 
                    value={primaryParentPhone}
                    onChange={(e) => setPrimaryParentPhone(e.target.value)}
                    required
                    placeholder="9000000000" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="regSecondaryParentPhone">{t("secondary_parent_phone")}</label>
                <div className="form-control-wrapper">
                  <i className="fa-solid fa-phone input-icon"></i>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="regSecondaryParentPhone" 
                    value={secondaryParentPhone}
                    onChange={(e) => setSecondaryParentPhone(e.target.value)}
                    placeholder="9000000001 (Optional)" 
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="regClass">{t("class")}</label>
                <select 
                  className="form-control" 
                  id="regClass" 
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                >
                  <option value="LKG">LKG</option>
                  <option value="UKG">UKG</option>
                  <option value="Class 1">Class 1</option>
                  <option value="Class 2">Class 2</option>
                  <option value="Class 3">Class 3</option>
                  <option value="Class 4">Class 4</option>
                  <option value="Class 5">Class 5</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                  <option value="Class 12">Class 12</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-accent btn-block" style={{ width: '100%', marginTop: '24px', marginBottom: '24px', padding: '14px', fontSize: '1.05rem' }}>
            <i className="fa-solid fa-user-plus"></i>
            <span>{t("create_account_btn")}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid rgba(46,125,50,0.1)', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
            {t("login_instead")}?{' '}
            <Link to="/login" style={{ fontWeight: '700', color: 'var(--primary)' }}>{t("login")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
