import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api';
import logo from './168.jpg';
import './LoginScreen.css'; // Reusing login screen styles

const VerifyOTPScreen = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const verifyOtpHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email) {
      setError('Email not found. Please go back and try again.');
      setLoading(false);
      return;
    }

    try {
      const { data } = await API.post('/api/v1/auth/verifyotp', { email, otp });

      if (data.success) {
        setSuccess('OTP verified successfully. Redirecting...');
        // Pass email and resetToken to the reset password screen
        setTimeout(() => {
          navigate(`/resetpassword/${data.resetToken}`, { state: { email } });
        }, 2000);
      } else {
        throw new Error('Failed to verify OTP');
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'An error occurred. Please try again.');
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
          <img src={logo} alt="Logo" className="logo" />
          <h2 className="college-name">Verify OTP</h2>
        </div>

        <form onSubmit={verifyOtpHandler} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
            An OTP has been sent to <strong>{email}</strong>. Please enter it below.
          </p>

          <div className="form-group">
            <label htmlFor="otp">OTP:</label>
            <input
              type="text"
              required
              id="otp"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="form-input"
              maxLength="6"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTPScreen;