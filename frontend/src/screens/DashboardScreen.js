import React, { useState, useEffect } from 'react';
import API from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiLogOut, FiUser, FiPlus, FiTrash2, FiChevronRight, FiLock, FiEdit2, FiX, FiDownload } from 'react-icons/fi';
import { FaBus } from 'react-icons/fa';
import io from 'socket.io-client';
import './DashboardScreen.css';

const DashboardScreen = () => {
  const [routes, setRoutes] = useState([]);
  const [routeName, setRouteName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState('');
  const [activeTab] = useState('routes');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileUpdateSuccess, setProfileUpdateSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [busNumberDigits, setBusNumberDigits] = useState('');
  const [routeNumber, setRouteNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login');
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const userRes = await API.get('/api/v1/auth/me');
        const user = userRes.data.data;
        setUser(user);

        const routesRes = await API.get('/api/v1/routes');
        setRoutes(routesRes.data.data);

        if (user?.role && user.role.toLowerCase() === 'admin') {
          try {
            const usersRes = await API.get('/api/v1/auth/drivers');
            setDrivers(usersRes?.data?.data || []);
          } catch (driverError) {
            console.log('Could not fetch drivers list:', driverError.message);
            setDrivers([]);
          }
        }
        setDataLoaded(true);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        localStorage.removeItem('userInfo');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    
    const socketURL = process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL 
    : 'http://localhost:5001';
    
    io(socketURL, { // <-- Change API.defaults.baseURL to socketURL
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      withCredentials: true,
    });
    // ... rest of the code stays the same
  }, [user]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const addRouteHandler = async (e) => {
    e.preventDefault();
    try {
      const trimmedName = routeName.trim();
      const routeNoPart = routeNumber ? ` (Route ${routeNumber})` : '';
      const busNoPart = busNumberDigits ? ` - Bus MH09 ${busNumberDigits}` : '';
      const finalName = `${trimmedName}${routeNoPart}${busNoPart}`;

      const body = { routeName: finalName };
      if (user?.role && user.role.toLowerCase() === 'admin' && selectedDriverId) {
        body.driver = selectedDriverId;
      }

      const { data } = await API.post('/api/v1/routes', body);
      setRoutes(prev => {
        const exists = prev.some(route => route._id === data.data._id);
        if (exists) return prev;
        return [...prev, data.data];
      });
      setRouteName('');
      setSelectedDriverId('');
      setBusNumberDigits('');
      setRouteNumber('');
      setShowAddRouteModal(false);
      setSuccess('Route added successfully!');
    } catch (error) {
      console.error('Error adding route:', error.response?.data || error.message);
      setError(error.response?.data?.msg || 'Could not add route');
      setTimeout(() => setError(''), 5000);
    }
  };

  const openDeleteModal = (route) => {
    setRouteToDelete(route);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setRouteToDelete(null);
    setShowDeleteModal(false);
  };

  const deleteRouteHandler = async () => {
    try {
      await API.delete(`/api/v1/routes/${routeToDelete._id}`);
      setRoutes(routes.filter((route) => route._id !== routeToDelete._id));
      closeDeleteModal();
      setSuccess('Route deleted successfully!');
    } catch (error) {
      setError('Could not delete route');
      setTimeout(() => setError(''), 5000);
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const downloadPDF = async (routeId) => {
    try {
      const response = await API.get(`/api/v1/pdf/route/${routeId}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `route-${routeId}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF Download Error:', error);
      setError('Failed to download PDF report');
      setTimeout(() => setError(''), 3000);
    }
  };

  const updateProfileHandler = async (updatedUser) => {
    try {
      const { data } = await API.put('/api/v1/auth/updatedetails', updatedUser);
      setUser(data.data);
      setShowEditProfileModal(false);
      setProfileUpdateSuccess('Profile updated successfully!');
      setTimeout(() => {
        setProfileUpdateSuccess('');
        setActiveSection('profile');
      }, 3000);
    } catch (error) {
      setError('Could not update profile');
      setTimeout(() => setError(''), 5000);
    }
  };

  const updatePasswordHandler = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      setTimeout(() => setError(''), 5000);
      return;
    }
    try {
      await API.put('/api/v1/auth/updatepassword', { currentPassword, newPassword });
      setPasswordChangeSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setPasswordChangeSuccess('');
        setActiveSection('profile');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.msg || error.message || 'Failed to update password');
      setTimeout(() => setError(''), 5000);
    }
  };

  return (
    <div className="page">
      {loading && <div className="loading-screen">Loading...</div>}
      {!dataLoaded && !loading && <div className="error-screen">Failed to load data</div>}
      {dataLoaded && (
        <div>
          <div className="banner">
            <FaBus className="banner-icon" />
            <h1 className="banner-title">D.Y Patil Transport Facility</h1>
          </div>

          <header className="header">
            <div className="header-left">
              <h2 className="header-title">Bus Driver Dashboard</h2>
            </div>
            
            <div className="header-controls">
              {user && (
                <div className="user-info-container">
                  <div className="user-info" onClick={() => { setDrawerOpen(true); setActiveSection('profile'); }}>
                    <div className="user-avatar">
                      <FiUser />
                    </div>
                    <div className="user-details">
                      <span className="user-name">{user.name}</span>
                      <span className="user-role">{user.role}</span>
                    </div>
                  </div>
                  <button onClick={logoutHandler} className="logout-button">
                    <FiLogOut />
                    <span>Logout</span>
                  </button>
                </div>
              )}
              {user && user.role && user.role.toLowerCase() === 'admin' && (
                <Link to="/admin" className="admin-button">
                  Admin Dashboard
                </Link>
              )}
            </div>
          </header>

          <div className="main-container">
            <main className="main-content">
              <ErrorDisplay error={error} />
              <SuccessDisplay success={success || passwordChangeSuccess || profileUpdateSuccess} />

              {activeTab === 'routes' && (
                <>
                  <div className="content-header">
                    <h3>My Bus Routes</h3>
                    <button onClick={() => setShowAddRouteModal(true)} className="primary-button">
                      <FiPlus /> Add Route
                    </button>
                  </div>

                  <div className="route-grid">
                    {routes.map((route) => (
                      <RouteCard key={route._id} route={route} onOpenDeleteModal={openDeleteModal} userRole={user?.role} onDownloadPDF={downloadPDF} />
                    ))}
                  </div>
                </>
              )}
            </main>
          </div>

          <AddRouteModal 
            show={showAddRouteModal}
            onClose={() => setShowAddRouteModal(false)}
            onAddRoute={addRouteHandler} 
            routeName={routeName} 
            setRouteName={setRouteName} 
            userRole={user?.role}
            drivers={drivers}
            selectedDriverId={selectedDriverId}
            setSelectedDriverId={setSelectedDriverId}
            busNumberDigits={busNumberDigits}
            setBusNumberDigits={(val) => {
              const cleaned = String(val).replace(/[^a-zA-Z0-9]/g, '');
              setBusNumberDigits(cleaned);
            }}
            routeNumber={routeNumber}
            setRouteNumber={(val) => {
              const cleaned = String(val).replace(/\D/g, '').slice(0, 3);
              setRouteNumber(cleaned);
            }}
          />
                  <DeleteRouteModal 
            show={showDeleteModal} 
            onClose={closeDeleteModal} 
            onDelete={deleteRouteHandler} 
            route={routeToDelete} 
          />
          <UserDrawer 
            isOpen={isDrawerOpen} 
            onClose={() => setDrawerOpen(false)} 
            user={user} 
            onLogout={logoutHandler} 
            onEditProfile={() => {
              setShowEditProfileModal(true);
              setDrawerOpen(false);
            }}
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onUpdatePassword={updatePasswordHandler}
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmNewPassword={confirmNewPassword}
            setConfirmNewPassword={setConfirmNewPassword}
          />
          <EditProfileModal
            user={user}
            show={showEditProfileModal}
            onClose={() => setShowEditProfileModal(false)}
            onUpdate={updateProfileHandler}
          />
        </div>
      )}
    </div>
  );
};

// Sub-components
const RouteCard = ({ route, onOpenDeleteModal, userRole, onDownloadPDF }) => {
  return (
    <div className="card">
      <h4 className="card-title">{route.routeName}</h4>
      {userRole && userRole.toLowerCase() === 'admin' && route.driver && (
        <p className="driver-name">Driver: {route.driver.name}</p>
      )}
      <div className="card-actions">
        <Link to={`/route/${route._id}/students`} className="view-button">View Students</Link>
        <button onClick={() => onOpenDeleteModal(route)} className="delete-button">
          <FiTrash2 /> Delete
        </button>
        <button onClick={() => onDownloadPDF(route._id)} className="download-button">
          <FiDownload /> PDF
        </button>
      </div>
    </div>
  );
};

const UserDrawer = ({ 
  isOpen, 
  onClose, 
  user, 
  onLogout, 
  onEditProfile, 
  activeSection, 
  setActiveSection, 
  onUpdatePassword,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword
}) => {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose}></div>
      <div className={`drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>Profile</h3>
          <button onClick={onClose} className="close-button">
            <FiX className="icon" />
          </button>
        </div>

        <div className="drawer-content">
          {activeSection === 'profile' ? (
            <>
              <div className="profile-section">
                <div className="profile-avatar">
                  <FiUser className="icon" />
                </div>
                <div className="profile-info">
                  <h4 className="profile-name">{user?.name}</h4>
                  <p className="profile-email">{user?.email}</p>
                  <div className="profile-badge">
                    {user?.role?.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="drawer-menu">
                <button onClick={onEditProfile} className="drawer-menu-item">
                  <FiEdit2 className="menu-icon" />
                  <span>Edit Profile</span>
                  <FiChevronRight className="chevron-icon" />
                </button>

                <button onClick={() => setActiveSection('password')} className="drawer-menu-item">
                  <FiLock className="menu-icon" />
                  <span>Change Password</span>
                  <FiChevronRight className="chevron-icon" />
                </button>

                <button onClick={onLogout} className="drawer-menu-item logout">
                  <FiLogOut className="menu-icon rotate-180" />
                  <span>Logout</span>
                  <FiChevronRight className="chevron-icon" />
                </button>
              </div>
            </>
          ) : (
            <div className="password-section">
              <div className="section-header">
                <button onClick={() => setActiveSection('profile')} className="back-button">
                  <FiChevronRight className="rotate-180" />
                  Back
                </button>
                <h4>Change Password</h4>
              </div>

              <form onSubmit={onUpdatePassword} className="password-form">
                <PasswordInput 
                  label="Current Password" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  isVisible={showCurrentPassword} 
                  onToggle={() => setShowCurrentPassword(!showCurrentPassword)} 
                />
                <PasswordInput 
                  label="New Password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  isVisible={showNewPassword} 
                  onToggle={() => setShowNewPassword(!showNewPassword)} 
                />
                
                <div className="input-group">
                  <label className="input-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={confirmNewPassword} 
                    onChange={e => setConfirmNewPassword(e.target.value)} 
                    required 
                    className="input" 
                    placeholder="Confirm your new password"
                  />
                </div>

                <button type="submit" className="primary-button update-password-button">
                  Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const EditProfileModal = ({ show, onClose, user, onUpdate }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  const submitHandler = (e) => {
    e.preventDefault();
    onUpdate({ name, email });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ display: show ? 'flex' : 'none' }}>
      <div className="modal-content">
        <h3>Edit Profile</h3>
        <form onSubmit={submitHandler}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="input" />
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input" />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-button">Cancel</button>
            <button type="submit" className="primary-button">Update Profile</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PasswordInput = ({ label, value, onChange, isVisible, onToggle }) => (
  <div className="input-group">
    <label className="input-label">{label}</label>
    <div className="password-input-wrapper">
      <input 
        type={isVisible ? 'text' : 'password'} 
        value={value} 
        onChange={onChange} 
        required 
        className="input" 
        placeholder={`Enter your ${label.toLowerCase()}`}
      />
      <button type="button" onClick={onToggle} className="eye-button">
        {isVisible ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  </div>
);

const AddRouteModal = ({ show, onClose, onAddRoute, routeName, setRouteName, userRole, drivers, selectedDriverId, setSelectedDriverId, busNumberDigits, setBusNumberDigits, routeNumber, setRouteNumber }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" style={{ display: show ? 'flex' : 'none' }}>
      <div className="modal-content">
        <h3>Add New Route{routeNumber ? ` (Route ${routeNumber})` : ''}</h3>
        <form onSubmit={onAddRoute}>
          <div className="input-group">
            <label className="input-label">Route Name</label>
            <input type="text" value={routeName} onChange={(e) => setRouteName(e.target.value)} required className="input" />
          </div>

          <div className="input-group">
            <label className="input-label">Route Number (optional)</label>
            <input type="text" value={routeNumber} onChange={(e) => setRouteNumber(e.target.value)} className="input" placeholder="e.g. 5" />
          </div>

          <div className="input-group">
            <label className="input-label">Bus Number</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span className="input-prefix">MH09</span>
              <input
                type="text"
                value={busNumberDigits}
                onChange={(e) => setBusNumberDigits(e.target.value)}
                className="input"
                placeholder="Enter letters and digits"
              />
            </div>
            <small className="hint">Bus number plate (letters and digits)</small>
          </div>

          {userRole && userRole.toLowerCase() === 'admin' && (
            <div className="input-group">
              <label className="input-label">Assign Driver</label>
              <select value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} required className="input">
                <option value="">Select a driver</option>
                {drivers.map(d => (
                  <option key={d._id} value={d._id}>{d.name} ({d.email})</option>
                ))}
              </select>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="secondary-button">Cancel</button>
            <button type="submit" className="primary-button">Add Route</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteRouteModal = ({ show, onClose, onDelete, route }) => {
  if (!show) return null;
  return (
    <div className="modal-overlay" style={{ display: show ? 'flex' : 'none' }}>
      <div className="modal-content text-center">
        <h3 className="text-danger">Proceed with delete?</h3>
        <p>Confirm to delete <strong>{route?.routeName}</strong>?</p>
        <div className="modal-actions justify-center">
          <button onClick={onClose} className="secondary-button">No</button>
          <button onClick={onDelete} className="primary-button danger">Yes</button>
        </div>
      </div>
    </div>
  );
};
const ErrorDisplay = ({ error }) => error ? <div className="error-box">{error}</div> : null;
const SuccessDisplay = ({ success }) => success ? <div className="success-box">{success}</div> : null;

export default DashboardScreen;