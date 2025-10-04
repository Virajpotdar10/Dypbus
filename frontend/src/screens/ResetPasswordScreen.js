import React, { useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import logo from './168.jpg';

const ResetPasswordScreen = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { resettoken } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryToken = new URLSearchParams(location.search).get('token');
  const effectiveToken = queryToken || resettoken;

  const resetPasswordHandler = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setError(''), 5000);
      return setError('Passwords do not match');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await API.put(
        `/api/v1/auth/resetpassword/${effectiveToken}`,
        { password },
        config
      );

      if (response && response.data && response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        navigate('/');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Password reset failed. Please try again.';
      
      if (error.response && error.response.data && error.response.data.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', minHeight: '100vh', backgroundImage: 'url(/bus.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="login-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}></div>
      <div className="login-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '450px', margin: 'auto', padding: '2rem', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '10px' }}>
        <div className="logo-container" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img src={logo} alt="Logo" style={{ maxWidth: '120px', height: 'auto', marginBottom: '1rem' }} />
          <h2 style={{ color: '#1a237e', marginBottom: '0.5rem', fontWeight: '600' }}>Reset Password</h2>
        </div>

        <form onSubmit={resetPasswordHandler} style={{ width: '100%' }}>
          {error && <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>Password reset successfully. Redirecting to login...</div>}

          <div className="form-group" style={{ marginBottom: '1.5rem', position: 'relative' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>New Password:</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              id="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '95%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <span onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '40px', cursor: 'pointer' }}>
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="confirmpassword" style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm New Password:</label>
            <input
              type="password"
              required
              id="confirmpassword"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '95%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1a237e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;
