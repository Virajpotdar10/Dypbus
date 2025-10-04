import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FiUsers, FiSearch, FiPlus, FiFilter, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import 'jspdf-autotable';
import './AllStudentsScreen.css';


const COLLEGES = ['All', 'DYPCET', 'DYPSEM', 'Diploma'];
const FEE_STATUSES = ['All', 'Paid', 'Not Paid'];
const SORTS = {
  'Recently Added': 'createdAt:desc',
  'Name (A-Z)': 'name:asc',
  'Name (Z-A)': 'name:desc',
  'Fee Status': 'feeStatus:asc',
  'College': 'college:asc',
};

const AllStudentsScreen = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, paid: 0, notPaid: 0 });
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);

  // Filters
  const [college, setCollege] = useState('All');
  const [feeStatus, setFeeStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt:desc');

  const [showSort, setShowSort] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [driverName, setDriverName] = useState(localStorage.getItem('driverName') || '');

  const [form, setForm] = useState({
    name: '',
    mobileNumber: '',
    department: '',
    Year:'',
    feeStatus: 'Not Paid',
    college: 'DYPCET',
  });

  const config = useMemo(() => ({
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('authToken')}`,
    },
  }), []);

  const fetchStudents = async () => {
    try {
      const params = {
        page,
        limit,
        college,
        feeStatus,
        search,
        sortBy,
      };

      // Clean up params
      if (params.college === 'All') delete params.college;
      if (params.feeStatus === 'All') delete params.feeStatus;
      if (!params.search) delete params.search;

      const { data } = await axios.get('/api/v1/students', { ...config, params });

      setStudents(data.data || []);
      setTotal(data.total || 0);
      setStats(data.stats || { total: 0, paid: 0, notPaid: 0 });
    } catch (err) {
      toast.error('Failed to load students');
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents();
    }, 300); // Debounce search input
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, college, feeStatus, search, sortBy, config]);

  useEffect(() => {
    localStorage.setItem('driverName', driverName);
  }, [driverName]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= Math.ceil(total / limit)) {
      setPage(newPage);
    }
  };

  // Dashboard totals across ALL students
  const byCollege = useMemo(() => {
    const map = { DYPCET: { total: 0, paid: 0, notPaid: 0 }, DYPSEM: { total: 0, paid: 0, notPaid: 0 }, Diploma: { total: 0, paid: 0, notPaid: 0 } };
    // This is now a rough client-side estimate. For accuracy, this should come from the backend.
    // For now, we'll leave it as is, but a dedicated stats endpoint would be better.
    students.forEach(s => {
      if (!map[s.college]) return;
      map[s.college].total++;
      if (s.feeStatus === 'Paid') map[s.college].paid++; else map[s.college].notPaid++;
    });
    return map;
  }, [students]);

  const statsAll = useMemo(() => {
    // Use stats from the backend for the main display
    return stats;
  }, [stats]);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/v1/students', form, config);
      toast.success('Student added');
      setShowModal(false);
      setForm({ name: '', mobileNumber: '', department: '', feeStatus: 'Not Paid', college: form.college });
      fetchStudents(); // Refetch students to see the new entry
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to add student');
    }
  };

  const exportData = async (format) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`/api/v1/students/export.${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
      link.setAttribute('download', `all-students-${ts}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="all-students-page">
      <header className="asp-header">
        <div className="asp-left">
          <h2>All Students ({total})</h2>
        </div>
        <div className="asp-actions">
          <input
            className="asp-driver-input"
            placeholder="Driver Name"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            title="Driver Name for PDF"
          />
          <button onClick={() => exportData('csv')} className="asp-export"><FiDownload /> CSV</button>
          <button onClick={() => exportData('pdf')} className="asp-export"><FiDownload /> PDF</button>
        </div>
      </header>

      {/* Dashboard Blocks - Note: these stats are now for the *filtered* set */}
      <section className="asp-stats four">
        <DashboardBlock title="Filtered Students" active={college==='All'} onClick={() => setCollege('All')}
          total={statsAll.total} paid={statsAll.paid} notPaid={statsAll.notPaid} />
        <DashboardBlock title="DYPCET" active={college==='DYPCET'} onClick={() => setCollege('DYPCET')}
          total={byCollege.DYPCET.total} paid={byCollege.DYPCET.paid} notPaid={byCollege.DYPCET.notPaid} />
        <DashboardBlock title="DYPSEM" active={college==='DYPSEM'} onClick={() => setCollege('DYPSEM')}
          total={byCollege.DYPSEM.total} paid={byCollege.DYPSEM.paid} notPaid={byCollege.DYPSEM.notPaid} />
        <DashboardBlock title="Diploma" active={college==='Diploma'} onClick={() => setCollege('Diploma')}
          total={byCollege.Diploma.total} paid={byCollege.Diploma.paid} notPaid={byCollege.Diploma.notPaid} />
      </section>

      <section className="asp-controls">
        <select value={college} onChange={(e) => { setCollege(e.target.value); setPage(1); }} className="asp-select">
          {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={feeStatus} onChange={(e) => { setFeeStatus(e.target.value); setPage(1); }} className="asp-select">
          {FEE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="asp-search">
          <FiSearch className="icon" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, department, phone..."
          />
        </div>

        <div className="asp-sort">
          <button onClick={() => setShowSort(!showSort)} className="asp-sort-btn">
            <FiFilter /> Sort by {Object.keys(SORTS).find(key => SORTS[key] === sortBy)}
          </button>
          {showSort && (
            <div className="asp-sort-menu">
              {Object.entries(SORTS).map(([label, value]) => (
                <button key={value} className={`asp-sort-item ${value === sortBy ? 'active' : ''}`} onClick={() => { setSortBy(value); setShowSort(false); }}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="asp-table">
        <div className="asp-thead">
          <div>Name</div>
          <div>Mobile Number</div>
          <div>Department</div>
          <div>Fee Status</div>
          <div>College</div>
          <div>Route</div>
        </div>
        <div className="asp-tbody">
          {students.map(s => (
            <div key={s._id} className="asp-row">
              <div className="name">{s.name}</div>
              <div>{s.mobileNumber}</div>
              <div>{s.department}</div>
              <div className={s.feeStatus === 'Paid' ? 'paid' : 'not-paid'}>{s.feeStatus}</div>
              <div>{s.college}</div>
              <div>{s.route?.routeName || 'N/A'}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="asp-footer">
        <div className="asp-pagination-info">
          Showing <strong>{(page - 1) * limit + 1}</strong> to <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> results
        </div>
        <div className="asp-pagination-controls">
          <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}><FiChevronLeft /> Prev</button>
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <button onClick={() => handlePageChange(page + 1)} disabled={page >= Math.ceil(total / limit)}>Next <FiChevronRight /></button>
        </div>
      </footer>

      <button className="asp-fab" title="Add Student" onClick={() => setShowModal(true)}>
        <FiPlus />
      </button>

      {showModal && (
        <div className="asp-modal-overlay">
          <div className="asp-modal">
            <h3>Add New Student</h3>
            <form onSubmit={onCreate} className="asp-form-grid">
              <Input label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} />
              <Input label="Mobile Number" value={form.mobileNumber} onChange={v => setForm({ ...form, mobileNumber: v })} />
              <Input label="Department" value={form.department} onChange={v => setForm({ ...form, department: v })} />
              <div className="asp-input">
                <label>Fee Status</label>
                <select value={form.feeStatus} onChange={(e) => setForm({ ...form, feeStatus: e.target.value })}>
                  <option>Not Paid</option>
                  <option>Paid</option>
                </select>
              </div>
              <div className="asp-input">
                <label>College</label>
                <select value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })}>
                  {COLLEGES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="asp-modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardBlock = ({ title, total, paid, notPaid, active, onClick }) => (
  <div className={`asp-stat-card dashboard ${active ? 'active' : ''}`} onClick={onClick} role="button" tabIndex={0}>
    <div className="icon"><FiUsers /></div>
    <div className="info">
      <h4>{title}</h4>
      <p>Total: {total}</p>
      <p>Paid: {paid} | Not Paid: {notPaid}</p>
    </div>
  </div>
);

const Input = ({ label, value, onChange }) => (
  <div className="asp-input">
    <label>{label}</label>
    <input value={value} onChange={(e) => onChange(e.target.value)} required />
  </div>
);

export default AllStudentsScreen;
