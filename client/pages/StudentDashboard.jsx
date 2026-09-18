
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import ReviewModal from '../components/ReviewModal.jsx';

export default function StudentDashboard() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [allCourses, setAllCourses] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewingInstructor, setReviewingInstructor] = useState(null);

  const fetchData = async () => {
    try {
      const [coursesRes, bookingsRes] = await Promise.all([
        api.get('/courses'),
        api.get('/bookings/my'),
      ]);
      if (coursesRes.data.success) setAllCourses(coursesRes.data.courses);
      if (bookingsRes.data.success) setBookings(bookingsRes.data.bookings);
    } catch (err) {
      console.error('Failed to load student dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enrolledList = user?.enrolledCourses || [];

  const handleToggleLesson = async (courseId, lessonId) => {
    try {
      const res = await api.post(`/courses/${courseId}/lessons/${lessonId}/toggle`);
      if (res.data.success) {
        await refreshUser();
      }
    } catch (err) {
      console.error('Failed to toggle lesson:', err);
    }
  };

  return (
    <div className="container dashboard-container" id="student-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Student Portal: Welcome, {user?.name}</h1>
        <p className="dashboard-subtitle">
          Manage your enrolled courses, monitor your module progress, and track scheduled driving practice.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-box-title">Enrolled Courses</div>
          <div className="stat-box-number">{enrolledList.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Driving Sessions</div>
          <div className="stat-box-number">{bookings.length}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Completed Sessions</div>
          <div className="stat-box-number">
            {bookings.filter((b) => b.status === 'completed').length}
          </div>
        </div>
      </div>

      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
          id="tab-student-courses"
        >
          My Courses & Lesson Progress ({enrolledList.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
          id="tab-student-bookings"
        >
          My Driving Bookings ({bookings.length})
        </button>
      </div>

      {activeTab === 'courses' && (
        <div>
          {enrolledList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>You haven't enrolled in any courses yet</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                Browse our curriculum to start learning road theory and practical fundamentals.
              </p>
              <Link to="/courses" className="btn btn-primary">
                Browse Courses Catalog
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {enrolledList.map((enrollment, idx) => {
                const courseId = typeof enrollment.course === 'object' ? enrollment.course?._id : enrollment.course;
                const matchedCourse = allCourses.find((c) => c._id === courseId);
                const completed = enrollment.completedLessons || [];

                return (
                  <EnrolledCourseCard
                    key={idx}
                    courseId={courseId}
                    course={matchedCourse}
                    completedLessonIds={completed}
                    paymentStatus={enrollment.paymentStatus}
                    paymentId={enrollment.paymentId}
                    onToggleLesson={handleToggleLesson}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>Behind-The-Wheel Scheduled Sessions</h3>
            <Link to="/instructors" className="btn btn-primary btn-sm">
              + Book New Driving Session
            </Link>
          </div>

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                You have no scheduled driving sessions yet.
              </p>
              <Link to="/instructors" className="btn btn-primary btn-sm">
                Find an Instructor & Book
              </Link>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Instructor</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const instName = b.instructor?.name || b.instructorObj?.name || 'Instructor';
                    const instId = b.instructor?._id || b.instructorObj?._id || b.instructor;
                    return (
                      <tr key={b._id}>
                        <td>
                          <strong>{instName}</strong>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {b.instructor?.phone || b.instructorObj?.phone || ''}
                          </div>
                        </td>
                        <td>{b.date}</td>
                        <td>{b.time}</td>
                        <td>
                          <span className={`badge badge-${b.status}`}>
                            {b.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ maxWidth: 200, fontSize: 13, color: 'var(--text-muted)' }}>
                          {b.notes || '—'}
                        </td>
                        <td>
                          <button
                            onClick={() => setReviewingInstructor({ _id: instId, name: instName })}
                            className="btn btn-secondary btn-sm"
                            id={`review-inst-${b._id}`}
                          >
                            Leave Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reviewingInstructor && (
        <ReviewModal
          instructor={reviewingInstructor}
          onClose={() => setReviewingInstructor(null)}
          onReviewSuccess={() => {
            alert('Review submitted successfully!');
          }}
        />
      )}
    </div>
  );
}

function EnrolledCourseCard({ courseId, course, completedLessonIds, paymentStatus, paymentId, onToggleLesson }) {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const res = await api.get(`/lessons/course/${courseId}`);
        if (res.data.success) {
          setLessons(res.data.lessons);
        }
      } catch (err) {
        console.error('Failed to load lessons for course:', err);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchLessons();
  }, [courseId]);

  const completedCount = lessons.filter((l) => completedLessonIds.includes(l._id)).length;
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span className={`badge badge-${course?.level?.toLowerCase() || 'beginner'}`}>
              {course?.level || 'Beginner'}
            </span>
            {paymentStatus === 'paid' ? (
              <span className="badge badge-completed" style={{ fontSize: 11, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                Paid via Razorpay {paymentId && paymentId !== 'FREE_DIRECT' ? `(${paymentId.substring(0, 10)}...)` : ''}
              </span>
            ) : (
              <span className="badge" style={{ fontSize: 11, background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' }}>
                Free Enrollment
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700 }}>{course?.name || 'Course Curriculum'}</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{course?.duration || ''}</p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Course Completion</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: progressPercent === 100 ? 'var(--success)' : 'var(--primary)' }}>
            {progressPercent}% ({completedCount}/{lessons.length} Modules)
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: progressPercent === 100 ? 'var(--success)' : 'var(--primary)', transition: 'width 0.3s ease' }} />
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Lessons Checklist (Check as you complete):</h4>

        {loading ? (
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>No lessons added yet.</p>
        ) : (
          <div>
            {lessons.map((lesson) => {
              const isDone = completedLessonIds.includes(lesson._id);
              return (
                <div key={lesson._id} className="lesson-item">
                  <div className="lesson-left">
                    <input
                      type="checkbox"
                      className="lesson-checkbox"
                      checked={isDone}
                      onChange={() => onToggleLesson(courseId, lesson._id)}
                      id={`check-lesson-${lesson._id}`}
                    />
                    <div>
                      <span className={`lesson-title ${isDone ? 'lesson-completed' : ''}`}>
                        {lesson.order}. {lesson.title}
                      </span>
                      {lesson.description && (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                          {lesson.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

