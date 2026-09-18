// client/pages/Instructors.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import BookingModal from '../components/BookingModal.jsx';

export default function Instructors() {
  const { isAuthenticated, user } = useAuth();
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [reviewsModalInstructor, setReviewsModalInstructor] = useState(null);
  const [instructorReviews, setInstructorReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const fetchInstructors = async () => {
    try {
      const res = await api.get('/users/instructors');
      if (res.data.success) {
        setInstructors(res.data.instructors);
      }
    } catch (err) {
      console.error('Failed to load instructors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const openReviews = async (inst) => {
    setReviewsModalInstructor(inst);
    setLoadingReviews(true);
    try {
      const res = await api.get(`/reviews/instructor/${inst._id}`);
      if (res.data.success) {
        setInstructorReviews(res.data.reviews);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px' }} id="instructors-page">
      <div className="section-header">
        <div>
          <h1 className="section-title">Driving Instructors</h1>
          <p className="section-subtitle">
            Book professional, one-on-one behind-the-wheel instruction with certified tutors.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          Loading instructors...
        </div>
      ) : (
        <div className="cards-grid">
          {instructors.map((inst) => {
            const openSlots = inst.availableSlots?.filter((s) => !s.isBooked) || [];
            return (
              <div key={inst._id} className="instructor-card" id={`inst-${inst._id}`}>
                <div className="instructor-header">
                  <div className="instructor-avatar">{inst.name.charAt(0)}</div>
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
                    <div className="stat-value">4.9 / 5</div>
                    <div className="stat-label">Rating</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{openSlots.length}</div>
                    <div className="stat-label">Slots</div>
                  </div>
                </div>

                <p className="instructor-bio">
                  {inst.bio || 'Patient instructor specializing in parallel parking, defensive driving, and test preparation.'}
                </p>

                {openSlots.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Upcoming Slots:
                    </div>
                    <div className="slot-chips">
                      {openSlots.slice(0, 3).map((slot, i) => (
                        <span key={i} className="slot-chip available">
                          {slot.date} &bull; {slot.time}
                        </span>
                      ))}
                      {openSlots.length > 3 && (
                        <span className="slot-chip">+{openSlots.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
                  <button
                    onClick={() => openReviews(inst)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    id={`view-reviews-${inst._id}`}
                  >
                    Reviews
                  </button>

                  {isAuthenticated && user.role === 'student' ? (
                    <button
                      onClick={() => setSelectedInstructor(inst)}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1.5 }}
                      id={`book-session-${inst._id}`}
                    >
                      Book Session
                    </button>
                  ) : (
                    <Link to="/login" className="btn btn-secondary btn-sm" style={{ flex: 1.5 }}>
                      Login to Book
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking Modal */}
      {selectedInstructor && (
        <BookingModal
          instructor={selectedInstructor}
          onClose={() => setSelectedInstructor(null)}
          onBookingSuccess={() => {
            fetchInstructors();
          }}
        />
      )}

      {/* Instructor Reviews Viewer Modal */}
      {reviewsModalInstructor && (
        <div className="modal-overlay" id="reviews-viewer-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Reviews for {reviewsModalInstructor.name}</h3>
              <button
                className="modal-close"
                onClick={() => setReviewsModalInstructor(null)}
              >
                &times;
              </button>
            </div>

            {loadingReviews ? (
              <p style={{ textAlign: 'center', padding: 20 }}>Loading reviews...</p>
            ) : instructorReviews.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                No reviews yet for this instructor.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {instructorReviews.map((rev, idx) => (
                  <div
                    key={idx}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      paddingBottom: 12,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>
                        {rev.student?.name || 'Student'}
                      </span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>
                        Rating: {rev.rating} / 5
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
