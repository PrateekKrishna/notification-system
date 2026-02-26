import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Popup from './Popup';

const UserList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('http://localhost:8081/v1/users');
                setUsers(response.data);
            } catch (err) {
                setError('Failed to fetch users. Is the backend running?');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64 w-full max-w-4xl mx-auto">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl mx-auto p-8 rounded-2xl backdrop-blur-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <p className="text-rose-400 font-medium">{error}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] backdrop-saturate-150 transition-all animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">User Dashboard</h2>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-slate-400 text-sm tracking-wider uppercase">
                            <th className="pb-4 pt-2 px-4">Handle</th>
                            <th className="pb-4 pt-2 px-4">Name</th>
                            <th className="pb-4 pt-2 px-4">Contact</th>
                            <th className="pb-4 pt-2 px-4">Active Preferences</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-200">
                        {users.map((user) => (
                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="py-4 px-4 font-medium text-cyan-300">@{user.id}</td>
                                <td className="py-4 px-4">{user.name}</td>
                                <td className="py-4 px-4 text-sm text-slate-400">
                                    {user.email && <div>{user.email}</div>}
                                    {user.phone_number && <div>{user.phone_number}</div>}
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex flex-wrap gap-2">
                                        {user.preferences && user.preferences.length > 0 ? (
                                            user.preferences.map(pref => (
                                                pref.enabled && (
                                                    <span 
                                                        key={pref.ID} 
                                                        className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                                    >
                                                        {pref.channel}
                                                    </span>
                                                )
                                            ))
                                        ) : (
                                            <span className="text-slate-500 text-sm italic">None set</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="4" className="py-8 text-center text-slate-500">No users registered yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserList;
