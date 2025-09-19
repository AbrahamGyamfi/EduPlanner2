"""
Integrated time tracking module for EduMaster application.
This module consolidates reading time tracking with general study activities
to provide unified analytics for the dashboard.
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import study_sessions_collection, files_collection, users_collection
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

def register_integrated_time_tracking_routes(app):
    """Register integrated time tracking routes with the Flask app"""
    
    @app.route('/unified-study-analytics/<user_id>', methods=['GET'])
    def get_unified_study_analytics(user_id):
        """Get comprehensive study analytics combining reading and general study time"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            days = int(request.args.get('days', 30))
            course_id = request.args.get('courseId')
            
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Build base query
            base_query = {
                'userId': {'$in': [user_id, user_object_id]},
                'timestamp': {'$gte': cutoff_date}
            }
            
            if course_id:
                base_query['courseId'] = course_id
            
            # Get all study sessions (both reading and general)
            all_sessions = list(study_sessions_collection.find(base_query).sort('timestamp', -1))
            
            # Separate reading sessions from general study sessions
            reading_sessions = [s for s in all_sessions if s.get('sessionType') == 'slide_reading']
            general_sessions = [s for s in all_sessions if s.get('sessionType') != 'slide_reading']
            
            # Calculate reading metrics
            reading_metrics = calculate_reading_metrics(reading_sessions)
            
            # Calculate general study metrics
            general_metrics = calculate_general_study_metrics(general_sessions)
            
            # Calculate combined metrics
            total_active_seconds = (
                sum(s.get('activeReadingTime', 0) for s in reading_sessions) +
                sum(s.get('activeTime', 0) * 60 for s in general_sessions)  # Convert minutes to seconds
            )
            total_active_minutes = round(total_active_seconds / 60, 1)
            total_active_hours = round(total_active_minutes / 60, 1)
            
            total_session_count = len(all_sessions)
            
            # Calculate efficiency across all activities
            reading_efficiency_sum = sum(s.get('efficiency', 100) for s in reading_sessions)
            general_efficiency_sum = sum(s.get('efficiency', 100) for s in general_sessions)
            total_efficiency_sum = reading_efficiency_sum + general_efficiency_sum
            overall_efficiency = round(total_efficiency_sum / total_session_count, 1) if total_session_count > 0 else 0
            
            # Calculate study streak
            all_session_dates = [s['timestamp'].date() for s in all_sessions]
            unique_dates = sorted(set(all_session_dates), reverse=True)
            
            study_streak = 0
            if unique_dates:
                current_date = datetime.now().date()
                for i, date in enumerate(unique_dates):
                    if date == current_date - timedelta(days=i):
                        study_streak += 1
                    else:
                        break
            
            # Get daily breakdown
            daily_breakdown = get_daily_activity_breakdown(all_sessions)
            
            # Activity type breakdown
            activity_breakdown = {
                'reading': {
                    'total_sessions': len(reading_sessions),
                    'total_time_minutes': round(sum(s.get('activeReadingTime', 0) for s in reading_sessions) / 60, 1),
                    'average_efficiency': reading_metrics['average_efficiency']
                },
                'general_study': {
                    'total_sessions': len(general_sessions),
                    'total_time_minutes': round(sum(s.get('activeTime', 0) for s in general_sessions), 1),
                    'average_efficiency': general_metrics['average_efficiency']
                }
            }
            
            # Weekly goal progress (assuming 10 hours/week target)
            weekly_target_minutes = 10 * 60
            last_week_cutoff = datetime.now() - timedelta(days=7)
            last_week_sessions = [s for s in all_sessions if s['timestamp'] >= last_week_cutoff]
            last_week_minutes = (
                sum(s.get('activeReadingTime', 0) for s in last_week_sessions if s.get('sessionType') == 'slide_reading') / 60 +
                sum(s.get('activeTime', 0) for s in last_week_sessions if s.get('sessionType') != 'slide_reading')
            )
            weekly_goal_progress = round((last_week_minutes / weekly_target_minutes) * 100, 1)
            
            return jsonify({
                'status': 'success',
                'unified_analytics': {
                    'total_active_hours': total_active_hours,
                    'total_active_minutes': total_active_minutes,
                    'total_sessions': total_session_count,
                    'overall_efficiency': overall_efficiency,
                    'study_streak_days': study_streak,
                    'weekly_goal_progress': min(weekly_goal_progress, 100),
                    'reading_metrics': reading_metrics,
                    'general_study_metrics': general_metrics,
                    'activity_breakdown': activity_breakdown,
                    'daily_breakdown': daily_breakdown,
                    'unique_study_days': len(unique_dates)
                }
            })

        except Exception as e:
            logger.error(f"Error getting unified study analytics: {str(e)}")
            return jsonify({'error': 'Error retrieving unified study analytics'}), 500

    @app.route('/activity-time-summary/<user_id>', methods=['GET'])
    def get_activity_time_summary(user_id):
        """Get time summary organized by activity types for dashboard display"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            days = int(request.args.get('days', 7))  # Default to last week
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Get all sessions within date range
            sessions = list(study_sessions_collection.find({
                'userId': {'$in': [user_id, user_object_id]},
                'timestamp': {'$gte': cutoff_date}
            }).sort('timestamp', -1))
            
            # Organize by activity type and course
            summary = {
                'total_time_minutes': 0,
                'by_activity_type': {
                    'slide_reading': {
                        'sessions': 0,
                        'total_time_minutes': 0,
                        'average_efficiency': 0,
                        'by_course': {}
                    },
                    'general_study': {
                        'sessions': 0,
                        'total_time_minutes': 0,
                        'average_efficiency': 0,
                        'by_course': {}
                    },
                    'quiz_taking': {
                        'sessions': 0,
                        'total_time_minutes': 0,
                        'average_efficiency': 0,
                        'by_course': {}
                    }
                },
                'daily_totals': {},
                'course_totals': {}
            }
            
            # Process each session
            for session in sessions:
                session_type = session.get('sessionType', 'general_study')
                course_id = session.get('courseId', 'unknown')
                course_name = session.get('courseName', 'Unknown Course')
                
                # Calculate session time based on type
                if session_type == 'slide_reading':
                    session_time = round(session.get('activeReadingTime', 0) / 60, 1)  # Convert seconds to minutes
                else:
                    session_time = session.get('activeTime', 0)  # Already in minutes
                
                efficiency = session.get('efficiency', 100)
                session_date = session['timestamp'].date().isoformat()
                
                # Update totals
                summary['total_time_minutes'] += session_time
                
                # Update activity type breakdown
                activity_data = summary['by_activity_type'].setdefault(session_type, {
                    'sessions': 0,
                    'total_time_minutes': 0,
                    'average_efficiency': 0,
                    'by_course': {}
                })
                
                activity_data['sessions'] += 1
                activity_data['total_time_minutes'] += session_time
                
                # Update course breakdown within activity type
                course_data = activity_data['by_course'].setdefault(course_id, {
                    'course_name': course_name,
                    'sessions': 0,
                    'total_time_minutes': 0,
                    'efficiencies': []
                })
                
                course_data['sessions'] += 1
                course_data['total_time_minutes'] += session_time
                course_data['efficiencies'].append(efficiency)
                
                # Update daily totals
                summary['daily_totals'].setdefault(session_date, 0)
                summary['daily_totals'][session_date] += session_time
                
                # Update overall course totals
                course_summary = summary['course_totals'].setdefault(course_id, {
                    'course_name': course_name,
                    'total_time_minutes': 0,
                    'reading_time_minutes': 0,
                    'study_time_minutes': 0,
                    'sessions': 0
                })
                
                course_summary['total_time_minutes'] += session_time
                course_summary['sessions'] += 1
                
                if session_type == 'slide_reading':
                    course_summary['reading_time_minutes'] += session_time
                else:
                    course_summary['study_time_minutes'] += session_time
            
            # Calculate average efficiencies
            for activity_type, data in summary['by_activity_type'].items():
                if data['sessions'] > 0:
                    # Get all efficiencies for this activity type
                    all_efficiencies = []
                    for course_data in data['by_course'].values():
                        all_efficiencies.extend(course_data['efficiencies'])
                    
                    if all_efficiencies:
                        data['average_efficiency'] = round(sum(all_efficiencies) / len(all_efficiencies), 1)
                    
                    # Clean up efficiency arrays (not needed in response)
                    for course_data in data['by_course'].values():
                        course_data['average_efficiency'] = round(sum(course_data['efficiencies']) / len(course_data['efficiencies']), 1) if course_data['efficiencies'] else 0
                        del course_data['efficiencies']
            
            return jsonify({
                'status': 'success',
                'time_summary': summary,
                'date_range': {
                    'days': days,
                    'from_date': cutoff_date.date().isoformat(),
                    'to_date': datetime.now().date().isoformat()
                }
            })

        except Exception as e:
            logger.error(f"Error getting activity time summary: {str(e)}")
            return jsonify({'error': 'Error retrieving activity time summary'}), 500

    @app.route('/real-time-study-status/<user_id>', methods=['GET'])
    def get_real_time_study_status(user_id):
        """Get current active study sessions and real-time status"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Find active sessions (within last 30 minutes)
            recent_cutoff = datetime.now() - timedelta(minutes=30)
            
            active_sessions = list(study_sessions_collection.find({
                'userId': {'$in': [user_id, user_object_id]},
                'status': 'active',
                'lastActivity': {'$gte': recent_cutoff}
            }).sort('lastActivity', -1))
            
            # Get today's total time
            today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            today_sessions = list(study_sessions_collection.find({
                'userId': {'$in': [user_id, user_object_id]},
                'timestamp': {'$gte': today_start}
            }))
            
            # Calculate today's time by activity type
            todays_reading_time = sum(s.get('activeReadingTime', 0) for s in today_sessions if s.get('sessionType') == 'slide_reading') / 60  # Convert to minutes
            todays_study_time = sum(s.get('activeTime', 0) for s in today_sessions if s.get('sessionType') != 'slide_reading')
            todays_total_time = todays_reading_time + todays_study_time
            
            status_data = {
                'has_active_session': len(active_sessions) > 0,
                'active_sessions': [],
                'todays_time': {
                    'reading_minutes': round(todays_reading_time, 1),
                    'study_minutes': round(todays_study_time, 1),
                    'total_minutes': round(todays_total_time, 1)
                }
            }
            
            # Format active sessions
            for session in active_sessions:
                session_info = {
                    'session_id': str(session['_id']),
                    'session_type': session.get('sessionType', 'general_study'),
                    'course_name': session.get('courseName', 'Unknown'),
                    'filename': session.get('filename', None),
                    'start_time': session.get('startTime', session.get('timestamp')).isoformat(),
                    'current_duration_minutes': calculate_current_session_duration(session),
                    'current_progress': session.get('readingProgress', 0) if session.get('sessionType') == 'slide_reading' else None,
                    'current_efficiency': session.get('efficiency', 100)
                }
                status_data['active_sessions'].append(session_info)
            
            return jsonify({
                'status': 'success',
                'real_time_status': status_data
            })

        except Exception as e:
            logger.error(f"Error getting real-time study status: {str(e)}")
            return jsonify({'error': 'Error retrieving real-time study status'}), 500

    @app.route('/dashboard-time-data/<user_id>', methods=['GET'])
    def get_dashboard_time_data(user_id):
        """Get time data specifically formatted for dashboard widgets"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            # Get different time ranges
            now = datetime.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            week_start = now - timedelta(days=7)
            month_start = now - timedelta(days=30)
            
            # Get sessions for each time range
            today_sessions = list(study_sessions_collection.find({
                'userId': {'$in': [user_id, user_object_id]},
                'timestamp': {'$gte': today_start}
            }))
            
            week_sessions = list(study_sessions_collection.find({
                'userId': {'$in': [user_id, user_object_id]},
                'timestamp': {'$gte': week_start}
            }))
            
            month_sessions = list(study_sessions_collection.find({
                'userId': {'$in': [user_id, user_object_id]},
                'timestamp': {'$gte': month_start}
            }))
            
            # Calculate time summaries
            dashboard_data = {
                'today': calculate_time_summary(today_sessions),
                'this_week': calculate_time_summary(week_sessions),
                'this_month': calculate_time_summary(month_sessions),
                'productivity_trends': calculate_productivity_trends(week_sessions),
                'course_time_distribution': get_course_time_distribution(week_sessions),
                'efficiency_trends': get_efficiency_trends(week_sessions)
            }
            
            return jsonify({
                'status': 'success',
                'dashboard_data': dashboard_data
            })

        except Exception as e:
            logger.error(f"Error getting dashboard time data: {str(e)}")
            return jsonify({'error': 'Error retrieving dashboard time data'}), 500

    logger.info("Integrated time tracking routes registered successfully")


def calculate_reading_metrics(reading_sessions):
    """Calculate specific metrics for reading sessions"""
    if not reading_sessions:
        return {
            'total_reading_hours': 0,
            'average_reading_speed': 0,
            'average_comprehension_score': 0,
            'total_slides_read': 0,
            'average_efficiency': 0,
            'total_sessions': 0
        }
    
    total_time = sum(s.get('activeReadingTime', 0) for s in reading_sessions) / 3600  # Convert to hours
    reading_speeds = [s.get('readingSpeed', 0) for s in reading_sessions if s.get('readingSpeed', 0) > 0]
    avg_speed = round(sum(reading_speeds) / len(reading_speeds), 0) if reading_speeds else 0
    
    comprehension_scores = [s.get('comprehensionScore', 0) for s in reading_sessions if s.get('comprehensionScore') is not None]
    avg_comprehension = round(sum(comprehension_scores) / len(comprehension_scores), 1) if comprehension_scores else 0
    
    unique_slides = set((s.get('courseId'), s.get('filename')) for s in reading_sessions)
    total_slides = len(unique_slides)
    
    efficiencies = [s.get('efficiency', 100) for s in reading_sessions]
    avg_efficiency = round(sum(efficiencies) / len(efficiencies), 1) if efficiencies else 0
    
    return {
        'total_reading_hours': round(total_time, 1),
        'average_reading_speed': avg_speed,
        'average_comprehension_score': avg_comprehension,
        'total_slides_read': total_slides,
        'average_efficiency': avg_efficiency,
        'total_sessions': len(reading_sessions)
    }


def calculate_general_study_metrics(general_sessions):
    """Calculate metrics for general study sessions"""
    if not general_sessions:
        return {
            'total_study_hours': 0,
            'average_session_length': 0,
            'average_efficiency': 0,
            'total_sessions': 0,
            'average_satisfaction': 0
        }
    
    total_time = sum(s.get('activeTime', 0) for s in general_sessions) / 60  # Convert to hours
    avg_session_length = round(sum(s.get('activeTime', 0) for s in general_sessions) / len(general_sessions), 1)
    
    efficiencies = [s.get('efficiency', 100) for s in general_sessions]
    avg_efficiency = round(sum(efficiencies) / len(efficiencies), 1) if efficiencies else 0
    
    satisfaction_scores = [s.get('satisfaction', 5) for s in general_sessions if s.get('satisfaction') is not None]
    avg_satisfaction = round(sum(satisfaction_scores) / len(satisfaction_scores), 1) if satisfaction_scores else 0
    
    return {
        'total_study_hours': round(total_time, 1),
        'average_session_length': avg_session_length,
        'average_efficiency': avg_efficiency,
        'total_sessions': len(general_sessions),
        'average_satisfaction': avg_satisfaction
    }


def get_daily_activity_breakdown(sessions):
    """Get daily breakdown of activities for visualization"""
    daily_data = {}
    
    for session in sessions:
        date_key = session['timestamp'].date().isoformat()
        session_type = session.get('sessionType', 'general_study')
        
        if date_key not in daily_data:
            daily_data[date_key] = {
                'date': date_key,
                'slide_reading_minutes': 0,
                'general_study_minutes': 0,
                'total_minutes': 0,
                'session_count': 0
            }
        
        # Add time based on session type
        if session_type == 'slide_reading':
            session_time = round(session.get('activeReadingTime', 0) / 60, 1)
            daily_data[date_key]['slide_reading_minutes'] += session_time
        else:
            session_time = session.get('activeTime', 0)
            daily_data[date_key]['general_study_minutes'] += session_time
        
        daily_data[date_key]['total_minutes'] += session_time
        daily_data[date_key]['session_count'] += 1
    
    # Convert to sorted list
    return sorted(daily_data.values(), key=lambda x: x['date'])


def calculate_current_session_duration(session):
    """Calculate current duration of an active session"""
    start_time = session.get('startTime', session.get('timestamp', datetime.now()))
    current_time = datetime.now()
    duration_seconds = (current_time - start_time).total_seconds()
    return round(duration_seconds / 60, 1)  # Return minutes


def calculate_time_summary(sessions):
    """Calculate time summary for a set of sessions"""
    if not sessions:
        return {
            'total_minutes': 0,
            'reading_minutes': 0,
            'study_minutes': 0,
            'session_count': 0,
            'average_efficiency': 0
        }
    
    reading_time = sum(s.get('activeReadingTime', 0) for s in sessions if s.get('sessionType') == 'slide_reading') / 60
    study_time = sum(s.get('activeTime', 0) for s in sessions if s.get('sessionType') != 'slide_reading')
    total_time = reading_time + study_time
    
    efficiencies = [s.get('efficiency', 100) for s in sessions]
    avg_efficiency = round(sum(efficiencies) / len(efficiencies), 1) if efficiencies else 0
    
    return {
        'total_minutes': round(total_time, 1),
        'reading_minutes': round(reading_time, 1),
        'study_minutes': round(study_time, 1),
        'session_count': len(sessions),
        'average_efficiency': avg_efficiency
    }


def calculate_productivity_trends(sessions):
    """Calculate productivity trends over the session period"""
    if not sessions:
        return {'trend': 'stable', 'change_percentage': 0}
    
    # Sort sessions by date
    sorted_sessions = sorted(sessions, key=lambda s: s['timestamp'])
    midpoint = len(sorted_sessions) // 2
    
    first_half = sorted_sessions[:midpoint] if midpoint > 0 else []
    second_half = sorted_sessions[midpoint:] if midpoint < len(sorted_sessions) else sorted_sessions
    
    if not first_half or not second_half:
        return {'trend': 'stable', 'change_percentage': 0}
    
    first_half_efficiency = sum(s.get('efficiency', 100) for s in first_half) / len(first_half)
    second_half_efficiency = sum(s.get('efficiency', 100) for s in second_half) / len(second_half)
    
    change = second_half_efficiency - first_half_efficiency
    change_percentage = round((change / first_half_efficiency) * 100, 1) if first_half_efficiency > 0 else 0
    
    trend = 'improving' if change > 5 else 'declining' if change < -5 else 'stable'
    
    return {
        'trend': trend,
        'change_percentage': change_percentage
    }


def get_course_time_distribution(sessions):
    """Get time distribution by course"""
    course_times = {}
    
    for session in sessions:
        course_id = session.get('courseId', 'unknown')
        course_name = session.get('courseName', 'Unknown Course')
        
        if course_id not in course_times:
            course_times[course_id] = {
                'course_name': course_name,
                'total_minutes': 0,
                'percentage': 0
            }
        
        # Add time based on session type
        if session.get('sessionType') == 'slide_reading':
            time_to_add = session.get('activeReadingTime', 0) / 60
        else:
            time_to_add = session.get('activeTime', 0)
        
        course_times[course_id]['total_minutes'] += time_to_add
    
    # Calculate percentages
    total_time = sum(c['total_minutes'] for c in course_times.values())
    if total_time > 0:
        for course_data in course_times.values():
            course_data['percentage'] = round((course_data['total_minutes'] / total_time) * 100, 1)
            course_data['total_minutes'] = round(course_data['total_minutes'], 1)
    
    return list(course_times.values())


def get_efficiency_trends(sessions):
    """Get efficiency trends over time"""
    if not sessions:
        return []
    
    # Group by day and calculate daily efficiency
    daily_efficiency = {}
    
    for session in sessions:
        date_key = session['timestamp'].date().isoformat()
        efficiency = session.get('efficiency', 100)
        
        if date_key not in daily_efficiency:
            daily_efficiency[date_key] = []
        
        daily_efficiency[date_key].append(efficiency)
    
    # Calculate average efficiency per day
    trend_data = []
    for date, efficiencies in daily_efficiency.items():
        avg_efficiency = round(sum(efficiencies) / len(efficiencies), 1)
        trend_data.append({
            'date': date,
            'efficiency': avg_efficiency,
            'session_count': len(efficiencies)
        })
    
    return sorted(trend_data, key=lambda x: x['date'])
