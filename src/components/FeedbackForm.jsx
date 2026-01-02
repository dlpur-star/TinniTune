import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import './FeedbackForm.css';

// EmailJS Configuration
// To set up: https://www.emailjs.com/
// 1. Create account and verify email
// 2. Add email service (Gmail recommended)
// 3. Create email template
// 4. Get your Public Key from Account page
const EMAILJS_CONFIG = {
  serviceId: 'service_tinnitune',
  templateId: 'template_feedback',
  publicKey: 'JTTAVTLEPyzp33Cc2'
};

export default function FeedbackForm({ onClose }) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    reliefRating: '',
    featureUsed: '',
    feedback: '',
    improvements: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Send email using EmailJS
      const templateParams = {
        to_email: 'derrick78@me.com',
        from_email: formData.email || 'anonymous',
        relief_rating: formData.reliefRating,
        feature_used: formData.featureUsed,
        feedback: formData.feedback,
        improvements: formData.improvements || 'None provided',
        submission_date: new Date().toLocaleString()
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      setSubmitted(true);
    } catch (err) {
      console.error('Failed to send feedback:', err);
      setError('Failed to send feedback. Please try again or email directly to derrick78@me.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="feedback-success">
        <h3>✅ Thank you for your feedback!</h3>
        <p>Your input helps us improve TinniTune for everyone with tinnitus.</p>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <form
        onSubmit={handleSubmit}
        className="feedback-form"
      >
        <div className="form-header">
          <h3>📝 Focus Group Feedback</h3>
          <button type="button" onClick={onClose} className="close-x">×</button>
        </div>

        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            borderRadius: '5px',
            color: '#ff6b6b'
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email">Email (optional):</label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
          />
          <small>Only if you'd like us to follow up</small>
        </div>

        <div className="form-group">
          <label htmlFor="reliefRating">Relief Level: *</label>
          <select
            name="reliefRating"
            id="reliefRating"
            value={formData.reliefRating}
            onChange={handleChange}
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
            value={formData.featureUsed}
            onChange={handleChange}
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
            value={formData.feedback}
            onChange={handleChange}
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
            value={formData.improvements}
            onChange={handleChange}
            placeholder="What features or changes would make TinniTune more helpful for you?"
          ></textarea>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-btn" disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}
