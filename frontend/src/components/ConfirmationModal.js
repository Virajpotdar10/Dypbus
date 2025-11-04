import React from 'react';
import './ConfirmationModal.css';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'No' }) => {
  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <div className="modal-header">
          <h3><FiAlertTriangle /> {title}</h3>
          <button onClick={onCancel} className="modal-close"><FiX /></button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          <button onClick={onCancel} className="btn btn-secondary">{cancelText}</button>
          <button onClick={onConfirm} className="btn btn-danger">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;