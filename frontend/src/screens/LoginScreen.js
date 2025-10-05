import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import logo from './168.jpg';


const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('userInfo');
    if (stored) {
      navigate('/');
    }
  }, [navigate]);

  const loginHandler = async (e) => {
    e.preventDefault();

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

      // Save the entire userInfo object, not just the token
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      navigate('/');
    } catch (err) {
      const message = err?.response?.data?.msg || err?.response?.data?.message || err?.message || 'Login failed';
      setError(message);
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
        <div className="logo-container" style={{
          textAlign: 'center',
          marginBottom: '1rem',
        }}>
          <img 
            src={logo} 
            alt="DYPA TIL College Logo" 
            style={{
              maxWidth: '120px',
              height: 'auto',
              marginBottom: '1rem',
            }}
          />
          <h2 style={{
            color: '#1a237e',
            marginBottom: '0.5rem',
            fontWeight: '600',
          }}>D.Y Patil College of Engineering & Technology </h2>
          <p style={{
            color: '#333',
            fontSize: '0.9rem',
            marginBottom: '0',
          }}
        >(AN AUTONOMOUS INSTITUTE)</p>
        </div>

        <form onSubmit={loginHandler} style={{
          width: '100%',
        }}>
          <h3 style={{
            textAlign: 'center',
            color: '#1a237e',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
          }}>Sign in </h3>
          
          {error && (
            <div className="error-message" style={{
              color: '#d32f2f',
              backgroundColor: '#ffebee',
              padding: '0.5rem',
              borderRadius: '4px',
              marginBottom: '1rem',
              textAlign: 'center',
              fontSize: '0.9rem',
            }}>
              {error}
            </div>
          )}

          <div className="form-group" style={{
            marginBottom: '1.5rem',
          }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: '500',
            }}>Email:</label>
            <input
              type="email"
              required
              id="email"
              placeholder="Email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '95%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                transition: 'border 0.3s',
              }}
            />
          </div>
          
          <div className="form-group" style={{
            marginBottom: '1rem',
          }}>
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: '500',
            }}>Password:</label>
            <input
              type="password"
              required
              id="password"
              autoComplete="current-password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '95%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                transition: 'border 0.3s',
              }}
            />
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            <Link to="/forgot-password" style={{ color: '#1a237e', textDecoration: 'none' }}>
              Forgot Password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a237e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.3s',
              marginBottom: '1rem',
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#303f9f'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#1a237e'}
          >
            Login
          </button>

          <div style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#555',
          }}>
            Don't have an account?{' '}
            <Link to="/register" style={{
              color: '#1a237e',
              fontWeight: '500',
              textDecoration: 'none',
            }}>Register</Link>
          </div>
        </form>
        
        <div style={{
          textAlign: 'center',
          marginTop: '2rem',
          color: '#555',
          fontSize: '0.8rem',
        }}>
          <p>KASABA BAWADA, KOLHAPUR</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;