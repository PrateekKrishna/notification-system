import React, { useState } from 'react';
import axios from 'axios';

const NotificationSender = () => {
  const [form, setForm] = useState({
    user_id: '',
    recipient: '',
    type: '', 
    message: '', 
  });
  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Sending...');
    try {
      const response = await axios.post('http://localhost:8082/v1/notifications', form);
      if (response.status === 202) {
        setStatus('Notification accepted successfully!');
      }
      console.log(form);
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-lg w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4 text-white">Send Notification</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="user_id" className="block text-slate-400 mb-1">User ID</label>
          <input type="text" name="user_id" value={form.user_id} onChange={handleChange} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600" />
        </div>
        <div>
          <label htmlFor="type" className="block text-slate-400 mb-1">Type</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"
            required
          >
            <option value="">Select Type</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </div>
        <div>
          <label htmlFor="recipient" className="block text-slate-400 mb-1">Recipient (Phone # or Email)</label>
          <input type="text" name="recipient" value={form.recipient} onChange={handleChange} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600" />
        </div>
        <div>
          <label htmlFor="message" className="block text-slate-400 mb-1">Message</label>
          <textarea name="message" value={form.message} onChange={handleChange} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600"></textarea>
        </div>
        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded">Send Notification</button>
      </form>
      {status && <p className="mt-4 text-sm text-slate-400">{status}</p>}
    </div>
  );
};

export default NotificationSender;