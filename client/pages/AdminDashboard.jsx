
import React, { useEffect, useState } from 'react';
import api from '../api/axios.js';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('courses');
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState({
    name: '',
    description: '',
    price: '',
    duration: '4 Weeks',
    level: 'Beginner',
    thumbnail: '',
  });

  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    course: '',
    order: 1,
  });

  const fetchData = async () => {
    try {
      const [statsRes, coursesRes, studentsRes, instRes, bookingsRes] = await Promise.all([
        api.get('/users/admin/stats'),
        api.get('/courses'),
        api.get('/users/students'),
        api.get('/users/instructors'),
        api.get('/bookings'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (coursesRes.data.success) {
        setCourses(coursesRes.data.courses);
        if (coursesRes.data.courses.length > 0 && !lessonForm.course) {
          setLessonForm((prev) => ({ ...prev, course: coursesRes.data.courses[0]._id }));
        }
      }
      if (studentsRes.data.success) setStudents(studentsRes.data.students);
      if (instRes.data.success) setInstructors(instRes.data.instructors);
      if (bookingsRes.data.success) setBookings(bookingsRes.data.bookings);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateCourse = () => {
    setEditingCourseId(null);
    setCourseForm({
      name: '',
      description: '',
      price: '',
      duration: '4 Weeks',
      level: 'Beginner',
      thumbnail: '',
    });
    setShowCourseModal(true);
  };

  const handleOpenEditCourse = (course) => {
    setEditingCourseId(course._id);
    setCourseForm({
      name: course.name,
      description: course.description,
      price: course.price,
      duration: course.duration,
      level: course.level || 'Beginner',
      thumbnail: course.thumbnail || '',
    });
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        const res = await api.put(`/courses/${editingCourseId}`, courseForm);
        if (res.data.success) {
          setShowCourseModal(false);
          setEditingCourseId(null);
          await fetchData();
        }
      } else {
        const res = await api.post('/courses', courseForm);
        if (res.data.success) {
          setShowCourseModal(false);
          setCourseForm({
            name: '',
            description: '',
            price: '',
            duration: '4 Weeks',
            level: 'Beginner',
            thumbnail: '',
          });
          await fetchData();
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure? This will delete the course and all its lessons.')) return;
    try {
      const res = await api.delete(`/courses/${courseId}`);
      if (res.data.success) await fetchData();
    } catch (err) {
      alert('Failed to delete course');
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/lessons', lessonForm);
      if (res.data.success) {
        alert('Lesson added successfully!');
        setLessonForm((prev) => ({
          ...prev,
          title: '',
          description: '',
          order: Number(prev.order) + 1,
        }));
        await fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create lesson');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await api.delete(`/users/${userId}`);
      if (res.data.success) await fetchData();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="container dashboard-container" id="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Operations Portal &bull; Shashank Nerkar</h1>
        <p className="dashboard-subtitle">
          RTO-accredited driving operations across Mumbai, Pune, and Nashik &bull; shashanknerkar21@gmail.com
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-box-title">Total Students</div>
          <div className="stat-box-number">{stats?.totalStudents || students.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Instructors</div>
          <div className="stat-box-number">{stats?.totalInstructors || instructors.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Courses</div>
          <div className="stat-box-number">{stats?.totalCourses || courses.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Total Bookings</div>
          <div className="stat-box-number">{stats?.totalBookings || bookings.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Pending Sessions</div>
          <div className="stat-box-number" style={{ color: 'var(--accent)' }}>
            {stats?.pendingBookings || bookings.filter((b) => b.status === 'pending').length}
          </div>
        </div>
      </div>

      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
          id="tab-admin-courses"
        >
          Manage Courses ({courses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'lessons' ? 'active' : ''}`}
          onClick={() => setActiveTab('lessons')}
          id="tab-admin-lessons"
        >
          Add Lessons
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          id="tab-admin-users"
        >
          Students & Instructors ({students.length + instructors.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
          id="tab-admin-bookings"
        >
          All Driving Bookings ({bookings.length})
        </button>
      </div>

      {activeTab === 'courses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Curriculum Courses</h3>
            <button
              onClick={handleOpenCreateCourse}
              className="btn btn-primary btn-sm"
              id="add-new-course-btn"
            >
              + Create New Course
            </button>
          </div>

          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>No driving courses in the curriculum yet.</p>
              <button onClick={handleOpenCreateCourse} className="btn btn-primary btn-sm">
                Create First Course
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Level</th>
                    <th>Duration</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course._id}>
                      <td>
                        <strong>{course.name}</strong>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {course.description?.substring(0, 75)}...
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${course.level.toLowerCase()}`}>{course.level}</span>
                      </td>
                      <td>{course.duration}</td>
                      <td>
                        <strong>₹{course.price}</strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleOpenEditCourse(course)}
                            className="btn btn-secondary btn-sm"
                            id={`edit-course-${course._id}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCourse(course._id)}
                            className="btn btn-danger btn-sm"
                            id={`delete-course-${course._id}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'lessons' && (
        <div style={{ maxWidth: 600, backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Add Lesson to a Course</h3>
          {courses.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>Please create a course first before adding lessons.</p>
          ) : (
            <form onSubmit={handleCreateLesson}>
              <div className="form-group">
                <label className="form-label">Select Course</label>
                <select
                  className="form-select"
                  value={lessonForm.course}
                  onChange={(e) => setLessonForm({ ...lessonForm, course: e.target.value })}
                  required
                  id="select-lesson-course"
                >
                  {courses.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.level})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Lesson Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  required
                  placeholder="e.g., Roundabout Rules & Exit Signals"
                  id="lesson-title-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lesson Order (Sequence Number)</label>
                <input
                  type="number"
                  className="form-input"
                  value={lessonForm.order}
                  onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                  min={1}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Lesson Content / Instructions</label>
                <textarea
                  className="form-textarea"
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Key road safety, mirror routines, and driving techniques covered..."
                  rows={4}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} id="submit-lesson-btn">
                Publish Lesson to Course
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Instructors ({instructors.length})</h3>
            {instructors.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No instructors registered yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Instructor Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Experience</th>
                      <th>Rate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {instructors.map((inst) => (
                      <tr key={inst._id}>
                        <td><strong>{inst.name}</strong></td>
                        <td>{inst.email}</td>
                        <td>{inst.phone || '—'}</td>
                        <td>{inst.experienceYears || 3} yrs</td>
                        <td>₹{inst.hourlyRate || 5}/hr</td>
                        <td>
                          <button
                            onClick={() => handleDeleteUser(inst._id)}
                            className="btn btn-danger btn-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Students ({students.length})</h3>
            {students.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No students registered yet.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Enrolled Courses</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stud) => (
                      <tr key={stud._id}>
                        <td><strong>{stud.name}</strong></td>
                        <td>{stud.email}</td>
                        <td>{stud.phone || '—'}</td>
                        <td>{stud.enrolledCourses?.length || 0}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteUser(stud._id)}
                            className="btn btn-danger btn-sm"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            All Driving Sessions Across School ({bookings.length})
          </h3>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No driving sessions booked across the academy yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Instructor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td><strong>{b.student?.name || b.studentObj?.name || 'Student'}</strong></td>
                      <td>{b.instructor?.name || b.instructorObj?.name || 'Instructor'}</td>
                      <td>{b.date}</td>
                      <td>{b.time}</td>
                      <td>
                        <span className={`badge badge-${b.status}`}>{b.status.toUpperCase()}</span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{b.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCourseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCourseId ? 'Edit Driving Course' : 'Create Driving Course'}
              </h3>
              <button className="modal-close" onClick={() => setShowCourseModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSaveCourse}>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                  required
                  placeholder="e.g., Automatic to Manual Gear Shift Mastery"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Tuition Price (₹ INR)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })}
                    required
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input
                    type="text"
                    className="form-input"
                    value={courseForm.duration}
                    onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
                    required
                    placeholder="e.g., 3 Weeks (15 Hours)"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Curriculum Level</label>
                <select
                  className="form-select"
                  value={courseForm.level}
                  onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourseId ? 'Save Changes' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

