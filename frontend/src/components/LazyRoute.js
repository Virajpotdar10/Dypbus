import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './MainLayout'; 
const TrackingScreen = React.lazy(() => import('../screens/TrackingScreen.js'));
const StudentsScreen = React.lazy(() => import('../screens/StudentsScreen'));
const DashboardScreen = React.lazy(() => import('../screens/DashboardScreen'));
const AllStudentsScreen = React.lazy(() => import('../screens/AllStudentsScreen'));
const LoginScreen = React.lazy(() => import('../screens/LoginScreen'));
const AdminScreen = React.lazy(() => import('../screens/AdminScreen'));
const StudentFormScreen = React.lazy(() => import('../screens/StudentFormScreen'));
const RegisterScreen = React.lazy(() => import('../screens/RegisterScreen'));
const ForgotPasswordScreen = React.lazy(() => import('../screens/ForgotPasswordScreen'));
const ResetPasswordScreen = React.lazy(() => import('../screens/ResetPasswordScreen'));
const VerifyOTPScreen = React.lazy(() => import('../screens/VerifyOTPScreen'));
const LoadingSpinner = () => (
  <div className="loading-container" style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: 'calc(100vh - 70px)', // Adjust based on header height
    width: '100%'
  }}>
    <div className="loading-spinner" style={{ textAlign: 'center' }}>
      <div className="spinner" style={{
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }}></div>
      <p style={{
        color: '#666',
        fontSize: '16px',
        margin: 0
      }}>Loading...</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>Failed to load the component. Please refresh the page.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
          <style jsx>{`
            .error-container {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 100vh;
              text-align: center;
              padding: 20px;
            }
            h2 {
              color: #e74c3c;
              margin-bottom: 10px;
            }
            p {
              color: #666;
              margin-bottom: 20px;
            }
            button {
              background-color: #3498db;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
            }
            button:hover {
              background-color: #2980b9;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lazy route wrapper component
const LazyRoute = ({ children, layout: Layout }) => (
  <LazyErrorBoundary>
    {Layout ? (
      <Layout>
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </Layout>
    ) : (
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    )}
  </LazyErrorBoundary>
);

// Main routing component with lazy loading
const AppRoutes = () => (
  <Routes>
  <Route path="/track/bus/:routeId" element={
  <LazyRoute layout={MainLayout}>
    <TrackingScreen />
  </LazyRoute>
} />
    <Route path="/login" element={
      <LazyRoute>
        <LoginScreen />
      </LazyRoute>
    } />
    <Route path="/register" element={
      <LazyRoute>
        <RegisterScreen />
      </LazyRoute>
    } />
    <Route path="/resetpassword/:resettoken" element={ // Add this route
      <LazyRoute>
        <ResetPasswordScreen />
      </LazyRoute>
    } />
    <Route path="/verify-otp" element={ // Add this route
      <LazyRoute>
        <VerifyOTPScreen />
      </LazyRoute>
    } />
    <Route path="/forgot-password" element={
      <LazyRoute>
        <ForgotPasswordScreen />
      </LazyRoute>
    } />
    <Route path="/route/:routeId" element={
      <LazyRoute>
        <StudentFormScreen />
      </LazyRoute>
    } />
    <Route path="/" element={
      <LazyRoute layout={MainLayout}>
        <DashboardScreen />
      </LazyRoute>
    } />
    <Route path="/route/:routeId/students" element={
  <LazyRoute layout={MainLayout}>
    <StudentsScreen />
  </LazyRoute>
} />
    <Route path="/all-students" element={
      <LazyRoute layout={MainLayout}>
        <AllStudentsScreen />
      </LazyRoute>
    } />
    <Route path="/admin" element={
      <LazyRoute layout={MainLayout}>
        <AdminScreen />
      </LazyRoute>
    } />
  </Routes>
);

export default AppRoutes;
export { LazyRoute, LoadingSpinner };