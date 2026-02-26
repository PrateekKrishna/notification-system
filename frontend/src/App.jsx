import React, { useState } from 'react';
import './App.css';
import PreferenceManager from './components/PreferenceManager';
import NotificationSender from './components/NotificationSender';
import UserRegistration from './components/UserRegistration';
import NavigationBar from './components/NavigationBar';
import UserList from './components/UserList';

function App() {
  const [activeTab, setActiveTab] = useState('register');

  return (
    <div className="min-h-screen mesh-bg flex flex-col items-center justify-start pt-12 p-4 lg:p-12 space-y-6">
      
      <NavigationBar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="w-full max-w-6xl flex justify-center items-start animate-fade-in relative transition-all duration-300">
        {activeTab === 'register' && <UserRegistration />}
        {activeTab === 'preferences' && <PreferenceManager />}
        {activeTab === 'send' && <NotificationSender />}
        {activeTab === 'dashboard' && <UserList />}
      </div>

    </div>
  )
}

export default App
