import { useState, useEffect } from 'react';
import { Users, Building2, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { dashboardApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardApi.getSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" message="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <h3>Failed to load dashboard</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboard}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Employees',
      value: summary?.total_employees || 0,
      icon: Users,
      color: 'primary',
    },
    {
      label: 'Departments',
      value: summary?.total_departments || 0,
      icon: Building2,
      color: 'purple',
    },
    {
      label: 'Present Today',
      value: summary?.today_present || 0,
      icon: UserCheck,
      color: 'success',
    },
    {
      label: 'Absent Today',
      value: summary?.today_absent || 0,
      icon: UserX,
      color: 'error',
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Welcome to HRMS Lite - Your Human Resource Management System</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-card-icon stat-icon-${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-value">{stat.value}</div>
            <div className="stat-card-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {summary?.departments && summary.departments.length > 0 && (
        <div className="card mt-lg">
          <div className="card-header">
            <div className="flex items-center gap-sm">
              <TrendingUp size={20} className="text-muted" />
              <h3>Employees by Department</h3>
            </div>
          </div>
          <div className="card-body">
            <div className="department-list">
              {summary.departments.map((dept) => (
                <div key={dept.name} className="department-item">
                  <div className="department-info">
                    <span className="department-name">{dept.name}</span>
                    <span className="department-count">{dept.count} employees</span>
                  </div>
                  <div className="department-bar">
                    <div
                      className="department-bar-fill"
                      style={{
                        width: `${(dept.count / summary.total_employees) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="quick-actions mt-lg">
        <h3 className="mb-md">Quick Actions</h3>
        <div className="quick-actions-grid">
          <a href="/employees" className="quick-action-card">
            <Users size={24} />
            <span>Manage Employees</span>
          </a>
          <a href="/attendance" className="quick-action-card">
            <UserCheck size={24} />
            <span>Mark Attendance</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
