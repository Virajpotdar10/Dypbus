import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { toast } from 'react-toastify';
import './StudentFormScreen.css'; // We will create this file next

const StudentFormScreen = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const [routeName, setRouteName] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    mobileNumber: '',
    parentMobileNumber: '',
    department: '',
    year: '',
    college: 'DYPCET',
    stop: ''
  });
  useEffect(() => {
    const fetchRouteInfo = async () => {
      try {
        const { data } = await API.get(`/api/v1/routes/${routeId}`);
        if (data.success) {
          setRouteName(data.data.routeName);
        } else {
          toast.error('Could not find the specified route.');
          navigate('/');
        }
      } catch (error) {
        console.error('Failed to fetch route info', error);
        toast.error('Invalid route link.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchRouteInfo();
  }, [routeId, navigate]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Capitalize first letter of each word for specified fields
    if (['firstName', 'middleName', 'lastName', 'year', 'stop'].includes(name)) {
      processedValue = value
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    setForm({ ...form, [name]: processedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Combine name fields into a single 'name' string
    const fullName = [form.firstName, form.middleName, form.lastName]
      .filter(Boolean) // Remove any empty parts
      .join(' ');

    const submissionData = {
      name: fullName,
      mobileNumber: form.mobileNumber,
      parentMobileNumber: form.parentMobileNumber,
      department: form.department,
      year: form.year,
      college: form.college,
      stop: form.stop,
    };

    try {
      const { data } = await API.post(`/api/v1/routes/${routeId}/students`, submissionData);
      if (data.success) {
        toast.success('Registration successful!');
        navigate('/thank-you');
      }
    } catch (error) {
      console.error('Failed to register student', error);
      const errorMsg = error.response?.data?.msg || 'Registration failed. Please check your details and try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !routeName) {
    return <div className="loading-container">Loading Form...</div>;
  }

  return (
    <div className="student-form-container">
      <div className="form-card">
        <h2 className="form-title">Bus Registration</h2>
        <p className="form-subtitle">Route: <strong>{routeName}</strong></p>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <input name="firstName" value={form.firstName} onChange={handleFormChange} placeholder="First Name" required />
            <input name="middleName" value={form.middleName} onChange={handleFormChange} placeholder="Middle Name" />
            <input name="lastName" value={form.lastName} onChange={handleFormChange} placeholder="Last Name" required />
            <input name="mobileNumber" value={form.mobileNumber} onChange={handleFormChange} placeholder="Your Mobile Number" required />
            <input name="parentMobileNumber" value={form.parentMobileNumber} onChange={handleFormChange} placeholder="Parent's Mobile Number" required />
            <select name="college" value={form.college} onChange={handleFormChange}>
              <option value="DYPCET">DYPCET</option>
              <option value="DYPSEM">DYPSEM</option>
              <option value="Diploma">Diploma</option>
            </select>
            <input name="year" value={form.year} onChange={handleFormChange} placeholder="Year (e.g., FY, SY, TY...)" required />

            <select
              name="department"
              value={form.department}
              onChange={handleFormChange}
              required
            >
              <option value="">Select Department</option>
              <option value="CSE">CSE</option>
              <option value="CSE-AIML">CSE-AIML</option>
              <option value="CSE-DS">CSE-DS</option>
              <option value="ENTC">ENTC</option>
              <option value="MECHANICAL">MECHANICAL</option>
              <option value="CIVIL">CIVIL</option>
              <option value="CHEMICAL">CHEMICAL</option>
              <option value="ARCH">ARCHITECTURE</option>
            </select>

  
            <input name="stop" value={form.stop} onChange={handleFormChange} placeholder="Your Pickup Point / Bus Stop" required />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentFormScreen;   