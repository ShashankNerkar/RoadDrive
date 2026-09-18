
import React, { useState } from 'react';
import api from '../api/axios.js';

export default function ReviewModal({ instructor, onClose, onReviewSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please write a brief comment.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/reviews', {
        instructorId: instructor._id,
        rating: Number(rating),
        comment,
      });

      if (res.data.success) {
        setSuccess('Thank you! Your review has been submitted.');
        setTimeout(() => {
          if (onReviewSuccess) onReviewSuccess(res.data.review);
          onClose();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" id="review-modal-overlay">
      <div className="modal-content" id="review-modal-content">
        <div className="modal-header">
          <h3 className="modal-title">Rate Instructor: {instructor.name}</h3>
          <button className="modal-close" onClick={onClose} id="close-review-modal-btn">&times;</button>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Rating (1 to 5)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setRating(num)}
                  style={{
                    backgroundColor: num <= rating ? 'var(--primary)' : '#f1f5f9',
                    color: num <= rating ? '#ffffff' : 'var(--text-muted)',
                    border: `1px solid ${num <= rating ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    width: 36,
                    height: 36,
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  id={`rating-score-${num}`}
                >
                  {num}
                </button>
              ))}
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-dark)', marginLeft: 6 }}>
                Score: {rating} / 5
              </span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your Feedback / Review Comment</label>
            <textarea
              className="form-textarea"
              placeholder="How was your driving experience? Was the instructor calm, clear, and helpful?"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              id="review-comment-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} id="cancel-review-btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="submit-review-btn">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

