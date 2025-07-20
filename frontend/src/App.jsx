import './App.css'
import PreferenceManager from './components/PreferenceManager';
import NotificationSender from './components/NotificationSender';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 space-y-8">
      <PreferenceManager />
      <NotificationSender />
    </div>
  )
}

export default App
