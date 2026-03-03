import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Search, Mail, Building2 } from 'lucide-react';
import { employeeApi } from '../services/api';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import './Employees.css';

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    employee_id: '',
    full_name: '',
    email: '',
    department: '',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeApi.getAll();
      setEmployees(data.employees || []);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.employee_id.trim()) {
      errors.employee_id = 'Employee ID is required';
    }
    
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.department.trim()) {
      errors.department = 'Department is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      await employeeApi.create(formData);
      showToast('Employee added successfully');
      setShowAddModal(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      setSubmitting(true);
      await employeeApi.delete(selectedEmployee.employee_id);
      showToast('Employee deleted successfully');
      setShowDeleteModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      full_name: '',
      email: '',
      department: '',
    });
    setFormErrors({});
  };

  const openDeleteModal = (employee) => {
    setSelectedEmployee(employee);
    setShowDeleteModal(true);
  };

  const filteredEmployees = employees.filter((emp) => {
    const search = searchTerm.toLowerCase();
    return (
      emp.employee_id.toLowerCase().includes(search) ||
      emp.full_name.toLowerCase().includes(search) ||
      emp.email.toLowerCase().includes(search) ||
      emp.department.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <LoadingSpinner size="large" message="Loading employees..." />;
  }

  return (
    <div className="page">
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-description">Manage your organization's employees</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {employees.length > 0 && (
        <div className="search-bar mb-lg">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, ID, email, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {employees.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No employees yet"
            description="Get started by adding your first employee to the system."
            action={
              <button
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <Plus size={18} />
                Add Employee
              </button>
            }
          />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Search}
            title="No results found"
            description={`No employees match "${searchTerm}". Try a different search term.`}
            action={
              <button
                className="btn btn-secondary"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            }
          />
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.employee_id}>
                    <td>
                      <span className="badge badge-primary">{employee.employee_id}</span>
                    </td>
                    <td>
                      <div className="employee-name">
                        <div className="employee-avatar">
                          {employee.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span>{employee.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-sm text-muted">
                        <Mail size={14} />
                        {employee.email}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-sm">
                        <Building2 size={14} className="text-muted" />
                        {employee.department}
                      </div>
                    </td>
                    <td className="text-right">
                      <button
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => openDeleteModal(employee)}
                        title="Delete employee"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer text-muted text-sm">
            Showing {filteredEmployees.length} of {employees.length} employees
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowAddModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddEmployee}
              disabled={submitting}
            >
              {submitting ? 'Adding...' : 'Add Employee'}
            </button>
          </>
        }
      >
        <form onSubmit={handleAddEmployee}>
          <div className="form-group">
            <label htmlFor="employee_id">Employee ID *</label>
            <input
              type="text"
              id="employee_id"
              placeholder="e.g., EMP001"
              value={formData.employee_id}
              onChange={(e) =>
                setFormData({ ...formData, employee_id: e.target.value })
              }
            />
            {formErrors.employee_id && (
              <span className="form-error">{formErrors.employee_id}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="full_name">Full Name *</label>
            <input
              type="text"
              id="full_name"
              placeholder="e.g., John Doe"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
            />
            {formErrors.full_name && (
              <span className="form-error">{formErrors.full_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              placeholder="e.g., john.doe@company.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            {formErrors.email && (
              <span className="form-error">{formErrors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="department">Department *</label>
            <input
              type="text"
              id="department"
              placeholder="e.g., Engineering"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
            />
            {formErrors.department && (
              <span className="form-error">{formErrors.department}</span>
            )}
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Employee"
        footer={
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setShowDeleteModal(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteEmployee}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>{selectedEmployee?.full_name}</strong>? This will also remove
          all their attendance records. This action cannot be undone.
        </p>
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

export default Employees;
