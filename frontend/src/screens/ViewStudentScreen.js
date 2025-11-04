import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';
import ConfirmationModal from '../components/ConfirmationModal';
import { FiUser, FiRefreshCw } from 'react-icons/fi';
import './AdminScreen.css'; // Reuse styles from AdminScreen

const ViewStudentScreen = () => {
  const { routeId } = useParams();
  const [students, setStudents] = useState([]);
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const [routeRes, studentsRes] = await Promise.all([
        API.get(`/api/v1/routes/${routeId}`),
        API.get(`/api/v1/routes/${routeId}/students`)
      ]);
      setRoute(routeRes.data.data);
      setStudents(studentsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleResetFees = async () => {
    try {
      const { data } = await API.post(`/api/v1/routes/${routeId}/students/reset-fees`);
      alert(data.message);
      setIsResetModalOpen(false);
      fetchStudents(); // Refresh the list
    } catch (error) {
      alert(`Error: ${error.response?.data?.msg || 'Could not reset fees.'}`);
    }
  };

  if (loading) {
    return <div className="admin-loading-screen"><div className="loading-spinner"></div><p>Loading Students...</p></div>;
  }

  return (
    <div className="admin-dashboard" style={{ padding: '2rem' }}>
      <div className="tab-panel">
        <div className="panel-header">
          <h2>Students for {route?.routeName}</h2>
          <div className="header-actions">
            <button onClick={() => setIsResetModalOpen(true)} className="btn btn-warning">
              <FiRefreshCw /> Reset Fees
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name & Pickup Point</th>
                <th>Contact</th>
                <th>Department & Year</th>
                <th>Fee Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student._id}>
                  <td>
                    <div className="student-name">{student.name}</div>
                    {student.pickupPoint && <div className="student-stop">{student.pickupPoint}</div>}
                  </td>
                  <td>
                    <div>{student.mobileNumber}</div>
                    {student.parentMobileNumber && <div className="text-muted">P: {student.parentMobileNumber}</div>}
                  </td>
                  <td>
                    <div>{student.department}</div>
                    <div className="text-muted">{student.year}</div>
                  </td>
                  <td>
                    <span className={`status-badge ${student.feeStatus === 'Paid' ? 'paid' : 'pending'}`}>
                      {student.feeStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {students.length === 0 && (
            <div className="empty-state">
              <FiUser size={48} />
              <h3>No Students Found</h3>
              <p>Students registered for this route will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {isResetModalOpen && (
        <ConfirmationModal
          title="Confirm Fee Reset"
          message="Do you really want to reset all students’ fee status in this route to 'Not Paid'?"
          onConfirm={handleResetFees}
          onCancel={() => setIsResetModalOpen(false)}
          confirmText="Yes, Reset"
        />
      )}
    </div>
  );
};

export default ViewStudentScreen;