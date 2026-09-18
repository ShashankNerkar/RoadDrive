
import React, { useState } from 'react';
import api from '../api/axios.js';

export default function BookingModal({ instructor, onClose, onBookingSuccess }) {
  const availableSlots = instructor?.availableSlots?.filter((s) => !s.isBooked) || [];

  const [selectedSlot, setSelectedSlot] = useState(
    availableSlots.length > 0 ? `${availableSlots[0].date}__${availableSlots[0].time}` : ''
  );
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [useCustomSlot, setUseCustomSlot] = useState(availableSlots.length === 0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let date = '';
    let time = '';

    if (!useCustomSlot && selectedSlot) {
      const parts = selectedSlot.split('__');
      date = parts[0];
      time = parts[1];
    } else {
      date = customDate;
      time = customTime;
    }

    if (!date || !time) {
      setError('Please choose a valid date and time slot.');
      setLoading(false);
      return;
    }

    try {
      const res = await api.post('/bookings', {
        instructorId: instructor._id,
        date,
        time,
        notes,
      });

      if (res.data.success) {
        setSuccess('Driving session booked successfully! Awaiting instructor confirmation.');
        setTimeout(() => {
          if (onBookingSuccess) onBookingSuccess(res.data.booking);
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book driving session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" id="booking-modal-overlay">
      <div className="modal-content" id="booking-modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Book Session with {instructor.name}</h3>
          <button className="modal-close" onClick={onClose} id="close-booking-modal-btn">&times;</button>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <form onSubmit={handleBooking}>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              Rate: <strong>₹{instructor.hourlyRate || 5}/hr</strong> &bull; Experience: <strong>{instructor.experienceYears || 3} years</strong>
            </p>
          </div>

          {availableSlots.length > 0 && !useCustomSlot ? (
            <div className="form-group">
              <label className="form-label">Select Available Slot</label>
              <select
                className="form-select"
                value={selectedSlot}
                onChange={(e) => setSelectedSlot(e.target.value)}
                id="select-available-slot"
              >
                {availableSlots.map((slot, index) => (
                  <option key={index} value={`${slot.date}__${slot.time}`}>
                    {slot.date} at {slot.time}
                  </option>
                ))}
              </select>
              <div style={{ marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setUseCustomSlot(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, cursor: 'pointer' }}
                >
                  Need a different date/time? Click here
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Session Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={customDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCustomDate(e.target.value)}
                  required
                  id="custom-booking-date"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Session Time Slot</label>
                <select
                  className="form-select"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  required
                  id="custom-booking-time"
                >
                  <option value="">-- Choose Time --</option>
                  <option value="08:00 AM">08:00 AM</option>
                  <option value="09:30 AM">09:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="01:30 PM">01:30 PM</option>
                  <option value="03:00 PM">03:00 PM</option>
                  <option value="04:30 PM">04:30 PM</option>
                </select>
              </div>
              {availableSlots.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <button
                    type="button"
                    onClick={() => setUseCustomSlot(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, cursor: 'pointer' }}
                  >
                    &larr; Back to instructor's pre-scheduled slots
                  </button>
                </div>
              )}
            </>
          )}

          <div className="form-group">
            <label className="form-label">Notes for Instructor (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="e.g., Focus on parallel parking, roundabout practice, highway entry..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              id="booking-notes"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} id="cancel-booking-btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="confirm-booking-btn">
              {loading ? 'Booking...' : 'Confirm Session Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

