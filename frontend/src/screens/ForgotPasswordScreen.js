import React, { useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import logo from './168.jpg';
import './LoginScreen.css'; // Reusing styles

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [stage, setStage] = useState('email'); // 'email', 'otp', 'reset'
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/api/v1/auth/forgot-password', { email });
      if (data.success) {
        toast.success(data.msg);
        setStage('otp');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First, verify the OTP
      const { data: verifyData } = await API.post('/api/v1/auth/verify-otp', { email, otp });
      if (verifyData.success) {
        // If OTP is correct, reset the password
        const { data: resetData } = await API.post('/api/v1/auth/reset-password', { email, newPassword });
        if (resetData.success) {
          toast.success(resetData.msg);
          setStage('done'); // Show a final success message
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStage = () => (
    <form onSubmit={handleSendOTP} className="login-form">
      <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        Enter your registered email to receive an OTP.
      </p>
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          required
          id="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="form-input"
        />
      </div>
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? <div className="spinner" /> : 'Send OTP'}
      </button>
    </form>
  );

  const renderOtpStage = () => (
    <form onSubmit={handleResetPassword} className="login-form">
      <p style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        An OTP has been sent to <strong>{email}</strong>.
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
      <div className="form-group">
        <label htmlFor="newPassword">New Password:</label>
        <input
          type="password"
          required
          id="newPassword"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="form-input"
        />
      </div>
      <button type="submit" className="submit-btn" disabled={loading}>
        {loading ? <div className="spinner" /> : 'Reset Password'}
      </button>
    </form>
  );

  const renderDoneStage = () => (
    <div style={{ textAlign: 'center' }}>
      <p className="success-message" style={{fontSize: '1.1rem'}}>Password has been reset successfully!</p>
      <Link to="/login" className="submit-btn" style={{ textDecoration: 'none', display: 'inline-block', width: 'auto', padding: '10px 20px' }}>
        Back to Login
      </Link>
    </div>
  );

  return (
    <div className="login-container">
      <div className="login-overlay"></div>
      <div className="login-card">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
          <h2 className="college-name">Forgot Password</h2>
        </div>
        {stage === 'email' && renderEmailStage()}
        {stage === 'otp' && renderOtpStage()}
        {stage === 'done' && renderDoneStage()}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;