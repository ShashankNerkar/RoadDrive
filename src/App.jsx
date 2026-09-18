import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../client/context/AuthContext.jsx';
import Navbar from '../client/components/Navbar.jsx';
import ProtectedRoute from '../client/components/ProtectedRoute.jsx';

import Home from '../client/pages/Home.jsx';
import Courses from '../client/pages/Courses.jsx';
import CourseDetails from '../client/pages/CourseDetails.jsx';
import Instructors from '../client/pages/Instructors.jsx';
import Login from '../client/pages/Login.jsx';
import Register from '../client/pages/Register.jsx';
import ForgotPassword from '../client/pages/ForgotPassword.jsx';
import ResetPassword from '../client/pages/ResetPassword.jsx';
import StudentDashboard from '../client/pages/StudentDashboard.jsx';
import InstructorDashboard from '../client/pages/InstructorDashboard.jsx';
import AdminDashboard from '../client/pages/AdminDashboard.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
              <Route path="/instructors" element={<Instructors />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route
                path="/student-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/instructor-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['instructor']}>
                    <InstructorDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <footer className="footer">
            <div className="container">
              <div className="footer-top">
                <div className="footer-brand">
                  <h4>RoadDrive Driving Academy</h4>
                  <p>
                    RTO-accredited driving school operating across Mumbai, Pune, and Nashik. Providing professional dual-control car training, theory preparation, and 100% RTO test track clearance support.
                  </p>
                </div>
                <div className="footer-links">
                  <a href="/">Home</a>
                  <a href="/courses">Courses & Fees</a>
                  <a href="/instructors">RTO Instructors</a>
                  <a href="/login">Portal Login</a>
                </div>
              </div>
              <div className="footer-bottom">
                <span>&copy; {new Date().getFullYear()} RoadDrive Driving Academy. Admin: Shashank Nerkar (shashanknerkar21@gmail.com).</span>
                <span>RTO Maharashtra &bull; Mumbai &bull; Pune &bull; Nashik &bull; Razorpay & SMTP Integrated</span>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

