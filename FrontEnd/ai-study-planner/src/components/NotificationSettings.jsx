import React, { useState, useEffect } from 'react';
import { Bell, Mail, Clock, Settings, CheckCircle, AlertCircle } from 'lucide-react';

const NotificationSettings = ({ userId }) => {
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    assignment_reminders: true,
    activity_reminders: true,
    reminder_intervals: [24, 6, 1],
    daily_digest: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = async () => {
    try {
      const response = await fetch(`http://localhost:5000/notifications/preferences/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch(`http://localhost:5000/notifications/preferences/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        setMessage('Preferences saved successfully!');
      } else {
        setMessage('Error saving preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Error saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const sendTestNotification = async () => {
    setTestSending(true);
    setMessage('');
    
    try {
      const response = await fetch(`http://localhost:5000/notifications/test/${userId}`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setMessage('Test notification sent! Check your email.');
      } else {
        setMessage('Error sending test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      setMessage('Error sending test notification');
    } finally {
      setTestSending(false);
    }
  };

  const handleIntervalChange = (hours, checked) => {
    if (checked) {
      setPreferences(prev => ({
        ...prev,
        reminder_intervals: [...prev.reminder_intervals, hours].sort((a, b) => b - a)
      }));
    } else {
      setPreferences(prev => ({
        ...prev,
        reminder_intervals: prev.reminder_intervals.filter(h => h !== hours)
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Bell className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
          <p className="text-sm text-gray-500">Manage your email notification preferences</p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message.includes('Error') ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email_enabled}
              onChange={(e) => setPreferences(prev => ({ ...prev, email_enabled: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Assignment Reminders */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Assignment Reminders</h3>
              <p className="text-sm text-gray-500">Get notified about upcoming assignments</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.assignment_reminders}
              onChange={(e) => setPreferences(prev => ({ ...prev, assignment_reminders: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Activity Reminders */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Activity Reminders</h3>
              <p className="text-sm text-gray-500">Get notified about scheduled activities</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.activity_reminders}
              onChange={(e) => setPreferences(prev => ({ ...prev, activity_reminders: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Reminder Intervals */}
        <div className="p-4 border rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Reminder Intervals</h3>
          <p className="text-sm text-gray-500 mb-4">Choose when to receive reminders before due dates</p>
          <div className="space-y-2">
            {[
              { hours: 24, label: '1 day before' },
              { hours: 6, label: '6 hours before' },
              { hours: 1, label: '1 hour before' }
            ].map(({ hours, label }) => (
              <label key={hours} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={preferences.reminder_intervals.includes(hours)}
                  onChange={(e) => handleIntervalChange(hours, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Daily Digest */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-600" />
            <div>
              <h3 className="font-medium text-gray-900">Daily Digest</h3>
              <p className="text-sm text-gray-500">Receive a daily summary of upcoming tasks</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.daily_digest}
              onChange={(e) => setPreferences(prev => ({ ...prev, daily_digest: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 pt-6 border-t">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
        <button
          onClick={sendTestNotification}
          disabled={testSending || !preferences.email_enabled}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testSending ? 'Sending...' : 'Send Test'}
        </button>
      </div>
    </div>
  );
};

export default NotificationSettings; 