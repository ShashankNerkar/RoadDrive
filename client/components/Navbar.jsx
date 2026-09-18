
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin-dashboard';
    if (user.role === 'instructor') return '/instructor-dashboard';
    return '/student-dashboard';
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" id="logo-link">
          <span>RoadDrive</span>
          <span className="logo-badge">Academy</span>
        </Link>

        <div className="nav-links">
          <Link to="/" className="nav-link" id="nav-home">Home</Link>
          <Link to="/courses" className="nav-link" id="nav-courses">Courses</Link>
          <Link to="/instructors" className="nav-link" id="nav-instructors">Instructors</Link>
          {isAuthenticated && (
            <Link to={getDashboardPath()} className="nav-link" id="nav-dashboard" style={{ fontWeight: 600, color: 'var(--primary)' }}>
              Dashboard
            </Link>
          )}
        </div>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <span className="user-badge" id="user-role-badge">
                <strong>{user.name}</strong> <span className="role-tag">{user.role}</span>
              </span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" id="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm" id="login-nav-btn">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm" id="register-nav-btn">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

