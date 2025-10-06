{{ ... }}
import { Link, useNavigate } from 'react-router-dom';
import logo from './168.jpg';
import './LoginScreen.css'; // Import the new CSS file

const LoginScreen = () => {
{{ ... }}
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
            {loading ? 'Logging in...' : 'Login'}
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