import React, { useState, useEffect } from 'react';
import API from '../api';
import { Link, useNavigate } from 'react-router-dom';
import logo from './168.jpg';

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

  return (
    <div className="register-container" style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundImage: 'url(/bus.jpeg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <div className="register-overlay" style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}></div>
      
      <div className="register-card" style={{
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
          marginBottom: '1.5rem',
        }}>
          <img 
            src={logo} 
            alt="DYPA TIL College Logo" 
            style={{
              maxWidth: '150px',
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
            color: '#555',
            fontSize: '0.8rem',
            fontStyle: 'italic',
          }}>(AN AUTONOMOUS INSTITUTE)</p>
        </div>

        <form onSubmit={registerHandler} style={{
          width: '100%',
        }}>
          <h3 style={{
            textAlign: 'center',
            color: '#1a237e',
            marginBottom: '1.5rem',
            fontSize: '1.5rem',
          }}>Create New Account</h3>
          
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
            marginBottom: '1.25rem',
          }}>
            <label htmlFor="name" style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: '500',
            }}>Full Name:</label>
            <input
              type="text"
              required
              id="name"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            marginBottom: '1.25rem',
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
            marginBottom: '1.25rem',
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
              autoComplete="true"
              placeholder="Create password"
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
          
          <div className="form-group" style={{
            marginBottom: '2rem',
          }}>
            <label htmlFor="confirmpassword" style={{
              display: 'block',
              marginBottom: '0.5rem',
              color: '#333',
              fontWeight: '500',
            }}>Confirm Password:</label>
            <input
              type="password"
              required
              id="confirmpassword"
              autoComplete="true"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            Register
          </button>

          <div style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#555',
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: '#1a237e',
              fontWeight: '500',
              textDecoration: 'none',
            }}>Login</Link>
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

export default RegisterScreen;