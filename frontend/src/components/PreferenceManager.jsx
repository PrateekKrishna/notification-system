import React, { useState } from 'react';
import axios from 'axios';
import Popup from './Popup';

const USER_PREF_API = import.meta.env.VITE_USER_PREF_API_URL || 'http://localhost:8081';

const PreferenceManager = () => {
  const [userId, setUserId] = useState('');
  const [preferences, setPreferences] = useState([
    { channel: 'email', enabled: false },
    { channel: 'sms', enabled: false },
    { channel: 'whatsapp', enabled: false },
  ]);
  const [message, setMessage] = useState('');
  const [popup, setPopup] = useState({ show: false, message: '' });

  // Fetches preferences for the given userID
  const handleFetch = async () => {
    if (!userId) {
      setMessage('Please enter a User ID.');
      return;
    }
    try {
      const response = await axios.get(`${USER_PREF_API}/v1/users/${userId}/preferences`);
      if (response.data.length > 0) {
        setPreferences(response.data);
      }
      setMessage(`Preferences fetched for ${userId}.`);
    } catch (error) {
      setMessage(`Error fetching preferences: ${error.message}`);
      setPopup({ show: true, message: error.response?.data?.error || error.message });
    }
  };

  // Saves preferences for the given userID
  const handleSave = async () => {
    if (!userId) {
      setMessage('Please enter a User ID.');
      return;
    }
    try {
      const response = await axios.put(`${USER_PREF_API}/v1/users/${userId}/preferences`, preferences);
      if (response.status === 200) {
        setMessage(`Preferences saved for ${userId}.`);
      }else{
        setMessage(`Unexpected response status: ${response.status}.`);
      }
    } catch (error) {
      setMessage(`Error saving preferences: ${error.message}`);
      setPopup({ show: true, message: error.response?.data?.error || error.message });
    }
  };

  // Toggles the checkbox state
  const handleCheckboxChange = (channel) => {
    setPreferences(
      preferences.map((pref) =>
        pref.channel === channel ? { ...pref, enabled: !pref.enabled } : pref
      )
    );
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-full max-w-md backdrop-saturate-150 transition-all">
      <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">Preferences</h2>
      <div className="mb-6">
        <label htmlFor="userId" className="block text-sm font-medium text-slate-300 mb-2">User ID</label>
        <input
          type="text"
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="e.g. user123"
          className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500"
        />
      </div>
      <div className="mb-8 space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Notification Channels</h3>
        {preferences.map((pref) => (
          <div key={pref.channel} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <span className="text-sm font-medium text-slate-200 capitalize tracking-wide">{pref.channel}</span>
            <button
              type="button"
              role="switch"
              aria-checked={pref.enabled}
              onClick={() => handleCheckboxChange(pref.channel)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${pref.enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pref.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex space-x-4">
        <button onClick={handleFetch} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 active:scale-95">
          Fetch
        </button>
        <button onClick={handleSave} className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-95">
          Save Settings
        </button>
      </div>
      {message && (
        <div className="mt-6 p-3 rounded-lg bg-white/5 border border-white/10 text-center animate-fade-in">
          <p className="text-sm text-slate-300">{message}</p>
        </div>
      )}
      <Popup
        show={popup.show}
        message={popup.message}
        onClose={() => setPopup({ show: false, message: '' })}
      />
    </div>
  );
};

export default PreferenceManager;