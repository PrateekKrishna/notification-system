import React from 'react';

const Popup = ({ show, message, onClose }) => {
  if (!show) return null;
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.3)' }}
    >
      <div className="bg-white rounded-lg p-6 shadow-2xl max-w-sm w-full z-60">
        <p className="text-red-600 font-semibold mb-4">{message}</p>
        <button
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Popup;
