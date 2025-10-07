import React, { useState, useEffect, useCallback } from 'react';
import API, { socket } from '../api'; // Use the centralized API instance and import socket
import { useParams, useNavigate } from 'react-router-dom';
import { FiUsers, FiCheckCircle, FiXCircle, FiSearch, FiPlus, FiChevronDown, FiEdit2, FiTrash2, FiArrowLeft, FiFilter, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify'; 
import './StudentsScreen.css';

const StudentsScreen = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [routeInfo, setRouteInfo] = useState({});
  const [stats, setStats] = useState({ paid: 0, notPaid: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedStudent] = useState(null); // For sliding panel
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  // Add this line
const [activeStudentId, setActiveStudentId] = useState(null);
  // Filters
  const [filters, setFilters] = useState({
    feeStatus: '',
    department: '',
    college: ''
  });

  const [form, setForm] = useState({
    name: '',
    mobileNumber: '',
    department: '',
    parentMobileNumber: '',
    stop: '',
    feeStatus: 'Not Paid',
    college: 'DYPCET'
  });

  const fetchStudents = useCallback(async (page = currentPage, search = searchTerm) => {
    if (!routeId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sortBy: sortOption,
        sortOrder: sortOrder,
        ...(search && { search }),
        ...(filters.feeStatus && { feeStatus: filters.feeStatus }),
        ...(filters.department && { department: filters.department }),
        ...(filters.college && { college: filters.college })
      });

      const { data } = await API.get(`/api/v1/routes/${routeId}/students?${params}`);
      
      if (data.success) {
        setStudents(data.data || []);
        setRouteInfo(data.route || {});
        setStats(data.stats || { paid: 0, notPaid: 0 });
        
        if (data.pagination) {
          setCurrentPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalStudents(data.pagination.total);
          setHasNextPage(data.pagination.hasNextPage);
          setHasPrevPage(data.pagination.hasPrevPage);
        }
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again.');
      toast.error('Could not fetch students');
    } finally {
      setLoading(false);
    }
  }, [routeId, currentPage, pageSize, sortOption, sortOrder, filters, searchTerm]);

  // Inline debounced search using effect (replaces custom debounce hooks)
  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
      fetchStudents(1, searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, fetchStudents]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);
  useEffect(() => {
    if (!routeId) return;

    // Connect the socket and join the room
    socket.connect();
    socket.emit('joinRouteRoom', routeId);

    // Listener for when a student is updated
    const handleStudentUpdate = (updatedStudent) => {
      if (updatedStudent.route === routeId) {
        setStudents((prevStudents) =>
          prevStudents.map((s) => (s._id === updatedStudent._id ? updatedStudent : s))
        );
        toast.info(`Student ${updatedStudent.name} was updated.`);
      }
    };

    // Listener for when a new student is added
    const handleStudentAdd = (newStudent) => {
      if (newStudent.route === routeId) {
        setStudents((prevStudents) => [...prevStudents, newStudent]);
        setTotalStudents((prev) => prev + 1);
        toast.info(`New student ${newStudent.name} was added.`);
      }
    };

    // Listener for when a student is deleted
    const handleStudentDelete = (deletedStudentId, studentRouteId) => {
      if (studentRouteId === routeId) {
        setStudents((prevStudents) =>
          prevStudents.filter((s) => s._id !== deletedStudentId)
        );
        setTotalStudents((prev) => prev - 1);
        toast.warn('A student was deleted.');
      }
    };

    socket.on('studentUpdated', handleStudentUpdate);
    socket.on('studentAdded', handleStudentAdd);
    socket.on('studentDeleted', handleStudentDelete);

    // Cleanup on component unmount
    return () => {
      socket.emit('leaveRouteRoom', routeId);
      socket.off('studentUpdated', handleStudentUpdate);
      socket.off('studentAdded', handleStudentAdd);
      socket.off('studentDeleted', handleStudentDelete);
      socket.disconnect();
    };
  }, [routeId]);
  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const url = isEditing ? `/api/v1/students/${isEditing._id}` : `/api/v1/routes/${routeId}/students`;
    const method = isEditing ? 'put' : 'post';
