/**
 * ECCD CARE — Login Page Component
 *
 * Skills applied:
 *   frontend-design: Civic Authority aesthetic, cohesive restraint, visual anchor
 *   design-taste-frontend: No neon/glows, no pure black, tactile :active feedback
 *   ui-a11y: WCAG 2.2 AA contrast, labels above inputs, aria-describedby for errors,
 *            keyboard navigation, focus-visible rings, touch targets 44px
 *   react-patterns: useState for local form state, composition over inheritance,
 *                   events up via callbacks
 *   auth-implementation-patterns: credential validation at boundaries, session
 *                                  regeneration, never expose secrets in UI
 *   api-and-interface-design: consume structured API responses, consistent error handling
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  LogIn,
} from 'lucide-react';
import { useAuth, AUTH_STATUS } from './AuthProvider';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import '../../styles/login.css';
import anacLogo from '../../assets/anac-logo.png';

export function LoginPage({ isAdminPortal: propIsAdminPortal }) {
  const isAdminPortal = propIsAdminPortal ?? (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
  const { login, logout, forgotPassword, status, sessionExpiredMessage, clearExpiredState } = useAuth();

  // Form state (react-patterns: useState for isolated form UI)
  const [email, setEmail] = useState(isAdminPortal ? 'sysadmin@csfp.gov.ph' : '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Forgot password mode
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

  // --- Login Form Submission ---

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');
    setFieldErrors({});

    // Client-side validation (api-and-interface-design: validate at boundaries)
    const errors = {};
    if (!email.trim()) errors.email = 'Email address is required.';
    if (!password.trim()) errors.password = 'Password is required.';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({ email: email.trim(), password });

      if (!result.ok) {
        // Handle structured API error (api-and-interface-design: consistent error format)
        if (result.error?.details?.field) {
          setFieldErrors({ [result.error.details.field]: result.error.message });
        } else {
          setFormError(result.error?.message || 'Authentication failed. Please try again.');
        }
        return;
      }

      // If user attempted to log in to /admin as a CDT:
      if (isAdminPortal && result.data?.user?.role === 'cdt') {
        await logout();
        setFormError('Access Restricted: This console is strictly reserved for CSFP System Administrators. Teachers and daycare workers, please use the standard ECCD portal at "/" to sign in.');
        return;
      }
      // On success, AuthProvider updates status → App renders AppShell or AdminShell
    } catch {
      setFormError('A network error occurred. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Forgot Password Submission ---

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered CSWDO email address.');
      return;
    }

    setForgotSubmitting(true);

    try {
      const result = await forgotPassword({ email: forgotEmail.trim() });

      if (result.ok) {
        setForgotSuccess(result.data.message);
      } else {
        setForgotError(result.error?.message || 'Request failed. Please try again.');
      }
    } catch {
      setForgotError('A network error occurred. Please try again.');
    } finally {
      setForgotSubmitting(false);
    }
  };



  // --- Forgot Password View ---

  if (isForgotMode) {
    return (
      <div className="login-page">
        {/* Left Brand Panel */}
        <LoginLeftPanel />

        {/* Right Form Panel */}
        <div className="login-right-panel">
          <div className="login-form-container">

            <div className="login-form-brand-badge">
              <img src={anacLogo} alt="ANÁC Logo" className="login-form-logo-img" />
              <span className="login-form-brand-title">ANÁC</span>
            </div>

            <button
              type="button"
              className="forgot-password-back"
              onClick={() => {
                setIsForgotMode(false);
                setForgotSuccess('');
                setForgotError('');
              }}
            >
              <ArrowLeft size={15} />
              <span>Back to Sign In</span>
            </button>

            <h1 className="login-form-title">Reset Your Password</h1>
            <p className="login-form-subtitle">
              Enter the email address registered with your ECCD CARE account.
              If it exists in the system, you will receive reset instructions.
            </p>

            {forgotSuccess ? (
              <div className="forgot-password-success" role="status">
                <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{forgotSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} noValidate>
                <div className="form-group">
                  <label htmlFor="forgot-email" className="form-label">
                    Registered Email Address
                    <span className="required-indicator" aria-hidden="true">*</span>
                  </label>
                  <div className="form-control-wrapper">
                    <span className="input-icon-left">
                      <Mail size={16} />
                    </span>
                    <input
                      id="forgot-email"
                      type="email"
                      className={`input has-left-icon ${forgotError ? 'is-invalid' : ''}`}
                      placeholder="your.name@cswdo.gov.ph"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        setForgotError('');
                      }}
                      disabled={forgotSubmitting}
                      autoComplete="email"
                      aria-invalid={Boolean(forgotError)}
                      aria-describedby={forgotError ? 'forgot-error' : undefined}
                    />
                  </div>
                  {forgotError && (
                    <span id="forgot-error" className="form-error-msg" role="alert">
                      <ShieldAlert size={13} />
                      {forgotError}
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="login-submit-btn"
                  isLoading={forgotSubmitting}
                  disabled={forgotSubmitting}
                  icon={Mail}
                >
                  {forgotSubmitting ? 'Sending Instructions...' : 'Send Reset Instructions'}
                </Button>
              </form>
            )}

            <PrivacyNotice />
          </div>
        </div>
      </div>
    );
  }

  // --- Main Login View ---

  return (
    <div className="login-page">
      {/* Left Brand Panel */}
      <LoginLeftPanel />

      {/* Right Form Panel */}
      <div className="login-right-panel">
        <div className="login-form-container">

          <div className="login-form-brand-badge">
            <img src={anacLogo} alt="ANÁC Logo" className="login-form-logo-img" />
            <span className="login-form-brand-title">ANÁC</span>
          </div>

          {/* Session Expired Banner */}
          {status === AUTH_STATUS.EXPIRED && sessionExpiredMessage && (
            <div className="session-expired-banner" role="alert">
              <Clock size={16} className="session-expired-icon" />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>Session Expired</div>
                <div>{sessionExpiredMessage}</div>
              </div>
            </div>
          )}

          {isAdminPortal ? (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eef2ff', border: '1px solid #c7d2fe', color: '#4338ca', padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                <Shield size={12} style={{ color: '#4f46e5' }} />
                <span>CSFP SYSADMIN GATEWAY</span>
              </div>
              <h1 className="login-form-title" style={{ margin: 0 }}>System Administrator Sign In</h1>
            </div>
          ) : (
            <h1 className="login-form-title">Welcome Back</h1>
          )}

          {/* Credential Error Banner */}
          {formError && (
            <div
              className="session-expired-banner"
              role="alert"
              style={{
                backgroundColor: 'var(--color-danger-bg)',
                borderColor: 'var(--color-danger-border)',
                borderLeftColor: 'var(--color-danger-primary)',
                color: 'var(--color-danger-text)',
              }}
            >
              <ShieldAlert size={16} style={{ color: 'var(--color-danger-primary)', flexShrink: 0, marginTop: '1px' }} />
              <div>
                <div style={{ fontWeight: 600, marginBottom: '2px' }}>Authentication Failed</div>
                <div>{formError}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="login-email" className="form-label">
                Email Address
                <span className="required-indicator" aria-hidden="true">*</span>
              </label>
              <div className="form-control-wrapper">
                <span className="input-icon-left">
                  <Mail size={16} />
                </span>
                <input
                  id="login-email"
                  type="email"
                  className={`input has-left-icon ${fieldErrors.email ? 'is-invalid' : ''}`}
                  placeholder="your.name@cswdo.gov.ph"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: '' }));
                    if (formError) setFormError('');
                  }}
                  disabled={isSubmitting}
                  autoComplete="email"
                  autoFocus
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
              </div>
              {fieldErrors.email && (
                <span id="email-error" className="form-error-msg" role="alert">
                  <ShieldAlert size={13} />
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="login-password" className="form-label">
                Password
                <span className="required-indicator" aria-hidden="true">*</span>
              </label>
              <div className="password-input-wrapper">
                <div className="form-control-wrapper">
                  <span className="input-icon-left">
                    <Lock size={16} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input has-left-icon has-right-icon ${fieldErrors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: '' }));
                      if (formError) setFormError('');
                    }}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {fieldErrors.password && (
                <span id="password-error" className="form-error-msg" role="alert">
                  <ShieldAlert size={13} />
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="login-options-row">
              <Checkbox
                label="Remember me on this device"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />

              <button
                type="button"
                className="forgot-password-link"
                onClick={() => {
                  setIsForgotMode(true);
                  setForgotEmail(email);
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="login-submit-btn"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              icon={LogIn}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>

          {/* Privacy Notice (ui-a11y: inform user about data handling) */}
          <PrivacyNotice />

          {isAdminPortal && (
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '12px' }}>
              <Link to="/" style={{ color: 'var(--color-primary-700)', textDecoration: 'none', fontWeight: 600 }}>
                ← Return to Standard ECCD Daycare Portal
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components (react-patterns: small, focused, presentational) ---

function LoginLeftPanel() {
  return (
    <div className="login-left-panel" aria-hidden="true">
      <div className="login-left-logo-card">
        <img src={anacLogo} alt="ANÁC Logo" className="login-left-logo-img" />
      </div>

      <div className="login-left-wordmark">
        ANÁC
      </div>

      <div className="login-left-footer">
        <div className="login-left-footer-text">
          City Social Welfare &amp; Development Office (CSWDO)
          <br />
          Mandated under RA 10410 (Early Years Act of 2013)
          <br />
          Data Privacy Act Compliant (RA 10173)
        </div>
      </div>
    </div>
  );
}

function PrivacyNotice() {
  return (
    <div className="login-privacy-notice">
      <Shield size={15} className="login-privacy-icon" />
      <div>
        <strong>Authorized Personnel Only.</strong> Access to this system is restricted
        to accredited ECCD Administrative officers and Child Development Teachers (CDTs). All activities are logged and auditable in compliance with
        the Data Privacy Act of 2012 (RA 10173).
        <em> This is a prototype demonstration system.</em>
      </div>
    </div>
  );
}

export default LoginPage;
