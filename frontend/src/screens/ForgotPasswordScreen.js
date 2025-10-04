import React, { useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';
import logo from './168.jpg';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const forgotPasswordHandler = async (e) => {
    e.preventDefault();

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await API.post(
        '/api/v1/auth/forgotpassword',
        { email },
        config
      );

      if (response && response.data && response.data.success) {
        setSuccess(response.data.data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.response && error.response.data && error.response.data.msg) {
        errorMessage = error.response.data.msg;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      setEmail('');
      setTimeout(() => {
        setError('');
      }, 5000);
    }
  };

  return (
    <div className="login-container" style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundImage: 'url(/bus.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <div className="login-overlay" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}></div>
      
      <div className="login-card" style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '450px',
        margin: 'auto',
        padding: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}>
        <div className="logo-container" style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img src={logo} alt="Logo" style={{ maxWidth: '120px', height: 'auto', marginBottom: '1rem' }} />
          <h2 style={{ color: '#1a237e', marginBottom: '0.5rem', fontWeight: '600' }}>Forgot Password</h2>
        </div>

        <form onSubmit={forgotPasswordHandler} style={{ width: '100%' }}>
          {error && <div style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
          {success && <div style={{ color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '0.5rem', borderRadius: '4px', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

          <p style={{ color: '#333', textAlign: 'center', marginBottom: '1.5rem' }}>
            Please enter the email address you registered with. We will send you a link to change your password.
          </p>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>Email:</label>
            <input
              type="email"
              required
              id="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '95%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '4px', fontSize: '1rem' }}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#1a237e', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', marginBottom: '1rem' }}>
            Send Reset Link
          </button>

          <div style={{ textAlign: 'center', fontSize: '0.9rem' }}>
            <Link to="/login" style={{ color: '#1a237e', textDecoration: 'none' }}>Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
