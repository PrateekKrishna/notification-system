import React, { useState } from 'react';
import axios from 'axios';
import Popup from './Popup';

const USER_PREF_API = import.meta.env.VITE_USER_PREF_API_URL || 'http://localhost:8081';
const NOTIFICATION_API = import.meta.env.VITE_NOTIFICATION_API_URL || 'http://localhost:8082';

const NotificationSender = () => {
  const [form, setForm] = useState({
    user_id: '',
    recipient: '',
    type: '', 
    message: '', 
  });
  const [status, setStatus] = useState('');
  const [popup, setPopup] = useState({ show: false, message: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleUserIdBlur = async () => {
    if (!form.user_id) return;
    try {
      const response = await axios.get(`${USER_PREF_API}/v1/users/${form.user_id}`);
      if (response.data) {
        // Pre-fill recipient based on selected type, or just default to phone if not selected
        const recipient = form.type === 'email' ? response.data.email : response.data.phone_number;
        setForm(prev => ({ ...prev, recipient: recipient || prev.recipient }));
        setStatus(`Found user: ${response.data.name}`);
      }
    } catch (error) {
       // We don't error out loudly here, just let them type it manually
       setStatus(`User ${form.user_id} not found natively.`);
    }
  }

  // Effect to re-evaluate recipient when type changes
  React.useEffect(() => {
    if (form.user_id) handleUserIdBlur();
  }, [form.type]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const response = await axios.post(`${NOTIFICATION_API}/v1/notifications`, form);
      if (response.status === 202) {
        setStatus('Notification accepted successfully!');
      }
      console.log(form);
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
      setPopup({ show: true, message: error.response?.data?.error || error.message });
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-full max-w-md backdrop-saturate-150 transition-all">
      <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">Send Notification</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="user_id" className="block text-sm font-medium text-slate-300 mb-2">User ID</label>
          <input type="text" name="user_id" placeholder="e.g. user123" value={form.user_id} onChange={handleChange} onBlur={handleUserIdBlur} className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500" />
        </div>
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-2">Channel</label>
          <div className="relative">
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              required
            >
              <option value="" className="bg-slate-800">Select Type</option>
              <option value="sms" className="bg-slate-800">SMS</option>
              <option value="email" className="bg-slate-800">Email</option>
              <option value="whatsapp" className="bg-slate-800">WhatsApp</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>
        <div>
          <label htmlFor="recipient" className="block text-sm font-medium text-slate-300 mb-2">Recipient (Phone or Email)</label>
          <input type="text" name="recipient" placeholder="Enter details..." value={form.recipient} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500" />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">Message Payload</label>
          <textarea name="message" placeholder="Type your message here..." value={form.message} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500 min-h-[100px] resize-y"></textarea>
        </div>
        <button type="submit" className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-95 flex justify-center items-center">
          {status === 'Sending...' ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          {status === 'Sending...' ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
      {status && status !== 'Sending...' && (
        <div className="mt-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center animate-fade-in">
          <p className="text-sm font-medium text-emerald-400">{status}</p>
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

export default NotificationSender;