"""
EduMaster Schedule Creation Demo
This script demonstrates how to create and manage schedules using the modular system.
"""

import json
from datetime import datetime

def demo_basic_schedule_creation():
    """Demo: Basic schedule creation"""
    print("📅 DEMO: Basic Schedule Creation")
    print("-" * 40)
    
    # Sample schedule data that would be sent to the API
    basic_schedule_data = {
        "userId": "user123",
        "schedule_name": "My Study Schedule",
        "preferences": {
            "schedule_type": "Balanced",
            "focus_duration": 120,
            "break_duration": 15,
            "preferred_study_time": "morning"
        },
        "schedule": [
            {
                "id": "session_1",
                "day": "monday",
                "time": "09:00-11:00",
                "subject": "Mathematics",
                "type": "study",
                "location": "Study Room A",
                "notes": "Focus on calculus and derivatives"
            },
            {
                "id": "session_2", 
                "day": "monday",
                "time": "14:00-16:00",
                "subject": "Physics",
                "type": "study",
                "location": "Library",
                "notes": "Quantum mechanics chapter"
            },
            {
                "id": "session_3",
                "day": "tuesday",
                "time": "10:00-12:00",
                "subject": "Computer Science",
                "type": "programming",
                "location": "Computer Lab",
                "notes": "Python data structures"
            },
            {
                "id": "session_4",
                "day": "wednesday",
                "time": "09:00-11:00",
                "subject": "Mathematics",
                "type": "practice",
                "location": "Study Room B",
                "notes": "Problem solving session"
            },
            {
                "id": "session_5",
                "day": "friday",
                "time": "15:00-17:00",
                "subject": "Review Session",
                "type": "review",
                "location": "Home",
                "notes": "Weekly review of all subjects"
            }
        ]
    }
    
    print("✨ Schedule Data Created:")
    print(f"   📋 Schedule Name: {basic_schedule_data['schedule_name']}")
    print(f"   👤 User ID: {basic_schedule_data['userId']}")
    print(f"   📚 Number of Sessions: {len(basic_schedule_data['schedule'])}")
    print(f"   ⚙️ Schedule Type: {basic_schedule_data['preferences']['schedule_type']}")
    
    print("\n📖 Sessions:")
    for i, session in enumerate(basic_schedule_data['schedule'], 1):
        print(f"   {i}. {session['day'].title()} {session['time']} - {session['subject']} ({session['type']})")
    
    print("\n🌐 API Endpoint: POST /schedule")
    print("📤 Request Body:")
    print(json.dumps(basic_schedule_data, indent=2)[:300] + "...")
    
    return basic_schedule_data

def demo_template_usage():
    """Demo: Using predefined templates"""
    print("\n\n🎯 DEMO: Using Schedule Templates")
    print("-" * 40)
    
    # Show how to apply a template
    template_application = {
        "customizations": {
            "subjects": {
                "Math": "Advanced Mathematics",
                "Science": "Physics",
                "English": "Literature",
                "History": "Modern History"
            },
            "location": "Home Office",
            "schedule_name": "My Customized Early Bird Schedule"
        },
        "merge_with_existing": False
    }
    
    print("✨ Applying 'Early Bird' Template with Customizations:")
    print("🌐 API Endpoint: POST /schedule/user123/apply-template/morning_person")
    print("📤 Customizations:")
    for old_subject, new_subject in template_application["customizations"]["subjects"].items():
        print(f"   📚 {old_subject} → {new_subject}")
    print(f"   📍 Location: {template_application['customizations']['location']}")
    print(f"   📋 Name: {template_application['customizations']['schedule_name']}")
    
    return template_application

def demo_export_options():
    """Demo: Export schedule in different formats"""
    print("\n\n📤 DEMO: Schedule Export Options")
    print("-" * 40)
    
    export_examples = [
        {
            "format": "JSON",
            "endpoint": "GET /schedule/user123/export-json",
            "description": "Complete backup with metadata",
            "use_case": "Data portability, backup, API integration"
        },
        {
            "format": "CSV", 
            "endpoint": "GET /schedule/user123/export-csv",
            "description": "Spreadsheet-compatible format",
            "use_case": "Excel analysis, sharing with teachers"
        },
        {
            "format": "iCal",
            "endpoint": "GET /schedule/user123/export-ical", 
            "description": "Standard calendar format",
            "use_case": "Google Calendar, Outlook, Apple Calendar"
        },
        {
            "format": "PDF",
            "endpoint": "POST /schedule/user123/export-pdf",
            "description": "Professional printable document",
            "use_case": "Physical copies, presentations"
        }
    ]
    
    print("📋 Available Export Formats:")
    for export in export_examples:
        print(f"\n   📄 {export['format']} Export")
        print(f"      🌐 Endpoint: {export['endpoint']}")
        print(f"      📝 Description: {export['description']}")
        print(f"      🎯 Use Case: {export['use_case']}")
    
    # Demo enhanced PDF export options
    pdf_options = {
        "send_email": False,
        "include_statistics": True,
        "color_theme": "blue",
        "subjects_filter": ["Mathematics", "Physics"]
    }
    
    print(f"\n🎨 Enhanced PDF Options:")
    print(f"   📧 Send via Email: {pdf_options['send_email']}")
    print(f"   📊 Include Statistics: {pdf_options['include_statistics']}")
    print(f"   🎨 Color Theme: {pdf_options['color_theme']}")
    print(f"   🔍 Subject Filter: {', '.join(pdf_options['subjects_filter'])}")

