import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import logo from './168.jpg';
import './LoginScreen.css';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      navigate('/');
    }
  }, [navigate]);

  const loginHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/v1/auth/login`,
        { email, password },
        config
      );

      const userInfo = response?.data;

      if (!userInfo || !userInfo.token) {
        throw new Error('Login failed: no token returned by server.');
      }

      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      navigate('/');
    } catch (err) {
      const message = err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Login failed';
      setError(message);
      setTimeout(() => {
        setError('');
      }, 5000);
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
            alt="DYPA TIL College Logo" 
            className="logo"
          />
          <h2 className="college-name">D.Y Patil College of Engineering & Technology </h2>
          <p className="college-tagline">(AN AUTONOMOUS INSTITUTE)</p>
        </div>

        <form onSubmit={loginHandler} className="login-form">
          <h3 className="form-title">Sign in </h3>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email:</label>
            <input
              type="email"
              required
              id="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password:</label>
            <input
              type="password"
              required
              id="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="forgot-password">
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot Password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="submit-btn"
          >
            {loading ? (
              <>
              <span className="spinner"></span>
              Logging in...
              </>
            )  : (
              'Login'
            )}
          </button>

          <div className="register-link">
            Don't have an account?{' '}
            <Link to="/register" className="register-link">Register</Link>
          </div>
        </form>
        
        <div className="footer-text">
          <p className="footer-text">KASABA BAWADA, KOLHAPUR</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;