import React from 'react';
const ThankYouScreen = () => {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Success Icon with Animation */}
        <div style={styles.iconWrapper}>
          <svg 
            style={styles.checkIcon} 
            viewBox="0 0 52 52" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle 
              style={styles.checkCircle} 
              cx="26" 
              cy="26" 
              r="25" 
              fill="none"
            />
            <path 
              style={styles.checkMark} 
              fill="none" 
              d="M14.1 27.2l7.1 7.2 16.7-16.8"
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 style={styles.title}>Thank You!</h1>
        <p style={styles.message}>
          Your details have been successfully submitted.
        </p>
        {/* Divider */}
        <div style={styles.divider}></div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
    animation: 'fadeInUp 0.6s ease-out',
  },
  iconWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  checkIcon: {
    width: '80px',
    height: '80px',
  },
  checkCircle: {
    strokeDasharray: '166',
    strokeDashoffset: '166',
    stroke: '#4ade80',
    strokeWidth: '2',
    strokeMiterlimit: '10',
    animation: 'stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards',
  },
  checkMark: {
    transformOrigin: '50% 50%',
    strokeDasharray: '48',
    strokeDashoffset: '48',
    stroke: '#4ade80',
    strokeWidth: '3',
    strokeLinecap: 'round',
    animation: 'stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '16px',
    marginTop: '0',
  },
  message: {
    fontSize: '18px',
    color: '#4b5563',
    marginBottom: '12px',
    lineHeight: '1.6',
  },
  submessage: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  divider: {
    height: '1px',
    background: 'linear-gradient(to right, transparent, #e5e7eb, transparent)',
    margin: '24px 0',
  },
  infoBox: {
    background: '#f3f4f6',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '24px',
  },
  infoText: {
    fontSize: '14px',
    color: '#374151',
    margin: '0',
    lineHeight: '1.5',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '12px 32px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  buttonSecondary: {
    background: 'white',
    color: '#667eea',
    padding: '12px 32px',
    borderRadius: '8px',
    border: '2px solid #667eea',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Add CSS animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }

  button:hover {
    transform: translateY(-2px);
  }

  button:active {
    transform: translateY(0);
  }

  @media (max-width: 480px) {
    div[style*="padding: 48px 40px"] {
      padding: 32px 24px !important;
    }
    h1 {
      font-size: 28px !important;
    }
    button {
      width: 100%;
      font-size: 14px !important;
      padding: 10px 24px !important;
    }
  }
`;
document.head.appendChild(styleSheet);

export default ThankYouScreen;