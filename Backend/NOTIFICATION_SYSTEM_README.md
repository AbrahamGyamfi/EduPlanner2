# 🔔 EduMaster In-App Notification System

A comprehensive notification system that provides both email notifications and in-app notifications with real-time updates, click tracking, and user interaction capabilities.

## 🚀 Features

### In-App Notifications
- **Real-time notifications** with bell icon badge
- **Dropdown preview** with recent notifications
- **Full notification page** with filtering and management
- **Click tracking** with automatic read status updates
- **Action URLs** for navigation to relevant pages
- **Priority levels** with visual indicators
- **Expiration system** for automatic cleanup
- **Mobile-responsive** design

### Email Notifications (Existing)
- **Assignment reminders** at multiple intervals
- **Study session reminders** 30 minutes before
- **Assignment creation confirmations**
- **Welcome emails** for new users
- **Comprehensive HTML templates** with styling

### Notification Types
- 📝 **Assignment Reminders** - Due date alerts
- ⚠️ **Assignment Due Soon** - Urgent deadline warnings
- 🚨 **Assignment Overdue** - Past due notifications
- 📚 **Study Session Reminders** - Upcoming session alerts
- 🏆 **Achievements** - Progress celebrations
- 🤖 **AI Insights** - Personalized recommendations
- 🧠 **Quiz Available** - New quiz notifications
- 🔄 **System Updates** - Platform announcements
- 👋 **Welcome Messages** - Onboarding notifications

## 📁 File Structure

```
Backend/
├── in_app_notifications.py      # In-app notification system
├── notifications.py             # Email notification system
└── server.py                    # Routes registration

Frontend/
└── src/components/notifications/
    ├── NotificationPage.jsx     # Full notification management page
    ├── NotificationBell.jsx     # Header bell icon with dropdown
    ├── TestNotifications.jsx    # Testing and demo page
    └── index.js                 # Component exports
```

## 🛠 Backend Setup

### 1. Install Dependencies
```bash
pip install flask pymongo bson python-dotenv
```

### 2. Database Setup
The system uses your existing MongoDB `notifications_collection`. No additional setup required.

### 3. Register Routes
The routes are automatically registered in `server.py`:
```python
from in_app_notifications import register_in_app_notification_routes
register_in_app_notification_routes(app)
```

## 📱 Frontend Setup

### 1. Install Dependencies
```bash
npm install lucide-react
```

### 2. Add to Your App
```jsx
// In your header component
import { NotificationBell } from './components/notifications';

<NotificationBell />
```

```jsx
// Add route for full notifications page
import { NotificationPage } from './components/notifications';

<Route path="/notifications" component={NotificationPage} />
```

## 🔧 API Endpoints

### Get Notifications
```http
GET /notifications/in-app/{userId}?limit=50&unread_only=false&include_expired=false
```

**Response:**
```json
{
  "status": "success",
  "notifications": [
    {
      "id": "notification_id",
      "type": "assignment_reminder",
      "title": "Assignment Due Tomorrow",
      "message": "Complete Math Assignment #5",
      "icon": "📝",
      "color": "blue",
      "priority": "medium",
      "action_url": "/assignments/123",
      "read": false,
      "clicked": false,
      "created_at": "2024-01-15T10:00:00Z",
      "expires_at": null,
      "metadata": {}
    }
  ],
  "counts": {
    "unread": 5,
    "total": 23
  }
}
```

### Mark as Read
```http
POST /notifications/in-app/{userId}/mark-read
Content-Type: application/json

{
  "notification_ids": ["notification_id_1", "notification_id_2"]
}
```

### Click Notification
```http
POST /notifications/in-app/{userId}/click/{notification_id}
```

**Response:**
```json
{
  "status": "success",
  "message": "Notification clicked",
  "action_url": "/assignments/123"
}
```

### Create Notification
```http
POST /notifications/in-app/{userId}/create
Content-Type: application/json

{
  "type": "assignment_reminder",
  "title": "New Assignment Created",
  "message": "You have a new assignment due next week",
  "action_url": "/assignments/456",
  "expires_in_hours": 24,
  "metadata": {
    "assignment_id": "456",
    "course": "Mathematics"
  }
}
```

### Delete Notification
```http
DELETE /notifications/in-app/{userId}/delete/{notification_id}
```

### Mark All as Read
```http
POST /notifications/in-app/{userId}/mark-all-read
```

### Test Notifications
```http
POST /notifications/in-app/{userId}/test-all
```

## 🎯 Usage Examples

### Creating Notifications Programmatically

