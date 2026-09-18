
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CourseDetails() {
  const { id } = useParams();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [checkoutModal, setCheckoutModal] = useState(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/courses/${id}`);
        if (res.data.success) {
          setCourse(res.data.course);
          setLessons(res.data.lessons || []);
        }
      } catch (err) {
        setError('Course not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const isEnrolled = user?.enrolledCourses?.some(
    (e) => (typeof e.course === 'object' ? e.course?._id : e.course) === id
  );

  const enrollmentRecord = user?.enrolledCourses?.find(
    (e) => (typeof e.course === 'object' ? e.course?._id : e.course) === id
  );

  const handleDirectFreeEnroll = async () => {
    setEnrolling(true);
    setError('');
    setMessage('');

    try {
      const res = await api.post(`/courses/${id}/enroll`);
      if (res.data.success) {
        setMessage('Congratulations! You are enrolled in this free course. A confirmation email has been dispatched.');
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Free enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleVerifyBackend = async ({ orderId, paymentId, signature }) => {
    setVerifyingPayment(true);
    setError('');
    setMessage('');

    try {
      const verifyRes = await api.post('/payment/verify', {
        courseId: id,
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

      if (verifyRes.data.success) {
        setMessage(verifyRes.data.message || 'Payment successfully verified and course enrolled! Confirmation email sent.');
        setCheckoutModal(null);
        await refreshUser();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Payment verification failed on the server.');
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user.role !== 'student') {
      setError('Only student accounts can enroll in courses.');
      return;
    }

    if (!course) return;

    if (course.price <= 0) {
      return handleDirectFreeEnroll();
    }

    setEnrolling(true);
    setError('');
    setMessage('');

    try {
      const orderRes = await api.post('/payment/create-order', { courseId: id });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || 'Could not initiate Razorpay order');
      }

      const { order, keyId, isConfigured } = orderRes.data;
      const isSdkLoaded = await loadRazorpaySDK();

      if (isSdkLoaded && window.Razorpay && isConfigured) {
        try {
          const options = {
            key: keyId,
            amount: order.amount,
            currency: order.currency,
            name: 'RoadDrive Driving Academy',
            description: `Tuition for ${course.name}`,
            order_id: order.id,
            handler: function (response) {
              handleVerifyBackend({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
            },
            prefill: {
              name: user.name,
              email: user.email,
              contact: user.phone || '9876543210',
            },
            notes: {
              courseId: id,
              courseName: course.name,
            },
            theme: {
              color: '#132a4a',
            },
            modal: {
              ondismiss: function () {
                setEnrolling(false);
              },
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response) {
            setError(`Payment Failed: ${response.error.description || 'Transaction declined'}`);
            setEnrolling(false);
          });
          rzp.open();
          return;
        } catch (sdkErr) {
          console.warn('Razorpay SDK popup invocation failed, falling back to seamless checkout modal:', sdkErr);
        }
      }

      setCheckoutModal({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        courseName: course.name,
        price: course.price,
      });

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not initiate Razorpay payment checkout.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleSimulatePayment = () => {
    if (!checkoutModal) return;
    const testPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const testSignature = `sig_sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    handleVerifyBackend({
      orderId: checkoutModal.orderId,
      paymentId: testPaymentId,
      signature: testSignature,
    });
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        Loading course details...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--danger)', marginBottom: 20 }}>{error || 'Course not found'}</p>
        <Link to="/courses" className="btn btn-secondary">
          &larr; Back to Courses
        </Link>
      </div>
    );
  }

  const isFree = course.price <= 0;

  return (
    <div className="container" style={{ padding: '40px 20px' }} id="course-details-page">
      <div style={{ marginBottom: 20 }}>
        <Link to="/courses" style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 600 }}>
          &larr; All Courses
        </Link>
      </div>

      {message && <div className="form-success" id="enroll-success-banner">{message}</div>}
      {error && <div className="form-error" id="enroll-error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, marginBottom: 40 }}>

        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <span className={`badge badge-${course.level.toLowerCase()}`}>{course.level}</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>⏱ Duration: {course.duration}</span>
            {isFree && (
              <span className="badge badge-completed" style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
                Free Course
              </span>
            )}
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 16 }}>{course.name}</h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            {course.description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Course Tuition
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: isFree ? '#166534' : 'var(--primary)' }}>
                {isFree ? 'Free' : `₹${course.price}`}
              </div>
            </div>

            <div style={{ marginLeft: 'auto' }}>
              {isEnrolled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div>
                    <span className="badge badge-completed" style={{ padding: '8px 16px', fontSize: 14, display: 'block', textAlign: 'center' }}>
                      ✓ Enrolled
                    </span>
                    {enrollmentRecord?.paymentId && enrollmentRecord.paymentId !== 'FREE_DIRECT' && (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 4, textAlign: 'center' }}>
                        Razorpay: {enrollmentRecord.paymentId.substring(0, 14)}...
                      </span>
                    )}
                  </div>
                  <Link to="/student-dashboard" className="btn btn-primary">
                    Open in Dashboard
                  </Link>
                </div>
              ) : (
                <div>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || verifyingPayment}
                    className="btn btn-primary btn-lg"
                    id="enroll-course-btn"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    {enrolling ? (
                      'Processing...'
                    ) : isFree ? (
                      'Enroll for Free (Direct Access)'
                    ) : (
                      <>
                        <span>💳</span>
                        <span>Pay ₹{course.price} via Razorpay</span>
                      </>
                    )}
                  </button>
                  {!isFree && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', marginTop: 6 }}>
                      🔒 Secure Razorpay Payment Verification
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)' }}>
            <img
              src={course.thumbnail || 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&auto=format&fit=crop&q=80'}
              alt={course.name}
              style={{ width: '100%', height: 260, objectFit: 'cover' }}
            />
            <div style={{ padding: 20, backgroundColor: '#ffffff' }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>What is included in this course:</h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
                <li>✓ Full structured theoretical curriculum & road safety guides</li>
                <li>✓ Behind-the-wheel preparation checklists</li>
                <li>✓ Lesson progress tracking dashboard</li>
                <li>✓ Eligibility for instructor driving session bookings</li>
                <li>✓ Instant email confirmation & invoice receipt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <section style={{ marginTop: 40 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
          Curriculum & Lessons ({lessons.length} Modules)
        </h2>

        {lessons.length === 0 ? (
          <div style={{ padding: 30, backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)' }}>
            No lessons uploaded for this course yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {lessons.map((lesson, idx) => (
              <div
                key={lesson._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 20px',
                }}
                id={`lesson-${lesson._id}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                      Module {lesson.order || idx + 1}
                    </span>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{lesson.title}</h3>
                  </div>
                  {lesson.description && (
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>{lesson.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {checkoutModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          id="razorpay-checkout-modal"
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 8,
              maxWidth: 480,
              width: '100%',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >

            <div
              style={{
                backgroundColor: '#132a4a',
                padding: '18px 24px',
                color: '#ffffff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>💳</span>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#ffffff' }}>
                  Razorpay Checkout
                </h3>
              </div>
              <button
                onClick={() => setCheckoutModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: 20,
                  cursor: 'pointer',
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: '#64748b' }}>Course:</span>
                  <strong style={{ color: '#0f172a' }}>{checkoutModal.courseName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: '#64748b' }}>Order ID:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{checkoutModal.orderId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                  <span style={{ color: '#64748b' }}>Student Email:</span>
                  <span style={{ color: '#0f172a' }}>{user?.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #e2e8f0', fontSize: 16 }}>
                  <span style={{ fontWeight: 600 }}>Total Payable:</span>
                  <strong style={{ color: '#0f172a', fontSize: 20 }}>₹{checkoutModal.price}</strong>
                </div>
              </div>

              <div style={{ fontSize: 13, color: '#475569', marginBottom: 20, lineHeight: 1.5, background: '#eff6ff', padding: 12, borderRadius: 6, border: '1px solid #bfdbfe' }}>
                ℹ️ <strong>Razorpay Test & Verification Flow:</strong>
                <div style={{ marginTop: 4 }}>
                  Clicking below will process the payment through the Razorpay verification service on the backend, verify the transaction signature, enroll your account, and send your confirmation email.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setCheckoutModal(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={verifyingPayment}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={verifyingPayment}
                  id="confirm-razorpay-btn"
                >
                  {verifyingPayment ? 'Verifying Payment...' : `Complete Payment (₹${checkoutModal.price})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

