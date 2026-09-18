
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import BookingModal from '../components/BookingModal.jsx';

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingInstructor, setBookingInstructor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          api.get('/courses'),
          api.get('/users/instructors'),
        ]);
        if (cRes.data.success) setCourses(cRes.data.courses.slice(0, 3));
        if (iRes.data.success) setInstructors(iRes.data.instructors.slice(0, 3));
      } catch (err) {
        console.error('Home page data load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div id="home-page">

      <section className="hero" id="hero-section">
        <div className="hero-inner">
          <span className="hero-tag">RTO-Accredited Driving Academy &bull; Mumbai, Pune & Nashik</span>
          <h1>Learn to Drive. Master Indian Roads with Confidence.</h1>
          <p>
            RTO-certified instructors, modern dual-control training vehicles, and structured step-by-step
            curriculum designed to help you pass your RTO permanent license test on the very first attempt.
          </p>
          <div className="hero-buttons">
            <Link to="/courses" className="btn btn-hero-primary btn-lg" id="explore-courses-btn">
              Explore Courses
            </Link>
            <Link to="/instructors" className="btn btn-hero-secondary btn-lg" id="meet-instructors-btn">
              Find an Instructor
            </Link>
          </div>
        </div>
      </section>

      <div className="trust-bar">
        <div className="trust-items">
          <div className="trust-item">
            <div className="trust-item-icon">✓</div>
            <div>
              <div className="trust-item-title">RTO Certified Coaches</div>
              <div className="trust-item-desc">Verified & experienced</div>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-item-icon">🛡️</div>
            <div>
              <div className="trust-item-title">Dual-Control Fleet</div>
              <div className="trust-item-desc">Equipped with passenger brakes</div>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-item-icon">📈</div>
            <div>
              <div className="trust-item-title">96% RTO Pass Rate</div>
              <div className="trust-item-desc">Track & traffic mastery</div>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-item-icon">⏱</div>
            <div>
              <div className="trust-item-title">Flexible Morning & Eve</div>
              <div className="trust-item-desc">6:00 AM – 8:00 PM slots</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">

        <section className="section" id="why-choose-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Why Choose RoadDrive</h2>
              <p className="section-subtitle">
                A modern, structured approach to driver education focused on safety, confidence, and real-world road awareness.
              </p>
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>Patient, Certified Coaches</h3>
              <p>
                Our instructors specialize in nervous beginners, test preparation, and advanced motorway driving with calm, supportive guidance.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚗</div>
              <h3>Dual-Control Modern Cars</h3>
              <p>
                Train in regularly serviced dual-control vehicles equipped with modern safety features, clear visibility, and smooth handling.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📋</div>
              <h3>Structured Practical Syllabus</h3>
              <p>
                Follow a step-by-step curriculum from basic vehicle controls to complex roundabouts, parallel parking, and test mock trials.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📅</div>
              <h3>Flexible 1-on-1 Booking</h3>
              <p>
                Browse instructor availability slots, reserve sessions online, and receive instant confirmation with notes on focus areas.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="courses-preview-section" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Available Driving Courses</h2>
              <p className="section-subtitle">
                Select the training package that aligns with your experience and road test goals.
              </p>
            </div>
            <Link to="/courses" className="btn btn-secondary btn-sm" id="view-all-courses-link">
              View All Courses &rarr;
            </Link>
          </div>

          <div className="cards-grid">
            {courses.map((course) => (
              <div key={course._id} className="course-card" id={`course-card-${course._id}`}>
                <img
                  src={course.thumbnail || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80'}
                  alt={course.name}
                  className="course-image"
                />
                <div className="course-body">
                  <div className="course-meta">
                    <span className={`badge badge-${course.level.toLowerCase()}`}>{course.level}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>⏱ {course.duration}</span>
                  </div>
                  <h3 className="course-title">{course.name}</h3>
                  <p className="course-desc">{course.description}</p>
                  <div className="course-footer">
                    <div className="course-price-wrap">
                      <span className="course-price-label">Tuition</span>
                      <span className="course-price">{course.price === 0 ? 'Free' : `₹${course.price}`}</span>
                    </div>
                    <Link to={`/courses/${course._id}`} className="btn btn-primary btn-sm">
                      View Syllabus
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="how-it-works-section" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="section-header" style={{ marginBottom: 28 }}>
            <div>
              <h2 className="section-title">How RoadDrive Works</h2>
              <p className="section-subtitle">A straightforward 3-step path to obtaining your driver's license.</p>
            </div>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-num-badge">01</div>
              <h3>Enroll in a Course</h3>
              <p>
                Sign up, choose the course level that matches your experience, and access structured theory checklist modules.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-badge">02</div>
              <h3>Book In-Car Practice</h3>
              <p>
                Choose an accredited instructor and book 1-on-1 practical driving sessions around your work or school schedule.
              </p>
            </div>

            <div className="step-card">
              <div className="step-num-badge">03</div>
              <h3>Pass Your RTO Test</h3>
              <p>
                Master 8-track maneuvers, gradient restarts, and reverse parking with mock RTO track trials.
              </p>
            </div>
          </div>
        </section>

        <section className="section" id="instructors-preview-section" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Meet Our Certified Instructors</h2>
              <p className="section-subtitle">
                Experienced, licensed driving coaches dedicated to patient behind-the-wheel instruction.
              </p>
            </div>
            <Link to="/instructors" className="btn btn-secondary btn-sm" id="view-all-instructors-link">
              View All Instructors &rarr;
            </Link>
          </div>

          <div className="cards-grid">
            {instructors.map((inst) => (
              <div key={inst._id} className="instructor-card" id={`instructor-card-${inst._id}`}>
                <div className="instructor-header">
                  <div className="instructor-avatar">
                    {inst.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="instructor-name">{inst.name}</h3>
                    <p className="instructor-role">RTO Certified &bull; {inst.location || 'Maharashtra'}</p>
                  </div>
                </div>

                <div className="instructor-stats">
                  <div className="stat-item">
                    <div className="stat-value">{inst.experienceYears || 3} yrs</div>
                    <div className="stat-label">Experience</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">₹{inst.hourlyRate || 5}/hr</div>
                    <div className="stat-label">Rate</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">★ 4.9</div>
                    <div className="stat-label">Rating</div>
                  </div>
                </div>

                <p className="instructor-bio">{inst.bio || 'Patient and dedicated driving coach with high first-time pass rates.'}</p>

                <div style={{ marginTop: 'auto', display: 'flex', gap: 10 }}>
                  {isAuthenticated && user.role === 'student' ? (
                    <button
                      onClick={() => setBookingInstructor(inst)}
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%' }}
                    >
                      Book Session
                    </button>
                  ) : (
                    <Link to="/login" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                      Login to Book
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section" id="home-cta-section">
          <div className="cta-banner">
            <h2>Ready to Get Behind the Wheel?</h2>
            <p>
              Join hundreds of student drivers who passed their road test with RoadDrive. Enroll in a course or book your first in-car session today.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-cta-primary btn-lg">
                Create Free Student Account
              </Link>
              <Link to="/courses" className="btn btn-hero-secondary btn-lg">
                Explore Curriculum
              </Link>
            </div>
          </div>
        </section>
      </div>

      {bookingInstructor && (
        <BookingModal
          instructor={bookingInstructor}
          onClose={() => setBookingInstructor(null)}
        />
      )}
    </div>
  );
}

