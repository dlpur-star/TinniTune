import React from 'react';
import './FeedbackForm.css';

// Jotform - Reliable form handling with email notifications and data storage
// Form URL: https://form.jotform.com/260024569118051
// Submissions go to derrick78@me.com and are stored in Jotform dashboard

export default function FeedbackForm({ onClose }) {
  const handleOpenForm = () => {
    // Open Jotform in new tab
    window.open('https://form.jotform.com/260024569118051', '_blank');
    // Close the modal
    onClose();
  };

  return (
    <div className="feedback-container">
      <div className="feedback-form">
        <div className="form-header">
          <h3>📝 Focus Group Feedback</h3>
          <button type="button" onClick={onClose} className="close-x">×</button>
        </div>

        <div className="form-content">
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            We'd love to hear about your experience with TinniTune!
          </p>
          <p style={{ marginBottom: '20px', lineHeight: '1.6', color: 'rgba(255,255,255,0.8)' }}>
            Your feedback helps us improve the app and make it more effective for tinnitus relief.
          </p>
          <p style={{ marginBottom: '30px', lineHeight: '1.6', fontSize: '0.9em', color: 'rgba(255,255,255,0.7)' }}>
            The form will open in a new tab and takes about 2 minutes to complete.
          </p>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button type="button" onClick={handleOpenForm} className="submit-btn">
            Open Feedback Form
          </button>
        </div>
      </div>
    </div>
  );
}
