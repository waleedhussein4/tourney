import React, { useState } from "react";
import "../styles/Popup.css";

export function ConfirmationPopup({ message, onConfirm, onCancel }) {
  return (
    <div className="popup">
      <div className="popup-inner">
        <h3>{message}</h3>
        <div className="buttons">
          <button onClick={onConfirm}>Yes</button>
          <button onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
}
