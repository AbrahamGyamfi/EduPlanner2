import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    Check, 
    X, 
    Trash2, 
    ExternalLink,
    BookOpen,
    Award,
    AlertTriangle,
    Brain,
    Calendar,
    CheckCircle,
    Circle,
    Filter,
    MoreVertical
} from 'lucide-react';

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [notificationCounts, setNotificationCounts] = useState({ unread: 0, total: 0 });

    // Get user ID from localStorage or context
    const userId = localStorage.getItem('userId') || 'default-user';

    useEffect(() => {
        fetchNotifications();
    }, [filter]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const unreadParam = filter === 'unread' ? '&unread_only=true' : '';
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}?limit=100${unreadParam}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                setNotifications(data.notifications || []);
                setNotificationCounts(data.counts || { unread: 0, total: 0 });
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationIds) => {
        try {
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/mark-read`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    notification_ids: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
                })
            });

            if (response.ok) {
                fetchNotifications(); // Refresh notifications
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/mark-all-read`, {
                method: 'POST'
            });

            if (response.ok) {
                fetchNotifications(); // Refresh notifications
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Mark as clicked (which also marks as read)
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/click/${notification.id}`, {
                method: 'POST'
            });

            if (response.ok) {
                const data = await response.json();
                
                // Navigate to action URL if provided
                if (data.action_url && notification.action_url) {
                    window.location.href = notification.action_url;
                }

                // Refresh notifications to update read status
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error clicking notification:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const response = await fetch(`http://localhost:5000/notifications/in-app/${userId}/delete/${notificationId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchNotifications(); // Refresh notifications
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        const iconMap = {
            'assignment_reminder': BookOpen,
            'assignment_due_soon': AlertTriangle,
            'assignment_overdue': AlertTriangle,
            'session_reminder': Calendar,
            'achievement': Award,
            'ai_insight': Brain,
            'quiz_available': BookOpen,
            'system_update': Bell,
            'welcome': Bell
        };

        const IconComponent = iconMap[type] || Bell;
        return <IconComponent className="w-5 h-5" />;
    };

    const getNotificationColor = (color, priority, read) => {
        const baseOpacity = read ? 'opacity-60' : '';
        
        const colorMap = {
            'blue': `bg-blue-100 text-blue-800 border-blue-200 ${baseOpacity}`,
            'red': `bg-red-100 text-red-800 border-red-200 ${baseOpacity}`,
            'green': `bg-green-100 text-green-800 border-green-200 ${baseOpacity}`,
            'purple': `bg-purple-100 text-purple-800 border-purple-200 ${baseOpacity}`,
            'gold': `bg-yellow-100 text-yellow-800 border-yellow-200 ${baseOpacity}`,
            'orange': `bg-orange-100 text-orange-800 border-orange-200 ${baseOpacity}`
        };

        return colorMap[color] || `bg-gray-100 text-gray-800 border-gray-200 ${baseOpacity}`;
    };

    const getPriorityBadge = (priority) => {
        const priorityMap = {
            'urgent': { color: 'bg-red-500', text: 'Urgent' },
            'high': { color: 'bg-orange-500', text: 'High' },
            'medium': { color: 'bg-blue-500', text: 'Medium' },
            'low': { color: 'bg-gray-400', text: 'Low' }
        };

        const config = priorityMap[priority] || priorityMap['medium'];
        
        return (
            <span className={`inline-block w-2 h-2 rounded-full ${config.color} mr-2`} title={config.text}></span>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes}m ago`;
        } else if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'unread') return !notification.read;
        if (filter === 'read') return notification.read;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Bell className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                                <p className="text-gray-600">
                                    {notificationCounts.unread > 0 
                                        ? `${notificationCounts.unread} unread of ${notificationCounts.total} total`
                                        : `${notificationCounts.total} notifications`
                                    }
                                </p>
                            </div>
                        </div>
                        
                        {notificationCounts.unread > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark All Read
                            </button>
                        )}
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="flex mt-6 border-b border-gray-200">
                        {[
                            { key: 'all', label: 'All', count: notificationCounts.total },
                            { key: 'unread', label: 'Unread', count: notificationCounts.unread },
                            { key: 'read', label: 'Read', count: notificationCounts.total - notificationCounts.unread }
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                                    filter === tab.key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab.label}
                                {tab.count > 0 && (
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                        filter === tab.key
                                            ? 'bg-blue-100 text-blue-600'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                            </h3>
                            <p className="text-gray-500">
                                {filter === 'unread' 
                                    ? 'All caught up! Check back later for new notifications.'
                                    : 'When you have notifications, they\'ll appear here.'
                                }
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`bg-white rounded-lg shadow-sm border-l-4 hover:shadow-md transition-all cursor-pointer ${
                                    getNotificationColor(notification.color, notification.priority, notification.read)
                                } ${!notification.read ? 'border-l-blue-500' : 'border-l-gray-300'}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start flex-1">
                                            {/* Icon */}
                                            <div className={`flex-shrink-0 mr-3 p-2 rounded-full ${
                                                notification.color === 'red' ? 'bg-red-100' :
                                                notification.color === 'green' ? 'bg-green-100' :
                                                notification.color === 'purple' ? 'bg-purple-100' :
                                                notification.color === 'gold' ? 'bg-yellow-100' :
                                                'bg-blue-100'
                                            }`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center mb-1">
                                                    {getPriorityBadge(notification.priority)}
                                                    <h3 className={`text-sm font-medium ${
                                                        notification.read ? 'text-gray-600' : 'text-gray-900'
                                                    }`}>
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.read && (
                                                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2"></div>
                                                    )}
                                                </div>
                                                
                                                <p className={`text-sm ${
                                                    notification.read ? 'text-gray-500' : 'text-gray-700'
                                                }`}>
                                                    {notification.message}
                                                </p>
                                                
                                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                                    <span>{formatDate(notification.created_at)}</span>
                                                    {notification.action_url && (
                                                        <>
                                                            <span className="mx-2">•</span>
                                                            <ExternalLink className="w-3 h-3 mr-1" />
                                                            <span>Click to open</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex items-start space-x-2 ml-4">
                                            {!notification.read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        markAsRead(notification.id);
                                                    }}
                                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notification.id);
                                                }}
                                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete notification"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                
                {/* Load More Button (if needed) */}
                {filteredNotifications.length >= 50 && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => fetchNotifications()}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Load More Notifications
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPage;
