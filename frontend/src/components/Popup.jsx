import React from 'react';

const Popup = ({ show, message, onClose }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/40 animate-fade-in p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-2xl max-w-sm w-full z-60 animate-scale-up">
        <div className="flex items-center space-x-3 mb-4 text-rose-500">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-white">Error Encountered</h3>
        </div>
        <p className="text-slate-300 font-medium mb-6 text-sm leading-relaxed">{message}</p>
        <button
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 active:scale-95 border border-slate-700"
          onClick={onClose}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default Popup;
