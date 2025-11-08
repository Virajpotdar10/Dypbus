import React, { useState } from 'react';
import API from '../api';
import { useParams, useNavigate, Link } from 'react-router-dom';
import logo from './168.jpg';
import './LoginScreen.css'; // Reusing login screen styles for consistency

const ResetPasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { resettoken } = useParams();
  const navigate = useNavigate();

  const resetPasswordHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 5000);
      setLoading(false);
      return;
    }

    try {
      const { data } = await API.put(
        `/api/v1/auth/resetpassword/${resettoken}`,
        { password }
      );

      if (data.success) {
        setSuccess('Password reset successful!');
        // Wait for animation, then redirect
        setTimeout(() => navigate('/login'), 3000);
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred. The token may be invalid or expired.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      <div className="login-card">
        <div className="logo-container">
          <img 
            src={logo} 
            alt="Logo" 
            className="logo"
          />
          <h2 className="college-name">Reset Password</h2>
        </div>
        
        <form onSubmit={resetPasswordHandler} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-animation">
              <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                <path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
              <p className="success-message">{success}</p>
              <p>Redirecting to login...</p>
            </div>
          )}

          {!success && !error && (
            <>
              <div className="form-group">
                <label htmlFor="password">New Password:</label>
                <input
                  type="password"
                  required
                  id="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.targe.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password:</label>
                <input
                  type="password"
                  required
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </>
          )}
          
          <div className="register-link" style={{ marginTop: '1rem' }}>
            <Link to="/login">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;