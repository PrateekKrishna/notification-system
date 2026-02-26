import React, { useState } from 'react';
import axios from 'axios';
import Popup from './Popup';

const UserRegistration = () => {
  const [form, setForm] = useState({
    id: '',
    name: '',
    email: '',
    phone_number: '',
  });
  const [status, setStatus] = useState('');
  const [popup, setPopup] = useState({ show: false, message: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Registering...');
    try {
      const response = await axios.post('http://localhost:8081/v1/users', form);
      if (response.status === 201) {
        setStatus(`User ${form.name} registered successfully!`);
      }
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
      setPopup({ show: true, message: error.response?.data?.error || error.message });
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-full max-w-md backdrop-saturate-150 transition-all">
      <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">Register User</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="id" className="block text-sm font-medium text-slate-300 mb-2">User ID (Unique Handle)</label>
          <input type="text" name="id" placeholder="e.g. user123" value={form.id} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500" required />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
          <input type="text" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500" required />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
          <input type="email" name="email" placeholder="john@example.com" value={form.email} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500" required />
        </div>
        <div>
          <label htmlFor="phone_number" className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
          <input type="tel" name="phone_number" placeholder="+1234567890" value={form.phone_number} onChange={handleChange} className="w-full p-3 rounded-xl bg-black/20 text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all placeholder-slate-500" />
        </div>
        <button type="submit" className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-95 flex justify-center items-center">
          {status === 'Registering...' ? 'Registering...' : 'Register Account'}
        </button>
      </form>
      {status && status !== 'Registering...' && (
        <div className={`mt-6 p-3 rounded-lg border text-center animate-fade-in ${status.includes('Error') ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          <p className="text-sm font-medium">{status}</p>
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

export default UserRegistration;
