import React, { useState, useEffect } from 'react';
import API from '../api';
import { Link, useNavigate } from 'react-router-dom';
import logo from './168.jpg';   
import './RegisterScreen.css';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem('authToken')) {
      navigate('/');
    }
  }, [navigate]);

  const registerHandler = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setError('');
      }, 5000);
      return setError('Passwords do not match');
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await API.post(
        '/api/v1/auth/register',
        { name, email, password },
        config
      );

      // Check if response and response.data exist
      if (response && response.data && response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        navigate('/');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Registration failed. Please try again.';
      
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
}
return (
  <div className="register-container">
    <div className="register-overlay"></div>
    
    <div className="register-card">
      <div className="logo-container">
        <img 
          src={logo} 
          alt="DYPA TIL College Logo" 
        />
        <h2>D.Y Patil College of Engineering & Technology </h2>
        <p>(AN AUTONOMOUS INSTITUTE)</p>
      </div>

      <form onSubmit={registerHandler} className="register-form">
        <h3>Create New Account</h3>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Full Name:</label>
          <input
            type="text"
            required
            id="name"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            required
            id="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            required
            id="password"
            autoComplete="true"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        
        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label htmlFor="confirmpassword">Confirm Password:</label>
          <input
            type="password"
            required
            id="confirmpassword"
            autoComplete="true"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
        >
          Register
        </button>

        <div className="login-link">
          Already have an account?{' '}
          <Link to="/login">Login</Link>
        </div>
      </form>
      
      <div className="footer-text">
        <p>KASABA BAWADA, KOLHAPUR</p>
      </div>
    </div>
  </div>
);


export default RegisterScreen;