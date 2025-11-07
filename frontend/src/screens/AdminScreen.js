import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './AdminScreen.css';
import ConfirmationModal from '../components/ConfirmationModal';

import {
  FiTruck,
  FiUser,
  FiBook,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiDownload,
  FiRefreshCw,
  FiLogOut,
  FiX,
  FiUserPlus,
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
      <button onClick={() => window.location.href = '/'} className="btn btn-driver-view">
        Back
      </button>
    </div>
    <h1 className="header-title">
      Admin Dashboard
    </h1>
    <div className="header-right">
      <button onClick={onLogout} className="btn-logout">
        <FiLogOut /> Log out
      </button>
    </div>
  </header>
);

const AdminTabs = () => {
  const [activeTab, setActiveTab] = useState('students');
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
          title="Students"
          count={stats.students}
          icon={<FiBook />}
          color="#f59e0b"
          onClick={() => setActiveTab('students')}
        />
        <StatCard
          title="Routes"
          count={stats.routes}
          icon={<FiTruck />}
          color="#10b981"
          onClick={() => setActiveTab('routes')}
        />
        <StatCard
          title="Drivers"
          count={stats.drivers}
          icon={<FiUser />}
          color="#4f46e5"
          onClick={() => setActiveTab('drivers')}
        />
      </div>
      <div className="tabs-navigation">
        <TabButton
          name="students"
          count={stats.students}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          icon={<FiBook />}
        />
        <TabButton
          name="routes"
          count={stats.routes}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          icon={<FiTruck />}
        />
        <TabButton
          name="drivers"
          count={stats.drivers}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          icon={<FiUser />}
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
            {activeTab === 'students' && <StudentsTab students={data.students} routes={data.routes} fetchData={fetchData} />}
            {activeTab === 'routes' && <RoutesTab routes={data.routes} drivers={data.drivers} fetchData={fetchData} />}
            {activeTab === 'drivers' && <DriversTab drivers={data.drivers} fetchData={fetchData} />}
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

const StudentsTab = ({ students, routes, fetchData }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [filters, setFilters] = useState({ route: 'All', search: '' });
  const [collegeCounts, setCollegeCounts] = useState({ DYPCET: 0, DYPSEM: 0, Diploma: 0 });
  const handleFilterChange = (routeId) => {
    setFilters(prev => ({ ...prev, route: routeId }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };
  const handleDelete = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await API.delete(`/api/v1/students/${studentId}`);
      } catch (error) {
        console.error('Failed to delete student', error);
      }
    }
  };
  const handleResetFees = async () => {
    try {

      await API.post(`/api/v1/students/reset-all-fees`);
      alert('Fee status for ALL students in the system has been reset to Not Paid.');
      setIsResetModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to reset all fees', error);
      alert(`Error: ${error.response?.data?.msg || 'Could not reset all fees.'}`);
    }
  };
  const handleDownload = async (format) => {
    const routeId = filters.route;
    if (routeId === 'All') {
      alert('Please select a specific route to export students.');
      return;
    }
    try {
      const response = await API.get(`/api/v1/routes/${routeId}/students/export.${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `route-${routeId}-students.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(`Failed to download ${format}`, error);
      alert(`Could not export ${format}. Please try again.`);
    }
  };

  const filteredStudents = React.useMemo(() => {
    return students.filter(student => {
      const searchMatch = filters.search
        ? student.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.department.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.mobileNumber.includes(filters.search)
        : true;

      const routeMatch = filters.route !== 'All'
        ? student.route?._id === filters.route
        : true;

      return searchMatch && routeMatch;
    });
  }, [students, filters]);

  useEffect(() => {
    const counts = {
      DYPCET: 0,
      DYPSEM: 0,
      Diploma: 0,
    };

    filteredStudents.forEach(student => {
      if (student.college === 'DYPCET') {
        counts.DYPCET++;
      } else if (student.college === 'DYPSEM') {
        counts.DYPSEM++;
      } else if (student.college === 'Diploma') {
        counts.Diploma++;
      }
    });

    setCollegeCounts(counts);
  }, [filteredStudents]);

  return (
    <div className="tab-panel">
      <div className="panel-header">
        <h2>Students Management</h2>
        <div className="header-actions">
          <button onClick={() => handleDownload('csv')} className="btn btn-secondary">
            <FiDownload /> Export CSV
          </button>
          <button onClick={() => handleDownload('pdf')} className="btn btn-secondary">
            <FiDownload /> Export PDF
          </button>
          <button onClick={() => setIsResetModalOpen(true)} className="btn btn-warning">
            <FiRefreshCw /> Reset Fees
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

        <div className="search-box">
          <FiTruck className="search-icon" />
          <select onChange={(e) => handleFilterChange(e.target.value)} value={filters.route}>
            <option value="All">All Routes</option>
            {routes.map(route => (
              <option key={route._id} value={route._id}>{route.routeName}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="college-counts-container">
        <h4 className="counts-title">
          {filters.route === 'All' ? 'Total Student Counts by College' : 'Counts for Selected Route'}
        </h4>
        <div className="counts-wrapper">
          <div className="count-box">
            <div className="count-college">DYPCET</div>
            <div className="count-number">{collegeCounts.DYPCET}</div>
          </div>
          <div className="count-box">
            <div className="count-college">DYPSEM</div>
            <div className="count-number">{collegeCounts.DYPSEM}</div>
          </div>
          <div className="count-box">
            <div className="count-college">Diploma</div>
            <div className="count-number">{collegeCounts.Diploma}</div>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Name </th>
              <th>Contact</th>
              <th>Department & Year</th>
              <th>Route</th>
              <th>Fee Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student._id}>
                <td data-label="Student">
                  <div className="student-name">{student.name}</div>
                  {student.pickupPoint && <div className="student-stop">{student.pickupPoint}</div>}
                </td>
                <td data-label="Contact">
                  <div>{student.mobileNumber}</div>
                  {student.parentMobileNumber && <div className="text-muted">P: {student.parentMobileNumber}</div>}
                </td>
                <td data-label="Details">
                  <div>{student.department}</div>
                  <div className="text-muted">{student.year}</div>
                </td>
                <td data-label="Route">
                  <span className={`route-tag ${student.route ? '' : 'no-route'}`}>
                    {student.route?.routeName || 'No Route'}
                  </span>
                </td>
                <td data-label="Fee Status">
                  <span className={`status-badge ${student.feeStatus === 'Paid' ? 'paid' : 'pending'}`}>
                    {student.feeStatus}
                  </span>
                </td>
                <td data-label="Actions">
                  <div className="action-buttons">
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
            <p>Try adjusting your filters or add a new student.</p>
          </div>
        )}
      </div>
      {isResetModalOpen && (
        <ConfirmationModal
          title="Confirm Fee Reset"
          message="Are you sure you want to reset all student fees for the selected route to 'Not Paid'? This action cannot be undone."
          onConfirm={handleResetFees}
          onCancel={() => setIsResetModalOpen(false)}
          confirmText="Yes, Reset Fees"
        />
      )}
    </div>
  );
};

const RoutesTab = ({ routes, drivers, fetchData }) => {
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState('');

  const handleEdit = (route) => {
    setEditingRouteId(route._id);
    setSelectedDriverId(route.driver?._id || '');
  };

  const handleCancel = () => {
    setEditingRouteId(null);
    setSelectedDriverId('');
  };
const handleSave = async (routeId) => {
    try {
      const payload = {
        driver: selectedDriverId ? selectedDriverId : null
      };
        await API.put(`/api/v1/routes/${routeId}`, payload);
      fetchData();
      handleCancel();
    } catch (error) {
      console.error('Failed to update driver for route', error);
      alert(`Error: Could not update driver. ${error.response?.data?.msg || error.message}`);
    }
  };
  const copyToClipboard = (routeId) => {
    const link = `${window.location.origin}/route/${routeId}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Registration link copied to clipboard!');
    }, (err) => {
      console.error('Could not copy text: ', err);
      alert('Failed to copy link.');
    });
  };

  const handleDelete = async (routeId) => {
    if (window.confirm('Are you sure you want to delete this route? This will also unassign all students from it.')) {
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
      </div>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Route Name</th>
              <th>Assigned Driver</th>
              <th>Capacity</th>
              <th>Registration Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {routes.map(route => (
              <tr key={route._id}>
                <td data-label="Route Name">{route.routeName}</td>
                <td data-label="Driver">
                  {editingRouteId === route._id ? (
                    <select
                      value={selectedDriverId}
                      onChange={(e) => setSelectedDriverId(e.target.value)}
                      className="driver-select"
                    >
                      <option value="">Not Assigned</option>
                      {drivers.map(driver => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name} ({driver.email})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={`driver-tag ${route.driver ? '' : 'no-driver'}`}>
                      {route.driver?.name || 'Not Assigned'}
                    </span>
                  )}
                </td>
                <td data-label="Capacity">{route.capacity}</td>
                <td data-label="Link">
                  <button onClick={() => copyToClipboard(route._id)} className="btn btn-link">
                    Copy Link
                  </button>
                </td>
                <td data-label="Actions">
                  <div className="action-buttons">
                    {editingRouteId === route._id ? (
                      <>
                        <button onClick={() => handleSave(route._id)} className="btn btn-primary btn-sm">Save</button>
                        <button onClick={handleCancel} className="btn btn-secondary btn-sm">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(route)} className="btn btn-icon btn-edit" title="Edit Driver">
                          <FiEdit />
                        </button>
                        <button onClick={() => handleDelete(route._id)} className="btn-icon btn-delete" title="Delete">
                          <FiTrash2 />
                        </button>
                      </>
                    )}
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
            <p>Click 'Add Route' to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
};
const DriversTab = ({ drivers, fetchData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'driver' });
  const [driverToDelete, setDriverToDelete] = useState(null);

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


  const confirmDelete = async () => {
    if (!driverToDelete) return;
    try {
      // Step 1: Unassign the driver from all routes first.
      await API.post(`/api/v1/users/${driverToDelete._id}/unassign`);

      // Step 2: Now, delete the driver.
      await API.delete(`/api/v1/users/${driverToDelete._id}`);

      fetchData(); // Refresh all data
      setDriverToDelete(null); // Close the modal on success
    } catch (error) {
      console.error('Failed to delete driver', error);
      alert(`Error: Could not delete driver. ${error.response?.data?.msg || ''}`);
    }
  };
  return (
    <div className="tab-panel">
      <div className="panel-header">

        <h2>Drivers Management</h2>
        <div className="header-actions">
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <FiUserPlus /> Add User
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(driver => (
              <tr key={driver._id}>
                <td data-label="Name">{driver.name}</td>
                <td data-label="Email">{driver.email}</td>
                <td data-label="Role">
                  <span className={`role-badge ${driver.role}`}>{driver.role}</span>
                </td>
                <td data-label="Actions">
                  <div className="action-buttons">
                    <button onClick={() => handleOpenModal(driver)} className="btn btn-secondary btn-sm" title="Edit">
                      <FiEdit /> Edit
                    </button>
                    <button onClick={() => setDriverToDelete(driver)} className="btn btn-danger btn-sm" title="Delete">
                      <FiTrash2 /> Delete
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
      {driverToDelete && (
        <DeleteConfirmationModal
          driverName={driverToDelete.name}
          onConfirm={confirmDelete}
          onCancel={() => setDriverToDelete(null)}
        />
      )}
    </div>
  );
};
const DeleteConfirmationModal = ({ driverName, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal" style={{ maxWidth: '400px' }}>
      <div className="modal-header">
        <h3>Confirm Deletion</h3>
        <button onClick={onCancel} className="modal-close"><FiX /></button>
      </div>
      <div className="modal-body" style={{ padding: '1.5rem' }}>
        <p>Are you sure you want to remove <strong>{driverName}</strong>? This action cannot be undone.</p>
      </div>
      <div className="modal-actions">
        <button type="button" onClick={onCancel} className="btn btn-secondary">No, Cancel</button>
        <button type="button" onClick={onConfirm} className="btn btn-danger">Yes, Delete</button>
      </div>
    </div>
  </div>
);
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
            <input type="text" value={formData.name} onChange={(e) => {
              const capitalize = (str) => str.replace(/\b\w/g, char => char.toUpperCase());
              setFormData({ ...formData, name: capitalize(e.target.value) });
            }} required />
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