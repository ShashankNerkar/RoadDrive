
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/courses');
        if (res.data.success) {
          setCourses(res.data.courses);
        }
      } catch (err) {
        console.error('Failed to fetch courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = selectedLevel === 'All'
    ? courses
    : courses.filter((c) => c.level.toLowerCase() === selectedLevel.toLowerCase());

  return (
    <div className="container" style={{ padding: '40px 20px' }} id="courses-page">
      <div className="section-header">
        <div>
          <h1 className="section-title">Driving School Courses</h1>
          <p className="section-subtitle">
            Structured step-by-step training for novice drivers, test preparations, and highway confidence.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`btn btn-sm ${selectedLevel === level ? 'btn-primary' : 'btn-secondary'}`}
              id={`filter-level-${level.toLowerCase()}`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading courses catalog...
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          No courses found matching the selected filter.
        </div>
      ) : (
        <div className="cards-grid">
          {filteredCourses.map((course) => (
            <div key={course._id} className="course-card" id={`course-${course._id}`}>
              <img
                src={course.thumbnail || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80'}
                alt={course.name}
                className="course-image"
              />
              <div className="course-body">
                <div className="course-meta">
                  <span className={`badge badge-${course.level.toLowerCase()}`}>{course.level}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{course.duration}</span>
                </div>
                <h3 className="course-title">{course.name}</h3>
                <p className="course-desc">{course.description}</p>
                <div className="course-footer">
                  <div className="course-price-wrap">
                    <span className="course-price-label">Tuition</span>
                    <span className="course-price" style={{ color: course.price === 0 ? '#166534' : 'inherit' }}>
                      {course.price === 0 ? 'Free' : `₹${course.price}`}
                    </span>
                  </div>
                  <Link to={`/courses/${course._id}`} className="btn btn-primary btn-sm" id={`view-course-${course._id}`}>
                    {course.price === 0 ? 'View & Enroll Free' : 'View Details & Pay'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

