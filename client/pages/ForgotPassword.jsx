
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetToken('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage(res.data.message || 'Password reset link sent to your email.');
        if (res.data.resetToken) {
          setResetToken(res.data.resetToken);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process password reset request. Please check the email entered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" id="forgot-password-page">
      <div className="form-card" id="forgot-password-card">
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
          Reset Password
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
          Enter your account email to receive a secure password reset link.
        </p>

        {error && <div className="form-error" id="forgot-error">{error}</div>}
        {message && (
          <div className="form-success" id="forgot-success" style={{ marginBottom: 20 }}>
            <p style={{ margin: 0 }}>{message}</p>
            {resetToken && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(21, 128, 61, 0.2)' }}>
                <div style={{ fontSize: 12, color: '#166534', marginBottom: 8, fontWeight: 600 }}>
                  ⚡ Quick Test Shortcut (Dev / Preview Mode):
                </div>
                <Link
                  to={`/reset-password/${resetToken}`}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-block', textDecoration: 'none' }}
                  id="direct-reset-test-btn"
                >
                  Proceed to Reset Page &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {!message ? (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g., student@roaddrive.com"
                id="forgot-email-input"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
              id="send-reset-btn"
            >
              {loading ? 'Sending Reset Link...' : 'Send Password Reset Link'}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMessage('');
                setEmail('');
                setResetToken('');
              }}
            >
              Send to Another Email
            </button>
          </div>
        )}

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-muted)' }}>
          Remember your credentials?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

