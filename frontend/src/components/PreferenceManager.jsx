import React, { useState } from 'react';
import axios from 'axios';
import Popup from './Popup';

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
      const response = await axios.get(`http://localhost:8081/v1/users/${userId}/preferences`);
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
      const response = await axios.put(`http://localhost:8081/v1/users/${userId}/preferences`, preferences);
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
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-white">Preference Manager</h2>
      <div className="mb-4">
        <label htmlFor="userId" className="block text-slate-400 mb-2">User ID</label>
        <input
          type="text"
          id="userId"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Channels</h3>
        {preferences.map((pref) => (
          <div key={pref.channel} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={pref.channel}
              checked={pref.enabled}
              onChange={() => handleCheckboxChange(pref.channel)}
              className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
            />
            <label htmlFor={pref.channel} className="ml-2 text-sm font-medium text-slate-300 capitalize">{pref.channel}</label>
          </div>
        ))}
      </div>
      <div className="flex space-x-4">
        <button onClick={handleFetch} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">Fetch</button>
        <button onClick={handleSave} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded">Save</button>
      </div>
      {message && <p className="mt-4 text-sm text-slate-400">{message}</p>}
      <Popup
        show={popup.show}
        message={popup.message}
        onClose={() => setPopup({ show: false, message: '' })}
      />
    </div>
  );
};

export default PreferenceManager;