```python
from in_app_notifications import in_app_notification_manager

# Assignment reminder
in_app_notification_manager.create_assignment_reminder(
    user_id="user_123",
    assignment_id="assignment_456",
    assignment_data={
        'title': 'Math Assignment #5',
        'courseName': 'Calculus I',
        'dueDate': '2024-01-20T23:59:00Z'
    },
    hours_until_due=24
)

# Achievement notification
in_app_notification_manager.create_achievement_notification(
    user_id="user_123",
    achievement_type="quiz_streak",
    achievement_data={'count': 5}
)

# AI insight notification
in_app_notification_manager.create_ai_insight_notification(
    user_id="user_123",
    insight_data={'top_insights': ['You perform better in morning sessions']}
)
```

### Frontend Integration

```jsx
// Get notifications count for badge
const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
    const fetchNotifications = async () => {
        const response = await fetch(`/notifications/in-app/${userId}?limit=1`);
        const data = await response.json();
        setUnreadCount(data.counts?.unread || 0);
    };
    
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
}, []);
```

## 🎨 Customization

### Notification Types
Add new notification types in `InAppNotificationManager`:

```python
self.notification_types['custom_type'] = {
    'icon': '🎯',
    'color': 'green',
    'priority': 'high'
}
```

### Frontend Styling
Customize colors and styles in the React components:

```jsx
const getNotificationColor = (color, priority, read) => {
    const colorMap = {
        'custom': `bg-purple-100 text-purple-800 border-purple-200`,
        // ... existing colors
    };
    return colorMap[color] || 'bg-gray-100';
};
```

## 🔄 Integration with Existing Systems

### Assignment System Integration
```python
# When creating an assignment
from in_app_notifications import in_app_notification_manager

def create_assignment(user_id, assignment_data):
    # ... create assignment logic ...
    
    # Create notification
    in_app_notification_manager.create_notification(
        user_id=user_id,
        notification_type='assignment_reminder',
        title=f"New Assignment: {assignment_data['title']}",
        message=f"Due {assignment_data['dueDate']}",
        action_url=f"/assignments/{assignment_id}",
        metadata=assignment_data
    )
```

### Quiz System Integration
```python
# When quiz is completed with perfect score
def complete_quiz(user_id, quiz_result):
    if quiz_result['score'] == 100:
        in_app_notification_manager.create_achievement_notification(
            user_id=user_id,
            achievement_type='perfect_score',
            achievement_data={'quiz_title': quiz_result['title']}
        )
```

## 🧪 Testing

### Backend Testing
```bash
cd Backend
python -c "
from in_app_notifications import in_app_notification_manager
print('Creating test notification...')
result = in_app_notification_manager.create_notification(
    'test_user', 'welcome', 'Test Title', 'Test Message'
)
print(f'Created: {result}')
"
```

### Frontend Testing
1. Navigate to `/test-notifications` (or include the TestNotifications component)
2. Click "Create All Test Notifications"
3. Check the bell icon for red badge
4. Test the dropdown and full notification page

### API Testing with curl
```bash
# Create test notifications
curl -X POST http://localhost:5000/notifications/in-app/test_user/test-all

# Get notifications
curl http://localhost:5000/notifications/in-app/test_user

# Mark as read
curl -X POST http://localhost:5000/notifications/in-app/test_user/mark-read \
  -H "Content-Type: application/json" \
  -d '{"notification_ids": ["notification_id_here"]}'
```

## 📊 Monitoring & Maintenance

### Cleanup Expired Notifications
```http
POST /notifications/in-app/cleanup-expired
```

### Performance Considerations
- **Polling Interval**: 30 seconds for bell updates (adjustable)
- **Pagination**: 50 notifications per page (configurable)
- **Expiration**: Automatic cleanup of expired notifications
- **Indexing**: Consider adding MongoDB indexes on `user_id` and `created_at`

### Database Indexes (Recommended)
```javascript
// In MongoDB
db.notifications.createIndex({"user_id": 1, "created_at": -1})
db.notifications.createIndex({"expires_at": 1})
db.notifications.createIndex({"user_id": 1, "read": 1})
```

## 🚨 Troubleshooting

### Common Issues

1. **Notifications not showing**
   - Check user ID in localStorage
   - Verify backend server is running
   - Check browser console for errors

2. **Bell badge not updating**
   - Ensure polling is enabled
   - Check API endpoint responses
   - Verify notification creation in database

3. **Click actions not working**
   - Check action URLs are valid
   - Verify click endpoint responses
   - Test navigation permissions

### Debug Mode
Enable debug logging:
```python
import logging
logging.getLogger('in_app_notifications').setLevel(logging.DEBUG)
```

## 🔮 Future Enhancements

- **Real-time WebSocket updates** instead of polling
- **Push notifications** for mobile apps
- **Notification categories** with custom filtering
- **Rich media notifications** with images/videos
- **Notification templates** system
- **Analytics dashboard** for notification engagement
- **A/B testing** for notification content
- **Scheduled notifications** for future delivery

## 📄 License & Support

This notification system is part of the EduMaster application. For support or questions, check the main application documentation or create an issue in the project repository.

---

**Happy notifying! 🔔✨**
