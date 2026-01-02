import React from 'react';
import './FeedbackForm.css';

// Formsubmit.co - No account needed, just email verification
// First submission will trigger a verification email to derrick78@me.com
// Click the link in that email to activate the form

export default function FeedbackForm({ onClose }) {
  return (
    <div className="feedback-container">
      <form
        action="https://formsubmit.co/derrick78@me.com"
        method="POST"
        className="feedback-form"
      >
        {/* Formsubmit configuration */}
        <input type="hidden" name="_subject" value="TinniTune Feedback Submission" />
        <input type="hidden" name="_captcha" value="false" />
        <input type="hidden" name="_template" value="box" />
        <input type="text" name="_honey" style={{ display: 'none' }} />

        <div className="form-header">
          <h3>📝 Focus Group Feedback</h3>
          <button type="button" onClick={onClose} className="close-x">×</button>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email (optional):</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="your@email.com"
          />
          <small>Only if you'd like us to follow up</small>
        </div>

        <div className="form-group">
          <label htmlFor="reliefRating">Relief Level: *</label>
          <select
            name="reliefRating"
            id="reliefRating"
            required
          >
            <option value="">How much relief did you experience?</option>
            <option value="1">1 - No relief at all</option>
            <option value="2">2 - Minimal relief</option>
            <option value="3">3 - Slight relief</option>
            <option value="4">4 - Some relief</option>
            <option value="5">5 - Moderate relief</option>
            <option value="6">6 - Good relief</option>
            <option value="7">7 - Significant relief</option>
            <option value="8">8 - Great relief</option>
            <option value="9">9 - Excellent relief</option>
            <option value="10">10 - Complete relief</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="featureUsed">Primary Feature Used: *</label>
          <select
            name="featureUsed"
            id="featureUsed"
            required
          >
            <option value="">Select the main feature you used</option>
            <option value="frequency-matching">Frequency Matching</option>
            <option value="notched-therapy">Notched Sound Therapy</option>
            <option value="binaural-beats">Binaural Beats</option>
            <option value="calm-mode">Calm Mode (Breathing)</option>
            <option value="multiple">Multiple Features</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="feedback">Your Experience: *</label>
          <textarea
            name="feedback"
            id="feedback"
            rows="4"
            placeholder="Tell us about your experience with TinniTune. What worked well? What didn't?"
            required
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="improvements">Suggested Improvements:</label>
          <textarea
            name="improvements"
            id="improvements"
            rows="3"
            placeholder="What features or changes would make TinniTune more helpful for you?"
          ></textarea>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            Submit Feedback
          </button>
        </div>
      </form>
    </div>
  );
}
