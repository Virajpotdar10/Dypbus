import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './AdminScreen.css';

// Icons (assuming you're using react-icons)
import { 
  FiUsers, 
  FiTruck, 
  FiUser, 
  FiBook, 
  FiSearch, 
  FiPlus, 
  FiEdit, 
  FiTrash2, 
  FiKey,
  FiDownload,
  FiLogOut,
  FiHome,
  FiFilter,
  FiX
} from 'react-icons/fi';

const AdminScreen = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data } = await API.get('/api/v1/auth/me');
        const role = (data?.data?.role || '').toLowerCase();
        if (role !== 'admin') {
          navigate('/');
        } else {
          setCurrentUser(data.data);
        }
      } catch (error) {
        console.error('Authentication check failed', error);
        setError('Authentication failed. Please log in again.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    checkAdminRole();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  if (!currentUser) {
    return (
      <div className="admin-loading-screen">
        <div className="loading-spinner"></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <AdminHeader user={currentUser} onLogout={handleLogout} />
      {error && <div className="alert alert-error">{error}</div>}
      <main className="admin-content">
        <AdminTabs />
      </main>
    </div>
  );
};

const AdminHeader = ({ user, onLogout }) => (
  <header className="admin-header">
    <div className="header-left">
      <h1>
        <FiUsers className="header-icon" />
        Admin Dashboard
      </h1>
      <p>Manage drivers, routes, and students</p>
    </div>
    <div className="header-right">
      <div className="user-profile">
        <div className="user-avatar">
          <FiUser />
        </div>
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-role">{user.role}</span>
        </div>
      </div>
      <button onClick={() => window.location.href = '/'} className="btn btn-secondary">
        <FiHome /> Driver View
      </button>
      <button onClick={onLogout} className="btn btn-danger">
        <FiLogOut /> Logout
      </button>
    </div>
  </header>
);

const AdminTabs = () => {
  const [activeTab, setActiveTab] = useState('drivers');
  const [data, setData] = useState({ drivers: [], routes: [], students: [] });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ drivers: 0, routes: 0, students: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [driversRes, routesRes, studentsRes] = await Promise.all([
        API.get('/api/v1/users'),
        API.get('/api/v1/routes'),
        API.get('/api/v1/students?page=1&limit=1000'),
      ]);
      
      const newData = {
        drivers: driversRes.data.data || [],
        routes: routesRes.data.data || [],
        students: studentsRes.data.data || [],
      };
      
      setData(newData);
      setStats({
        drivers: newData.drivers.length,
        routes: newData.routes.length,
        students: newData.students.length
      });
    } catch (error) {
      console.error('Failed to fetch admin data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const socket = io(API.defaults.baseURL);

    const setupSocketListeners = () => {
      // Drivers
      socket.on('driver:created', (newItem) => {
        setData(prev => ({ ...prev, drivers: [...prev.drivers, newItem.driver] }));
        setStats(prev => ({ ...prev, drivers: prev.drivers + 1 }));
      });
      socket.on('driver:updated', (updatedItem) => {
        setData(prev => ({ 
          ...prev, 
          drivers: prev.drivers.map(item => 
            item._id === updatedItem.driver._id ? updatedItem.driver : item
          ) 
        }));
      });
      socket.on('driver:deleted', (deletedItem) => {
        setData(prev => ({ 
          ...prev, 
          drivers: prev.drivers.filter(item => item._id !== deletedItem.driverId) 
        }));
        setStats(prev => ({ ...prev, drivers: prev.drivers - 1 }));
      });

      // Routes
      socket.on('route:created', (newItem) => {
        setData(prev => ({ ...prev, routes: [...prev.routes, newItem.route] }));
        setStats(prev => ({ ...prev, routes: prev.routes + 1 }));
      });
      socket.on('route:updated', (updatedItem) => {
        setData(prev => ({ 
          ...prev, 
          routes: prev.routes.map(item => 
            item._id === updatedItem.route._id ? updatedItem.route : item
          ) 
        }));
      });
      socket.on('route:deleted', (deletedItem) => {
        setData(prev => ({ 
          ...prev, 
          routes: prev.routes.filter(item => item._id !== deletedItem.routeId) 
        }));
        setStats(prev => ({ ...prev, routes: prev.routes - 1 }));
      });

      // Students
      socket.on('student:created', (newItem) => {
        setData(prev => ({ ...prev, students: [...prev.students, newItem.student] }));
        setStats(prev => ({ ...prev, students: prev.students + 1 }));
      });
      socket.on('student:updated', (updatedItem) => {
        setData(prev => ({ 
          ...prev, 
          students: prev.students.map(item => 
            item._id === updatedItem.student._id ? updatedItem.student : item
          ) 
        }));
      });
      socket.on('student:deleted', (deletedItem) => {
        setData(prev => ({ 
          ...prev, 
          students: prev.students.filter(item => item._id !== deletedItem.studentId) 
        }));
        setStats(prev => ({ ...prev, students: prev.students - 1 }));
      });
    };

    setupSocketListeners();

    return () => socket.disconnect();
  }, [fetchData]);

  return (
    <div className="admin-tabs-container">
      <div className="stats-cards">
        <StatCard 
          title="Drivers" 
          count={stats.drivers} 
          icon={<FiUser />} 
          color="#4f46e5" 
          onClick={() => setActiveTab('drivers')}
        />
        <StatCard 
          title="Routes" 
          count={stats.routes} 
          icon={<FiTruck />} 
          color="#10b981" 
          onClick={() => setActiveTab('routes')}
        />
        <StatCard 
          title="Students" 
          count={stats.students} 
          icon={<FiBook />} 
          color="#f59e0b" 
          onClick={() => setActiveTab('students')}
        />
      </div>
      
      <div className="tabs-navigation">
        <TabButton 
          name="drivers" 
          count={stats.drivers} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          icon={<FiUser />}
        />
        <TabButton 
          name="routes" 
          count={stats.routes} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          icon={<FiTruck />}
        />
        <TabButton 
          name="students" 
          count={stats.students} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          icon={<FiBook />}
        />
      </div>
      
      <div className="tab-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'drivers' && <DriversTab drivers={data.drivers} fetchData={fetchData} />}
            {activeTab === 'routes' && <RoutesTab routes={data.routes} drivers={data.drivers} fetchData={fetchData} />}
            {activeTab === 'students' && <StudentsTab students={data.students} routes={data.routes} fetchData={fetchData} />}
          </> 
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, count, icon, color, onClick }) => (
  <div className="stat-card" style={{ '--card-color': color }} onClick={onClick}>
    <div className="stat-icon" style={{ backgroundColor: color + '20', color }}>
      {icon}
    </div>
    <div className="stat-content">
      <h3>{count}</h3>
      <p>{title}</p>
    </div>
  </div>
);