def demo_import_process():
    """Demo: Import schedule from different formats"""
    print("\n\n📥 DEMO: Schedule Import Process")
    print("-" * 40)
    
    # Demo CSV import
    csv_import_data = {
        "csv_content": """Day,Time,Subject,Type,Location,Notes
monday,09:00-11:00,Mathematics,study,Room A,Algebra basics
tuesday,14:00-16:00,Physics,lab,Lab 1,Mechanics experiment
wednesday,10:00-12:00,Chemistry,study,Room B,Organic chemistry""",
        "import_options": {
            "merge_with_existing": False,
            "schedule_name": "Imported CSV Schedule",
            "preferences": {
                "schedule_type": "Imported",
                "focus_duration": 120
            }
        }
    }
    
    print("📊 CSV Import Example:")
    print("🌐 API Endpoint: POST /schedule/user123/import-csv")
    print("📄 Sample CSV Data:")
    lines = csv_import_data["csv_content"].split('\n')
    for line in lines[:4]:  # Show first few lines
        print(f"   {line}")
    
    # Demo validation
    print(f"\n✅ Import Validation:")
    print("🌐 API Endpoint: POST /schedule/user123/validate-import")
    print("   🔍 Checks time formats, valid days, required fields")
    print("   📊 Provides statistics preview before importing")
    print("   📝 Shows sample sessions for review")

def demo_activity_management():
    """Demo: Individual activity scheduling"""
    print("\n\n📋 DEMO: Individual Activity Management")
    print("-" * 40)
    
    # Sample activity
    activity_data = {
        "userId": "user123",
        "title": "Physics Exam",
        "description": "Final exam for Physics 101",
        "activityDate": "2024-02-15",
        "activityTime": "09:00",
        "duration": 180,  # 3 hours
        "location": "Exam Hall A",
        "category": "exam",
        "priority": "high",
        "reminder_minutes": [1440, 60, 15]  # 1 day, 1 hour, 15 minutes before
    }
    
    print("📅 Single Activity Creation:")
    print("🌐 API Endpoint: POST /schedule-activity")
    print(f"   📋 Title: {activity_data['title']}")
    print(f"   📝 Description: {activity_data['description']}")
    print(f"   📅 Date: {activity_data['activityDate']}")
    print(f"   ⏰ Time: {activity_data['activityTime']}")
    print(f"   ⏱️ Duration: {activity_data['duration']} minutes")
    print(f"   📍 Location: {activity_data['location']}")
    print(f"   📂 Category: {activity_data['category']}")
    print(f"   🔥 Priority: {activity_data['priority']}")
    print(f"   🔔 Reminders: {', '.join(map(str, activity_data['reminder_minutes']))} minutes before")
    
    print(f"\n📊 Activity Management Options:")
    print("   📋 GET /activities/user123 - View all activities")
    print("   ✏️ PUT /activities/{id} - Update activity")
    print("   🗑️ DELETE /activities/{id} - Delete activity") 
    print("   📈 GET /activities/user123/statistics - Get completion stats")
    print("   ⏭️ GET /activities/user123/upcoming - Get next 7 days")

def main():
    """Run the complete demo"""
    print("🎓 EduMaster Schedule System - Complete Demo")
    print("=" * 60)
    print("This demo shows how to create and manage schedules efficiently")
    print("with the new modular system.")
    
    # Run all demos
    demo_basic_schedule_creation()
    demo_template_usage()
    demo_export_options()
    demo_import_process()
    demo_activity_management()
    
    print("\n" + "=" * 60)
    print("📊 Code Structure Summary:")
    print("   📄 scheduling.py (43 lines) - Main coordinator")
    print("   📄 schedule_core.py (322 lines) - Basic CRUD operations")
    print("   📄 schedule_export.py (630 lines) - All export formats") 
    print("   📄 schedule_import.py (572 lines) - All import formats")
    print("   📄 schedule_templates.py (559 lines) - Template system")
    print("   📄 schedule_activities.py (628 lines) - Activity management")
    
    print(f"\n✨ Key Benefits:")
    print("   🔧 Modular: Each file focuses on specific functionality")
    print("   📏 Manageable: Largest file is 630 lines (vs 937 before)")
    print("   🧪 Testable: Each module can be tested independently")
    print("   🔄 Maintainable: Easy to update individual features")
    print("   📈 Scalable: Easy to add new export formats or features")
    print("   👥 Collaborative: Team members can work on different modules")
    
    print(f"\n🎯 Schedule Creation Process:")
    print("   1️⃣ Create basic schedule → POST /schedule")
    print("   2️⃣ Or apply template → POST /schedule/{id}/apply-template/{template_id}")
    print("   3️⃣ Add individual activities → POST /schedule-activity")
    print("   4️⃣ Export in any format → GET /schedule/{id}/export-{format}")
    print("   5️⃣ Share or backup → Use exported files")
    
    print(f"\n🚀 Ready to use! The schedule system is working perfectly.")

if __name__ == "__main__":
    main()
