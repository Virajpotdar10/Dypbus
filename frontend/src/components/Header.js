import React from 'react';

const Header = () => {
  return (
    <header style={styles.header}>
      <img src="/college_banner.png" alt="College Banner" style={styles.banner} />
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#00205B',
    padding: '0',
    textAlign: 'center',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  banner: {
    width: '100%',
    maxWidth: '1200px',
    height: 'auto',
    display: 'block',
    margin: '0 auto',
  },
};

export default Header;