const TabButton = ({ name, count, activeTab, setActiveTab, icon }) => (
  <button 
    className={`tab-btn ${activeTab === name ? 'active' : ''}`}
    onClick={() => setActiveTab(name)}
  >
    {icon}
    <span>{name.charAt(0).toUpperCase() + name.slice(1)}</span>
    {count > 0 && <span className="count-badge">{count}</span>}
  </button>
);

const StudentsTab = ({ students: initialStudents, routes, fetchData }) => {
  const [students, setStudents] = useState(initialStudents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [filters, setFilters] = useState({ college: 'All', search: '' });
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStudents = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page });
      if (filters.college !== 'All') params.append('college', filters.college);
      if (filters.search) params.append('search', filters.search);

      const { data } = await API.get(`/api/v1/students?${params.toString()}`);
      setStudents(data.data || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Failed to fetch students', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchStudents(currentPage);
  }, [fetchStudents, currentPage]);

  const handleFilterChange = (college) => {
    setFilters(prev => ({ ...prev, college }));
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setCurrentPage(1);
  };

  const handleOpenModal = (student = null) => {
    const initialFormData = { 
      name: '', 
      mobileNumber: '', 
      department: '', 
      stop: '', 
      feeStatus: 'Not Paid', 
      college: 'DYPCET', 
      route: '' 
    };
    
    if (student) {
      setEditingStudent(student);
      setFormData({ ...initialFormData, ...student, route: student.route?._id || '' });
    } else {
      setEditingStudent(null);
      setFormData(initialFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    setFormData({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingStudent ? `/api/v1/students/${editingStudent._id}` : '/api/v1/students';
    const method = editingStudent ? 'put' : 'post';
    try {
      await API[method](url, formData);
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save student', error);
    }
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await API.delete(`/api/v1/students/${studentId}`);
        fetchData();
      } catch (error) {
        console.error('Failed to delete student', error);
      }
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const response = await API.get('/api/v1/students/export.pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all-students.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download PDF', error);
    }
  };

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Students Management</h2>
        <div className="header-actions">
          <button onClick={handleDownloadPdf} className="btn btn-secondary">
            <FiDownload /> Export PDF
          </button>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <FiPlus /> Add Student
          </button>
        </div>
      </div>

      <div className="panel-filters">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, department, or mobile..." 
            value={filters.search} 
            onChange={handleSearchChange} 
          />
        </div>
        
        <div className="filter-buttons">
          {['All', 'DYPCET', 'DYPSEM', 'Diploma'].map(college => (
            <button 
              key={college}
              className={`filter-btn ${filters.college === college ? 'active' : ''}`}
              onClick={() => handleFilterChange(college)}
            >
              {college === 'All' ? 'All Students' : college}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>Department</th>
              <th>Route</th>
              <th>Fee Status</th>
              <th>College</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student._id}>
                <td>
                  <div className="student-name">{student.name}</div>
                  {student.stop && <div className="student-stop">{student.stop}</div>}
                </td>
                <td>{student.mobileNumber}</td>
                <td>{student.department}</td>
                <td>
                  <span className={`route-tag ${student.route ? '' : 'no-route'}`}>
                    {student.route?.routeName || 'No Route'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${student.feeStatus === 'Paid' ? 'paid' : 'pending'}`}>
                    {student.feeStatus}
                  </span>
                </td>
                <td>
                  <span className="college-badge">{student.college}</span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleOpenModal(student)} className="btn-icon btn-edit" title="Edit">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(student._id)} className="btn-icon btn-delete" title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {students.length === 0 && (
          <div className="empty-state">
            <FiUser size={48} />
            <h3>No Students Found</h3>
            <p>Try adjusting your search or add a new student</p>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(p => p - 1)} 
            disabled={!pagination.hasPrevPage}
            className="pagination-btn"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => p + 1)} 
            disabled={!pagination.hasNextPage}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {isModalOpen && (
        <StudentFormModal 
          routes={routes} 
          formData={formData} 
          setFormData={setFormData} 
          handleSubmit={handleSubmit} 
          handleCloseModal={handleCloseModal} 
          editingStudent={editingStudent} 
        />
      )}
    </div>
  );
};

const StudentFormModal = ({ routes, formData, setFormData, handleSubmit, handleCloseModal, editingStudent }) => (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h3>{editingStudent ? 'Edit Student' : 'Add New Student'}</h3>
        <button onClick={handleCloseModal} className="modal-close">
          <FiX />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              value={formData.name || ''} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Mobile Number</label>
            <input 
              type="text" 
              value={formData.mobileNumber || ''} 
              onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Department</label>
            <input 
              type="text" 
              value={formData.department || ''} 
              onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Bus Stop</label>
            <input 
              type="text" 
              value={formData.stop || ''} 
              onChange={(e) => setFormData({ ...formData, stop: e.target.value })} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Fee Status</label>
            <select 
              value={formData.feeStatus || 'Not Paid'} 
              onChange={(e) => setFormData({ ...formData, feeStatus: e.target.value })}
            >
              <option value="Not Paid">Not Paid</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>College</label>
            <select 
              value={formData.college || 'DYPCET'} 
              onChange={(e) => setFormData({ ...formData, college: e.target.value })}
            >
              <option value="DYPCET">DYPCET</option>
              <option value="DYPSEM">DYPSEM</option>
              <option value="Diploma">Diploma</option>
            </select>
          </div>
          
          <div className="form-group full-width">
            <label>Assign Route</label>
            <select 
              value={formData.route || ''} 
              onChange={(e) => setFormData({ ...formData, route: e.target.value })} 
              required
            >
              <option value="">Select a Route</option>
              {routes.map(route => (
                <option key={route._id} value={route._id}>
                  {route.routeName} {route.driver?.name && `(${route.driver.name})`}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="modal-actions">
          <button type="button" onClick={handleCloseModal} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {editingStudent ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const RoutesTab = ({ routes, drivers, fetchData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [formData, setFormData] = useState({ routeName: '', driver: '' });

  const handleOpenModal = (route = null) => {
    if (route) {
      setEditingRoute(route);
      setFormData({ routeName: route.routeName, driver: route.driver?._id || '' });
    } else {
      setEditingRoute(null);
      setFormData({ routeName: '', driver: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoute(null);
    setFormData({ routeName: '', driver: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingRoute ? `/api/v1/routes/${editingRoute._id}` : '/api/v1/routes';
    const method = editingRoute ? 'put' : 'post';
    try {
      await API[method](url, formData);
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save route', error);
    }
  };

  const handleDelete = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route? This action cannot be undone.')) {
      try {
        await API.delete(`/api/v1/routes/${routeId}`);
        fetchData();
      } catch (error) {
        console.error('Failed to delete route', error);
      }
    }
  };

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Routes Management</h2>
        <div className="header-actions">
          {/* Add Route button is intentionally removed as per your request */}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Route Name</th>
              <th>Assigned Driver</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(route => (
              <tr key={route._id}>
                <td>{route.routeName}</td>
                <td>
                  <span className={`driver-tag ${route.driver ? '' : 'no-driver'}`}>
                    {route.driver?.name || 'Not Assigned'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleOpenModal(route)} className="btn-icon btn-edit" title="Edit">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(route._id)} className="btn-icon btn-delete" title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {routes.length === 0 && (
          <div className="empty-state">
            <FiTruck size={48} />
            <h3>No Routes Found</h3>
            <p>Routes will appear here once they are created.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <RouteFormModal 
          drivers={drivers}
          formData={formData} 
          setFormData={setFormData} 
          handleSubmit={handleSubmit} 
          handleCloseModal={handleCloseModal} 
          editingRoute={editingRoute} 
        />
      )}
    </div>
  );
};

const RouteFormModal = ({ drivers, formData, setFormData, handleSubmit, handleCloseModal, editingRoute }) => (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h3>{editingRoute ? 'Edit Route' : 'Add New Route'}</h3>
        <button onClick={handleCloseModal} className="modal-close"><FiX /></button>
      </div>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Route Name</label>
            <input 
              type="text" 
              value={formData.routeName}
              onChange={(e) => setFormData({ ...formData, routeName: e.target.value })}
              required 
            />
          </div>
          <div className="form-group full-width">
            <label>Assign Driver</label>
            <select 
              value={formData.driver}
              onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
              required
            >
              <option value="">Select a Driver</option>
              {drivers.map(driver => (
                <option key={driver._id} value={driver._id}>{driver.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">
            {editingRoute ? 'Update Route' : 'Create Route'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

// REPLACE the old DriversTab with this new, complete version
const DriversTab = ({ drivers, fetchData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'driver' });

  const handleOpenModal = (driver = null) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({ name: driver.name, email: driver.email, password: '', role: driver.role });
    } else {
      setEditingDriver(null);
      setFormData({ name: '', email: '', password: '', role: 'driver' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    setFormData({ name: '', email: '', password: '', role: 'driver' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editingDriver ? `/api/v1/users/${editingDriver._id}` : '/api/v1/auth/register';
    const method = editingDriver ? 'put' : 'post';
    try {
      const payload = { ...formData };
      if (!editingDriver && !payload.password) {
        alert('Password is required for new drivers.');
        return;
      }
      if (editingDriver && !payload.password) {
        delete payload.password;
      }

      await API[method](url, payload);
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save driver', error);
      alert(`Error: ${error.response?.data?.msg || 'Could not save driver.'}`);
    }
  };

  const handleDelete = async (driverId) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await API.delete(`/api/v1/users/${driverId}`);
        fetchData();
      } catch (error) {
        console.error('Failed to delete driver', error);
      }
    }
  };

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Drivers Management</h2>
        <div className="header-actions">
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <FiPlus /> Add Driver
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver._id}>
                <td>{driver.name}</td>
                <td>{driver.email}</td>
                <td>
                  <span className={`role-badge ${driver.role}`}>{driver.role}</span>
                </td>
                <td>{new Date(driver.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button onClick={() => handleOpenModal(driver)} className="btn-icon btn-edit" title="Edit">
                      <FiEdit />
                    </button>
                    <button onClick={() => handleDelete(driver._id)} className="btn-icon btn-delete" title="Delete">
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {drivers.length === 0 && (
          <div className="empty-state">
            <FiUser size={48} />
            <h3>No Drivers Found</h3>
            <p>Click 'Add Driver' to create one.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <DriverFormModal 
          formData={formData} 
          setFormData={setFormData} 
          handleSubmit={handleSubmit} 
          handleCloseModal={handleCloseModal} 
          editingDriver={editingDriver} 
        />
      )}
    </div>
  );
};

// ADD this new component right below the DriversTab component
const DriverFormModal = ({ formData, setFormData, handleSubmit, handleCloseModal, editingDriver }) => (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <h3>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
        <button onClick={handleCloseModal} className="modal-close"><FiX /></button>
      </div>
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder={editingDriver ? 'Leave blank to keep unchanged' : ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingDriver} />
          </div>
          <div className="form-group">
            <label>Role</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
              <option value="driver">Driver</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">
            {editingDriver ? 'Update Driver' : 'Create Driver'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AdminScreen;