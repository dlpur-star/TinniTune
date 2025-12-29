import React, { useEffect } from 'react';
import FeedbackForm from './FeedbackForm';
import './FeedbackModal.css';

export default function FeedbackModal({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('feedback-modal-backdrop')) {
      onClose();
    }
  };

  return (
    <div className="feedback-modal-backdrop" onClick={handleBackdropClick}>
      <div className="feedback-modal-content">
        <FeedbackForm onClose={onClose} />
      </div>
    </div>
  );
}
