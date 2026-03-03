import { useState, useEffect } from 'react';
import { CalendarCheck, UserCheck, UserX, Filter, Calendar, User } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { employeeApi, attendanceApi } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import './Attendance.css';

function Attendance() {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
  });

  // Mark attendance form
  const [markForm, setMarkForm] = useState({
    employee_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'Present',
  });
  const [formErrors, setFormErrors] = useState({});

  // Attendance summary
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [empData, attData] = await Promise.all([
        employeeApi.getAll(),
        attendanceApi.getAll(),
      ]);
      setEmployees(empData.employees || []);
      setAttendance(attData.records || []);

      // Fetch summaries for all employees
      const summaryPromises = (empData.employees || []).map(async (emp) => {
        try {
          const summary = await attendanceApi.getSummary(emp.employee_id);
          return { [emp.employee_id]: summary };
        } catch {
          return { [emp.employee_id]: null };
        }
      });
      
      const summaryResults = await Promise.all(summaryPromises);
      const summaryMap = summaryResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setSummaries(summaryMap);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const params = {};
      if (filters.employee_id) params.employee_id = filters.employee_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const data = await attendanceApi.getAll(params);
      setAttendance(data.records || []);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    if (!loading) {
      fetchAttendance();
    }
  }, [filters]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const validateMarkForm = () => {
    const errors = {};
    
    if (!markForm.employee_id) {
      errors.employee_id = 'Please select an employee';
    }
    
    if (!markForm.date) {
      errors.date = 'Please select a date';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    
    if (!validateMarkForm()) return;

    try {
      setSubmitting(true);
      await attendanceApi.mark(markForm);
      showToast('Attendance marked successfully');
      setShowMarkModal(false);
      fetchAttendance();
      
      // Refresh summary for this employee
      const summary = await attendanceApi.getSummary(markForm.employee_id);
      setSummaries((prev) => ({ ...prev, [markForm.employee_id]: summary }));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      employee_id: '',
      start_date: '',
      end_date: '',
    });
  };

  const hasActiveFilters = filters.employee_id || filters.start_date || filters.end_date;

  if (loading) {
    return <LoadingSpinner size="large" message="Loading attendance..." />;
  }

  return (
    <div className="page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-description">Track and manage employee attendance</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setMarkForm({
              employee_id: '',
              date: format(new Date(), 'yyyy-MM-dd'),
              status: 'Present',
            });
            setFormErrors({});
            setShowMarkModal(true);
          }}
          disabled={employees.length === 0}
        >
          <CalendarCheck size={18} />
          Mark Attendance
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={User}
            title="No employees found"
            description="You need to add employees before you can mark attendance."
            action={
              <a href="/employees" className="btn btn-primary">
                Add Employees
              </a>
            }
          />
        </div>
      ) : (
        <>
          {/* Employee Summary Cards */}
          <div className="summary-section mb-lg">
            <h3 className="mb-md">Employee Attendance Summary</h3>
            <div className="summary-grid">
              {employees.map((emp) => {
                const summary = summaries[emp.employee_id];
                return (
                  <div key={emp.employee_id} className="summary-card">
                    <div className="summary-card-header">
                      <div className="summary-avatar">
                        {emp.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="summary-info">
                        <span className="summary-name">{emp.full_name}</span>
                        <span className="summary-id">{emp.employee_id}</span>
                      </div>
                    </div>
                    <div className="summary-stats">
                      <div className="summary-stat">
                        <UserCheck size={16} className="text-success" />
                        <span className="stat-value">{summary?.total_present || 0}</span>
                        <span className="stat-label">Present</span>
                      </div>
                      <div className="summary-stat">
                        <UserX size={16} className="text-error" />
                        <span className="stat-value">{summary?.total_absent || 0}</span>
                        <span className="stat-label">Absent</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section card mb-lg">
            <div className="card-body">
              <div className="filters-header">
                <div className="flex items-center gap-sm">
                  <Filter size={18} className="text-muted" />
                  <span className="font-medium">Filter Records</span>
                </div>
                {hasActiveFilters && (
                  <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
              <div className="filters-grid">
                <div className="form-group">
                  <label htmlFor="filter-employee">Employee</label>
                  <select
                    id="filter-employee"
                    value={filters.employee_id}
                    onChange={(e) =>
                      setFilters({ ...filters, employee_id: e.target.value })
                    }
                  >
                    <option value="">All Employees</option>
                    {employees.map((emp) => (
                      <option key={emp.employee_id} value={emp.employee_id}>
                        {emp.full_name} ({emp.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="filter-start">From Date</label>
                  <input
                    type="date"
                    id="filter-start"
                    value={filters.start_date}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="filter-end">To Date</label>
                  <input
                    type="date"
                    id="filter-end"
                    value={filters.end_date}
                    onChange={(e) =>
                      setFilters({ ...filters, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Records Table */}
          {attendance.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={CalendarCheck}
                title={hasActiveFilters ? 'No matching records' : 'No attendance records'}
                description={
                  hasActiveFilters
                    ? 'No attendance records match your filters. Try adjusting your search criteria.'
                    : 'Start tracking attendance by marking attendance for your employees.'
                }
                action={
                  hasActiveFilters ? (
                    <button className="btn btn-secondary" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowMarkModal(true)}
                    >
                      <CalendarCheck size={18} />
                      Mark Attendance
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <div className="card">
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Employee ID</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id}>
                        <td>
                          <div className="flex items-center gap-sm">
                            <Calendar size={14} className="text-muted" />
                            {format(parseISO(record.date), 'MMM dd, yyyy')}
                          </div>
                        </td>
                        <td>
                          <div className="employee-name">
                            <div className="employee-avatar">
                              {record.employee_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span>{record.employee_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-gray">{record.employee_id}</span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              record.status === 'Present'
                                ? 'badge-success'
                                : 'badge-error'
                            }`}
                          >
                            {record.status === 'Present' ? (
                              <UserCheck size={12} />
                            ) : (
                              <UserX size={12} />
                            )}
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-footer text-muted text-sm">
                Showing {attendance.length} records
              </div>
            </div>
          )}
        </>
      )}

      {/* Mark Attendance Modal */}
      <Modal
        isOpen={showMarkModal}
        onClose={() => setShowMarkModal(false)}
        title="Mark Attendance"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowMarkModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleMarkAttendance}
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Mark Attendance'}
            </button>
          </>
        }
      >
        <form onSubmit={handleMarkAttendance}>
          <div className="form-group">
            <label htmlFor="mark-employee">Employee *</label>
            <select
              id="mark-employee"
              value={markForm.employee_id}
              onChange={(e) =>
                setMarkForm({ ...markForm, employee_id: e.target.value })
              }
            >
              <option value="">Select an employee</option>
              {employees.map((emp) => (
                <option key={emp.employee_id} value={emp.employee_id}>
                  {emp.full_name} ({emp.employee_id})
                </option>
              ))}
            </select>
            {formErrors.employee_id && (
              <span className="form-error">{formErrors.employee_id}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="mark-date">Date *</label>
            <input
              type="date"
              id="mark-date"
              value={markForm.date}
              onChange={(e) =>
                setMarkForm({ ...markForm, date: e.target.value })
              }
            />
            {formErrors.date && (
              <span className="form-error">{formErrors.date}</span>
            )}
          </div>

          <div className="form-group">
            <label>Status *</label>
            <div className="status-options">
              <label className={`status-option ${markForm.status === 'Present' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="status"
                  value="Present"
                  checked={markForm.status === 'Present'}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, status: e.target.value })
                  }
                />
                <UserCheck size={18} />
                <span>Present</span>
              </label>
              <label className={`status-option ${markForm.status === 'Absent' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="status"
                  value="Absent"
                  checked={markForm.status === 'Absent'}
                  onChange={(e) =>
                    setMarkForm({ ...markForm, status: e.target.value })
                  }
                />
                <UserX size={18} />
                <span>Absent</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Attendance;
