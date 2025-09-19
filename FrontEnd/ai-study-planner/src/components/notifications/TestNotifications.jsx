import React, { useState } from 'react';
import { Bell, Plus, TestTube, Wand2 } from 'lucide-react';

const TestNotifications = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('userId') || 'default-user';

    const createTestNotifications = async () => {
        try {
            setLoading(true);
            setMessage('');
            
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/test-all`, {
                method: 'POST'
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                setMessage(`✅ Created ${data.notifications?.length || 0} test notifications successfully!`);
            } else {
                setMessage('❌ Failed to create test notifications');
            }
        } catch (error) {
            console.error('Error creating test notifications:', error);
            setMessage('❌ Error creating test notifications');
        } finally {
            setLoading(false);
        }
    };

    const createCustomNotification = async (type, title, message) => {
        try {
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type,
                    title,
                    message,
                    action_url: '/dashboard',
                    expires_in_hours: 24
                })
            });

            if (response.ok) {
                setMessage(`✅ Created "${title}" notification!`);
            } else {
                setMessage('❌ Failed to create custom notification');
            }
        } catch (error) {
            console.error('Error creating custom notification:', error);
            setMessage('❌ Error creating custom notification');
        }
    };

    const notificationTypes = [
        {
            type: 'assignment_reminder',
            title: '📝 Assignment Reminder',
            description: 'Reminds about upcoming assignments',
            sampleTitle: 'Math Assignment Due Soon',
            sampleMessage: 'Complete Calculus Assignment #3 - Due in 2 days'
        },
        {
            type: 'assignment_due_soon',
            title: '⚠️ Assignment Due Soon',
            description: 'Urgent reminder for assignments due within hours',
            sampleTitle: 'Assignment Due in 2 Hours!',
            sampleMessage: 'English Essay submission deadline approaching fast!'
        },
        {
            type: 'session_reminder',
            title: '📚 Study Session',
            description: 'Reminds about scheduled study sessions',
            sampleTitle: 'Study Session in 30 Minutes',
            sampleMessage: 'Physics Review Session - Chapter 5: Thermodynamics'
        },
        {
            type: 'achievement',
            title: '🏆 Achievement',
            description: 'Celebrates milestones and accomplishments',
            sampleTitle: 'Achievement Unlocked!',
            sampleMessage: 'Congratulations! You\'ve completed 10 quizzes this week!'
        },
        {
            type: 'ai_insight',
            title: '🤖 AI Insights',
            description: 'Shares personalized learning insights',
            sampleTitle: 'New AI Insights Available',
            sampleMessage: 'We\'ve analyzed your study patterns and have recommendations!'
        },
        {
            type: 'welcome',
            title: '👋 Welcome',
            description: 'Welcomes new users to the platform',
            sampleTitle: 'Welcome to EduMaster!',
            sampleMessage: 'Start your learning journey with personalized study plans.'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <TestTube className="w-8 h-8 text-blue-600 mr-3" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notification System Test</h1>
                            <p className="text-gray-600">Test and demonstrate the in-app notification system</p>
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg mb-4 ${
                            message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                        }`}>
                            {message}
                        </div>
                    )}

                    <button
                        onClick={createTestNotifications}
                        disabled={loading}
                        className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        ) : (
                            <Wand2 className="w-5 h-5 mr-2" />
                        )}
                        Create All Test Notifications
                    </button>
                </div>

                {/* Individual Notification Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {notificationTypes.map((notif) => (
                        <div key={notif.type} className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                        {notif.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm">{notif.description}</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                <h4 className="font-medium text-gray-900 mb-1">{notif.sampleTitle}</h4>
                                <p className="text-gray-700 text-sm">{notif.sampleMessage}</p>
                            </div>

                            <button
                                onClick={() => createCustomNotification(notif.type, notif.sampleTitle, notif.sampleMessage)}
                                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Create This Notification
                            </button>
                        </div>
                    ))}
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                        <Bell className="w-5 h-5 mr-2" />
                        How to Test Notifications
                    </h3>
                    <ol className="list-decimal list-inside text-blue-800 space-y-2">
                        <li>Click "Create All Test Notifications" to generate sample notifications</li>
                        <li>Check the notification bell icon in your header - it should show a red badge</li>
                        <li>Click the bell icon to see the notification dropdown</li>
                        <li>Click on any notification to mark it as read and navigate (if applicable)</li>
                        <li>Visit the full notifications page to see all notifications with filtering</li>
                        <li>Use individual "Create This Notification" buttons to test specific types</li>
                    </ol>
                    
                    <div className="mt-4 p-4 bg-blue-100 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">Integration Tips:</h4>
                        <ul className="text-blue-800 text-sm space-y-1">
                            <li>• Add the NotificationBell component to your header/navbar</li>
                            <li>• Create a route to the NotificationPage for full notification management</li>
                            <li>• Use the backend API to create notifications when events occur</li>
                            <li>• Set up periodic cleanup of expired notifications</li>
                        </ul>
                    </div>
                </div>

                {/* API Endpoints Documentation */}
                <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Available API Endpoints</h3>
                    <div className="space-y-4 text-sm">
                        <div className="border-l-4 border-green-400 pl-4">
                            <code className="text-green-600">GET /notifications/in-app/{userId}</code>
                            <p className="text-gray-600 mt-1">Get all notifications for a user</p>
                        </div>
                        <div className="border-l-4 border-blue-400 pl-4">
                            <code className="text-blue-600">POST /notifications/in-app/{userId}/mark-read</code>
                            <p className="text-gray-600 mt-1">Mark specific notifications as read</p>
                        </div>
                        <div className="border-l-4 border-purple-400 pl-4">
                            <code className="text-purple-600">POST /notifications/in-app/{userId}/click/{notificationId}</code>
                            <p className="text-gray-600 mt-1">Mark notification as clicked and get action URL</p>
                        </div>
                        <div className="border-l-4 border-orange-400 pl-4">
                            <code className="text-orange-600">POST /notifications/in-app/{userId}/create</code>
                            <p className="text-gray-600 mt-1">Create a new notification</p>
                        </div>
                        <div className="border-l-4 border-red-400 pl-4">
                            <code className="text-red-600">DELETE /notifications/in-app/{userId}/delete/{notificationId}</code>
                            <p className="text-gray-600 mt-1">Delete a specific notification</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TestNotifications;