// Add this line for debugging
      console.log('Submitting student data:', form);
    try {
      const { data } = await API[method](url, form);
      if (data.success) {
        if (isEditing) {
          toast.success('Student updated successfully!');
          // Update local state immediately for better UX
          setStudents(prev => prev.map(student => 
            student._id === isEditing._id ? data.data : student
          ));
        } else {
          toast.success('Student added successfully!');
          // Add to local state immediately for better UX
          setStudents(prev => [...prev, data.data]);
          setTotalStudents(prev => prev + 1);
        }
        closeModal();
      }
    } catch (error) {
      console.error('Error saving student:', error);
      const errorMsg = error.response?.data?.msg || `Could not ${isEditing ? 'update' : 'add'} student`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (student = null) => {
    if (student) {
      setIsEditing(student);
      setForm({
        name: student.name,
        mobileNumber: student.mobileNumber,
        parentMobileNumber: student.parentMobileNumber,
        department: student.department,
        stop: student.stop,
        feeStatus: student.feeStatus,
        college: student.college || 'DYPCET'
      });
    } else {
      setIsEditing(null);
      setForm({ name: '', mobileNumber: '',parentMobileNumber: '', department: '', stop: '', feeStatus: 'Not Paid', college: 'DYPCET' });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false); // Correctly close the add/edit modal
    setIsEditing(null);
    setForm({ name: '', mobileNumber: '',parentMobileNumber: '', department: '', stop: '', feeStatus: 'Not Paid', college: 'DYPCET' });
  };

  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setStudentToDelete(null);
    setShowDeleteModal(false);
  };
  const toggleStudentDetails = (studentId) => {
    setActiveStudentId(prevId => (prevId === studentId ? null : studentId));
  };
  const handleToggleFeeStatus = async (student) => {
    const newStatus = student.feeStatus === 'Paid' ? 'Not Paid' : 'Paid';
    try {
      await API.put(`/api/v1/students/${student._id}`, { feeStatus: newStatus });
      setStudents(prevStudents => 
        prevStudents.map(s => 
          s._id === student._id ? { ...s, feeStatus: newStatus } : s
        )
      );
      toast.success(`${student.name}'s fee status updated to ${newStatus}`);
    } catch (error) {
      console.error('Failed to toggle fee status', error);
      toast.error('Could not update fee status.');
    }
  };

  const confirmDelete = async () => {
    try {
      await API.delete(`/api/v1/students/${studentToDelete._id}`);
      toast.success('Student deleted successfully!');
      closeDeleteModal();
      fetchStudents(); // Refresh current page
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Could not delete student');
    }
  };
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchStudents(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchStudents(1);
  };

  const handleSortChange = (newSort) => {
    if (newSort === sortOption) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(newSort);
      setSortOrder('asc');
    }
    setCurrentPage(1);
    setShowSortDropdown(false);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ feeStatus: '', department: '', college: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const exportStudents = async (format) => {
    try {
      const { data } = await API.get(`/api/v1/routes/${routeId}/students/export.${format}`,
        { responseType: 'blob' }
      );
      const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
      const safeName = (routeInfo.routeName || 'route').replace(/[^a-z0-9-]+/gi,'_');
      handleDownload(data, `${safeName}-students-${ts}.${format}`);
      toast.success(`Exported ${format.toUpperCase()} successfully`);
    } catch (err) {
      console.error('Export error:', err);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const handleDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const sortOptions = ['createdAt', 'name', 'department', 'feeStatus', 'stop'];

  return (
    <div className="students-screen-container">
      <header className="students-header">
        <div className="header-left">
          <button onClick={() => navigate('/')} className="back-link"><FiArrowLeft /> Back</button>
          <h2 className="header-title">{routeInfo.routeName || 'Loading...'}</h2>
          <div className="header-stats">
            <span><FiUsers /> {totalStudents} Total</span>
            <span><FiCheckCircle style={{ color: 'green' }} /> {stats.paid} Paid</span>
            <span><FiXCircle style={{ color: 'red' }} /> {stats.notPaid} Not Paid</span>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => exportStudents('csv')} title="Export CSV" className="export-button">
            <FiDownload /> CSV
          </button>
          <button onClick={() => exportStudents('pdf')} title="Export PDF" className="export-button">
            <FiDownload /> PDF
          </button>
        </div>
      </header>

      <main className="students-main">
        {/* Enhanced Controls */}
        <div className="controls-container">
          <div className="search-input-wrapper">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search students by name, department, or phone" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="search-input"
            />
          </div>
          
          <div className="filters-container">
            <select 
              value={filters.feeStatus} 
              onChange={e => handleFilterChange('feeStatus', e.target.value)}
              className="filter-select"
            >
              <option value="">All Fee Status</option>
              <option value="Paid">Paid</option>
              <option value="Not Paid">Not Paid</option>
            </select>
            
            <select 
              value={filters.college} 
              onChange={e => handleFilterChange('college', e.target.value)}
              className="filter-select"
            >
              <option value="">All Colleges</option>
              <option value="DYPCET">DYPCET</option>
              <option value="DYPSEM">DYPSEM</option>
              <option value="Diploma">Diploma</option>
            </select>
            
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>

          <div className="sort-dropdown-wrapper">
            <button 
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="sort-button"
            >
              <FiFilter /> Sort by {sortOption} ({sortOrder})
            </button>
            {showSortDropdown && (
              <div className="sort-dropdown">
                {sortOptions.map(option => (
                  <button
                    key={option}
                    onClick={() => handleSortChange(option)}
                    className={`sort-option ${sortOption === option ? 'active' : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Page Size Selector */}
        <div className="page-controls">
          <div className="page-size-selector">
            <label>Show: </label>
            <select value={pageSize} onChange={e => handlePageSizeChange(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span> per page</span>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        )}

        {error && (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={() => fetchStudents()} className="retry-button">
              Retry
            </button>
          </div>
        )}

        {/* Student List */}
        {!loading && !error && (
          <div className="students-list">
            {students.length === 0 ? (
              <div className="no-students">
                <p>No students found for the current filters.</p>
                <button onClick={() => openModal()} className="add-first-student-btn">
                  Add First Student
                </button>
              </div>
            ) : (
              students.map(student => (
                // Inside the students.map(...)
<StudentCard 
  key={student._id} 
  student={student} 
  isActive={activeStudentId === student._id}
  onToggleDetails={() => toggleStudentDetails(student._id)}
  onEdit={() => openModal(student)}
  onDelete={() => openDeleteModal(student)}
  onToggleFee={() => handleToggleFeeStatus(student)} // <-- Add this prop
/>
              ))
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalStudents)} of {totalStudents} students
            </div>
            <div className="pagination-controls">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!hasPrevPage}
                className="pagination-btn"
              >
                <FiChevronLeft /> Previous
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!hasNextPage}
                className="pagination-btn"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FAB */}
      <button onClick={() => openModal()} className="fab-add-student">
        <FiPlus />
      </button>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{isEditing ? 'Edit Student' : 'Add New Student'}</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-form-grid">
              <ModalInput name="name" value={form.name} onChange={handleFormChange} placeholder="Full Name" required />
<ModalInput name="mobileNumber" value={form.mobileNumber} onChange={handleFormChange} placeholder="Mobile Number" />
<ModalInput name="department" value={form.department} onChange={handleFormChange} placeholder="Department" required />
<ModalInput name="stop" value={form.stop} onChange={handleFormChange} placeholder="Bus Stop" required />
<ModalInput name="parentMobileNumber" value={form.parentMobileNumber} onChange={handleFormChange} placeholder="Parent Mobile Number" />
                {/* Fee status when editing existing student */}
                {isEditing && (
                  <div className="modal-input-group">
                    <label>Fee Status</label>
                    <select name="feeStatus" value={form.feeStatus} onChange={handleFormChange}>
                      <option>Not Paid</option>
                      <option>Paid</option>
                    </select>
                  </div>
                )}
                {/* College selection (required) */}
                <div className="modal-input-group">
                  <label>College</label>
                  <select name="college" value={form.college} onChange={handleFormChange}>
                    <option>DYPCET</option>
                    <option>DYPSEM</option>
                    <option>Diploma</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="modal-button cancel-button">Cancel</button>
                <button type="submit" className="modal-button submit-button" disabled={loading}>
                  {loading ? 'Saving...' : (isEditing ? 'Update Student' : 'Add Student')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal-content">
            <h3>Delete Student</h3>
            <p>
              Are you sure you want to delete <strong>{studentToDelete?.name}</strong>? This action cannot be undone.
            </p>
            <div className="modal-actions" style={{ justifyContent: 'center' }}>
              <button onClick={closeDeleteModal} className="modal-button cancel-button">Cancel</button>
              <button onClick={confirmDelete} className="modal-button confirm-delete-button">Confirm Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Sliding Panel */}
      {isPanelOpen && (
        <StudentSlidingPanel 
          student={selectedStudent} 
          onClose={() => setIsPanelOpen(false)} 
          onEdit={openModal}
          onDelete={openDeleteModal}
        />
      )}
    </div>
  );
};

const StudentSlidingPanel = ({ student, onClose, onEdit, onDelete }) => {
  if (!student) return null;

  return (
    <div className="sliding-panel-overlay" onClick={onClose}>
      <div className="sliding-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h3>{student.name}</h3>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <div className="panel-content">
          <p><strong>Mobile:</strong> {student.mobileNumber}</p>
          <p><strong>Department:</strong> {student.department}</p>
          <p><strong>Year:</strong> {student.year || 'N/A'}</p>
          <p><strong>College:</strong> {student.college || 'N/A'}</p>
          <p><strong>Stop:</strong> {student.stop}</p>
          <p><strong>Fee Status:</strong> <span className={`fee-status ${student.feeStatus === 'Paid' ? 'paid' : 'not-paid'}`}>{student.feeStatus}</span></p>
        </div>
        <div className="panel-footer">
          <button onClick={() => { onEdit(student); onClose(); }} className="action-button edit-button"><FiEdit2 /> Edit</button>
          <button onClick={() => { onDelete(student); onClose(); }} className="action-button delete-button"><FiTrash2 /> Delete</button>
        </div>
      </div>
    </div>
  );
};

const ModalInput = ({ name, ...props }) => (
  <div className="modal-input-group-single">
    <label>{name.replace('Number', ' Number')}</label>
    <input name={name} {...props}  />
  </div>
);
const StudentCard = ({ student, isActive, onToggleDetails, onEdit, onDelete, onToggleFee }) => (
  <div className={`student-card-container ${isActive ? 'active' : ''}`}>
    <div className="student-card-header" onClick={onToggleDetails}>
      <div className="student-info">
        <span className="student-name">{student.name}</span>
        <span className="student-mobile">{student.mobileNumber}</span>
      </div>
      <div className="student-card-actions">
        <span className={`fee-status ${student.feeStatus === 'Paid' ? 'paid' : 'not-paid'}`}>\
          {student.feeStatus}
        </span>
        <button className="details-toggle">
          <FiChevronDown className="toggle-icon" />
        </button>
      </div>
    </div>
    {isActive && (
      <div className="student-card-details">
        <div className="details-grid">
          <p><strong>Department:</strong> {student.department}</p>
          <p><strong>College:</strong> {student.college}</p>
          <p><strong>Bus Stop:</strong> {student.stop}</p>
          <p><strong>Parent Mobile:</strong> {student.parentMobileNumber || 'N/A'}</p>
        </div>
        <div className="details-actions">
          <button onClick={onEdit} className="btn btn-secondary"><FiEdit2 /> Edit</button>
          <button onClick={onDelete} className="btn btn-danger"><FiTrash2 /> Delete</button>
          <button 
    onClick={onToggleFee} 
    className={`btn ${student.feeStatus === 'Paid' ? 'btn-warning' : 'btn-success'}`}
  >
    {student.feeStatus === 'Paid' ? 'Mark as Not Paid' : 'Mark as Paid'}
  </button>

        </div>
      </div>
    )}
  </div>
);
export default StudentsScreen;