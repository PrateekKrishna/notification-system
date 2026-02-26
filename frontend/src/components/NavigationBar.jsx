import React from 'react';

const NavigationBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'register', label: 'Register User' },
    { id: 'preferences', label: 'Preferences' },
    { id: 'send', label: 'Send Notification' },
    { id: 'dashboard', label: 'Dashboard' }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 p-2 rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
      <nav className="flex space-x-1" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 whitespace-nowrap rounded-xl py-3 px-4 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default NavigationBar;
