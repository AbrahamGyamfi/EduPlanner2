import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, ExternalLink, MoreVertical } from 'lucide-react';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    // Get user ID from localStorage or context
    const userId = localStorage.getItem('userId') || 'default-user';

    useEffect(() => {
        fetchNotifications();
        
        // Set up polling for new notifications (every 30 seconds)
        const interval = setInterval(fetchNotifications, 30000);
        
        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}?limit=10`);
            const data = await response.json();
            
            if (data.status === 'success') {
                setNotifications(data.notifications || []);
                setUnreadCount(data.counts?.unread || 0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/mark-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notification_ids: [notificationId]
                })
            });

            if (response.ok) {
                fetchNotifications(); // Refresh notifications
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Mark as clicked
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/click/${notification.id}`, {
                method: 'POST'
            });

            if (response.ok) {
                // Close dropdown
                setShowDropdown(false);
                
                // Navigate to action URL if provided
                if (notification.action_url) {
                    if (notification.action_url.startsWith('http')) {
                        window.open(notification.action_url, '_blank');
                    } else {
                        window.location.href = notification.action_url;
                    }
                }

                // Refresh notifications
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error clicking notification:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    const getNotificationIcon = (type) => {
        const iconMap = {
            'assignment_reminder': '📝',
            'assignment_due_soon': '⚠️',
            'assignment_overdue': '🚨',
            'session_reminder': '📚',
            'achievement': '🏆',
            'ai_insight': '🤖',
            'quiz_available': '🧠',
            'system_update': '🔄',
            'welcome': '👋'
        };

        return iconMap[type] || '📢';
    };

    const getNotificationColor = (color, priority) => {
        if (priority === 'urgent') return 'border-red-400 bg-red-50';
        if (priority === 'high') return 'border-orange-400 bg-orange-50';
        
        const colorMap = {
            'red': 'border-red-300 bg-red-50',
            'green': 'border-green-300 bg-green-50',
            'blue': 'border-blue-300 bg-blue-50',
            'purple': 'border-purple-300 bg-purple-50',
            'gold': 'border-yellow-300 bg-yellow-50'
        };

        return colorMap[color] || 'border-gray-300 bg-gray-50';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-colors"
            >
                <Bell className="w-6 h-6" />
                
                {/* Unread Count Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full min-w-[1.25rem] h-5">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <p className="text-sm text-gray-600">{unreadCount} unread</p>
                            )}
                        </div>
                        <button
                            onClick={() => setShowDropdown(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="text-gray-500 mt-2 text-sm">Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No notifications</p>
                                <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                                            !notification.read ? 'bg-blue-50' : ''
                                        }`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {/* Unread Indicator */}
                                        {!notification.read && (
                                            <div className="absolute left-2 top-6 w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}

                                        <div className="flex items-start space-x-3 ml-4">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border ${
                                                getNotificationColor(notification.color, notification.priority)
                                            }`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${
                                                    notification.read ? 'text-gray-700' : 'text-gray-900'
                                                }`}>
                                                    {notification.title}
                                                </p>
                                                <p className={`text-sm mt-1 line-clamp-2 ${
                                                    notification.read ? 'text-gray-500' : 'text-gray-700'
                                                }`}>
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                                    <span>{formatDate(notification.created_at)}</span>
                                                    {notification.action_url && (
                                                        <>
                                                            <span className="mx-1">•</span>
                                                            <ExternalLink className="w-3 h-3 mr-1" />
                                                            <span>Click to view</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Mark as Read Button */}
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="border-t border-gray-200 p-3">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => {
                                        setShowDropdown(false);
                                        window.location.href = '/notifications';
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View All Notifications
                                </button>
                                
                                {unreadCount > 0 && (
                                    <button
                                        onClick={async () => {
                                            try {
                                                const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/mark-all-read`, {
                                                    method: 'POST'
                                                });
                                                if (response.ok) {
                                                    fetchNotifications();
                                                }
                                            } catch (error) {
                                                console.error('Error marking all as read:', error);
                                            }
                                        }}
                                        className="text-sm text-gray-600 hover:text-gray-800"
                                    >
                                        Mark All Read
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
