import React from 'react';

const MainLayout = ({ children }) => {
  return (
    <>
      <main className="main-content">
        {children}
      </main>
    </>
  );
};

export default MainLayout;