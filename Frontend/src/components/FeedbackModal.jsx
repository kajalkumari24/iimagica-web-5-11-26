import React, { useState } from "react";
import "./FeedbackModal.css";

const FeedbackModal = ({ isOpen, onClose, onSubmit }) => {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  return (
    <div className="feedback-overlay">
      <div className="feedback-modal">
        <h3>We value your feedback</h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write your feedback..."
        />
        <div className="modal-actions">
          <button
  onClick={() => {
    onSubmit(text);  // backend POST ke liye function call
    setText("");     // textarea clear karne ke liye
  }}
>
  Submit
</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
