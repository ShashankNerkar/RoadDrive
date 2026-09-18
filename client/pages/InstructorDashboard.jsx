// client/pages/InstructorDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function InstructorDashboard() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings', 'slots', 'profile'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // New slot form state
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('10:00 AM');
  const [slotLoading, setSlotLoading] = useState(false);

  // Profile update form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    experienceYears: user?.experienceYears || 3,
    hourlyRate: user?.hourlyRate || 45,
  });
  const [profileMsg, setProfileMsg] = useState('');

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings/my');
      if (res.data.success) {
        setBookings(res.data.bookings);
      }
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      if (res.data.success) {
        await fetchBookings();
        await refreshUser();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!slotDate || !slotTime) return;

    setSlotLoading(true);
    try {
      const res = await api.post('/users/instructor/slots', { date: slotDate, time: slotTime });
      if (res.data.success) {
        await refreshUser();
        setSlotDate('');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add slot');
    } finally {
      setSlotLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to remove this available slot?')) return;
    try {
      const res = await api.delete(`/users/instructor/slots/${slotId}`);
      if (res.data.success) {
        await refreshUser();
      }
    } catch (err) {
      alert('Failed to remove slot');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/profile', profileData);
      if (res.data.success) {
        setProfileMsg('Instructor profile updated successfully!');
        await refreshUser();
        setTimeout(() => setProfileMsg(''), 3000);
      }
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const slots = user?.availableSlots || [];
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const acceptedCount = bookings.filter((b) => b.status === 'accepted').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="container dashboard-container" id="instructor-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Instructor Portal: {user?.name}</h1>
        <p className="dashboard-subtitle">
          Manage your schedule slots, accept or reject student booking requests, and mark sessions completed.
        </p>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-box-title">Pending Requests</div>
          <div className="stat-box-number" style={{ color: 'var(--accent)' }}>{pendingCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Active / Accepted</div>
          <div className="stat-box-number">{acceptedCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Completed Lessons</div>
          <div className="stat-box-number" style={{ color: 'var(--success)' }}>{completedCount}</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-title">Available Slots</div>
          <div className="stat-box-number">{slots.filter((s) => !s.isBooked).length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
          id="tab-inst-bookings"
        >
          Session Requests ({bookings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'slots' ? 'active' : ''}`}
          onClick={() => setActiveTab('slots')}
          id="tab-inst-slots"
        >
          Manage Time Slots ({slots.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
          id="tab-inst-profile"
        >
          Instructor Profile & Rates
        </button>
      </div>

      {/* Tab 1: Bookings Management */}
      {activeTab === 'bookings' && (
        <div>
          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', backgroundColor: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No driving session requests found yet.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Contact</th>
                    <th>Session Date</th>
                    <th>Time</th>
                    <th>Notes</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const studentName = b.student?.name || b.studentObj?.name || 'Student';
                    const studentPhone = b.student?.phone || b.studentObj?.phone || 'No phone';
                    const studentEmail = b.student?.email || b.studentObj?.email || '';

                    return (
                      <tr key={b._id}>
                        <td>
                          <strong>{studentName}</strong>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{studentEmail}</div>
                        </td>
                        <td>{studentPhone}</td>
                        <td>{b.date}</td>
                        <td>{b.time}</td>
                        <td style={{ maxWidth: 180, fontSize: 13, color: 'var(--text-muted)' }}>{b.notes || '—'}</td>
                        <td>
                          <span className={`badge badge-${b.status}`}>
                            {b.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {b.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(b._id, 'accepted')}
                                  className="btn btn-success btn-sm"
                                  id={`accept-btn-${b._id}`}
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(b._id, 'rejected')}
                                  className="btn btn-danger btn-sm"
                                  id={`reject-btn-${b._id}`}
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {b.status === 'accepted' && (
                              <button
                                onClick={() => handleStatusUpdate(b._id, 'completed')}
                                className="btn btn-primary btn-sm"
                                id={`complete-btn-${b._id}`}
                              >
                                Mark Completed ✓
                              </button>
                            )}

                            {b.status === 'completed' && (
                              <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                                Finished
                              </span>
                            )}

                            {b.status === 'rejected' && (
                              <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 600 }}>
                                Declined
                              </span>
                            )}
                          </div>
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

      {/* Tab 2: Manage Available Slots */}
      {activeTab === 'slots' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          {/* Add Slot Form */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>+ Add New Available Slot</h3>
            <form onSubmit={handleAddSlot}>
              <div className="form-group">
                <label className="form-label">Slot Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={slotDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setSlotDate(e.target.value)}
                  required
                  id="add-slot-date"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time Window</label>
                <select
                  className="form-select"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  id="add-slot-time"
                >
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={slotLoading}
                style={{ width: '100%' }}
                id="submit-slot-btn"
              >
                {slotLoading ? 'Adding...' : 'Publish Slot to Students'}
              </button>
            </form>
          </div>

          {/* Current Slots List */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              Your Scheduled Slots ({slots.length})
            </h3>
            {slots.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No slots added yet. Add slots on the left to let students book with you.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {slots.map((slot) => (
                  <div
                    key={slot._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: slot.isBooked ? '#fef2f2' : '#f0fdf4',
                      border: `1px solid ${slot.isBooked ? '#fecaca' : '#bbf7d0'}`,
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <div>
                      <strong>{slot.date}</strong> at <strong>{slot.time}</strong>
                      <span style={{ marginLeft: 10, fontSize: 12, fontWeight: 600, color: slot.isBooked ? 'var(--danger)' : 'var(--success)' }}>
                        {slot.isBooked ? '● Booked' : '● Available'}
                      </span>
                    </div>
                    {!slot.isBooked && (
                      <button
                        onClick={() => handleDeleteSlot(slot._id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Profile Settings */}
      {activeTab === 'profile' && (
        <div style={{ maxWidth: 540, backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 28 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Update Instructor Profile</h3>
          {profileMsg && <div className="form-success">{profileMsg}</div>}

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input
                  type="number"
                  className="form-input"
                  value={profileData.experienceYears}
                  onChange={(e) => setProfileData({ ...profileData, experienceYears: e.target.value })}
                  min={1}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hourly Rate (₹/hr)</label>
                <input
                  type="number"
                  className="form-input"
                  value={profileData.hourlyRate}
                  onChange={(e) => setProfileData({ ...profileData, hourlyRate: e.target.value })}
                  min={1}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio & Specializations</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={profileData.bio}
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Profile Changes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
