"""
Unified dashboard analytics service for EduMaster application.
This module consolidates data from reading sessions and general study sessions
to provide comprehensive analytics for dashboard visualization.
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import study_sessions_collection, files_collection, users_collection
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

def register_unified_analytics_routes(app):
    """Register unified analytics routes with the Flask app"""
    
    @app.route('/unified-dashboard-data/<user_id>', methods=['GET'])
    def get_unified_dashboard_data(user_id):
        """Get comprehensive dashboard data combining all activity types"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            days = int(request.args.get('days', 30))
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Get all study sessions within date range
            all_sessions = list(study_sessions_collection.find({
                'userId': {'$in': [user_id, user_object_id]},
                'timestamp': {'$gte': cutoff_date}
            }).sort('timestamp', -1))
            
            # Organize sessions by type
            session_types = {
                'slide_reading': [s for s in all_sessions if s.get('sessionType') == 'slide_reading'],
                'general_study': [s for s in all_sessions if s.get('sessionType') in ['general_study', None]],
                'quiz_taking': [s for s in all_sessions if s.get('sessionType') in ['quiz_taking', 'quiz']],
                'note_taking': [s for s in all_sessions if s.get('sessionType') == 'note_taking']
            }
            
            # Calculate unified metrics
            dashboard_data = {
                'overview': calculate_overview_metrics(all_sessions),
                'activity_breakdown': calculate_activity_breakdown(session_types),
                'productivity_insights': calculate_productivity_insights(all_sessions),
                'time_distribution': calculate_time_distribution(all_sessions),
                'real_time_status': get_real_time_status(user_id, user_object_id),
                'weekly_trends': calculate_weekly_trends(all_sessions),
                'course_performance': calculate_course_performance(all_sessions),
                'goals_progress': calculate_goals_progress(all_sessions)
            }
            
            return jsonify({
                'status': 'success',
                'dashboard_data': dashboard_data,
                'metadata': {
                    'date_range_days': days,
                    'total_sessions': len(all_sessions),
                    'last_updated': datetime.now().isoformat()
                }
            })

        except Exception as e:
            logger.error(f"Error getting unified dashboard data: {str(e)}")
            return jsonify({'error': 'Error retrieving unified dashboard data'}), 500

    @app.route('/activity-analytics/<user_id>', methods=['GET'])
    def get_activity_analytics(user_id):
        """Get detailed analytics for specific activity types"""
        try:
            # Convert user_id to appropriate format
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
            except:
                user_object_id = user_id

            activity_type = request.args.get('type', 'all')  # 'reading', 'study', 'quiz', 'all'
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
                
            if activity_type != 'all':
                type_mapping = {
                    'reading': 'slide_reading',
                    'study': 'general_study',
                    'quiz': ['quiz_taking', 'quiz']
                }
                activity_type_value = type_mapping.get(activity_type, activity_type)
                if isinstance(activity_type_value, list):
                    base_query['sessionType'] = {'$in': activity_type_value}
                else:
                    base_query['sessionType'] = activity_type_value
            
            sessions = list(study_sessions_collection.find(base_query).sort('timestamp', -1))
            
            # Calculate detailed analytics based on activity type
            analytics = {
                'session_count': len(sessions),
                'total_time_analysis': get_detailed_time_analysis(sessions),
                'efficiency_analysis': get_efficiency_analysis(sessions),
                'pattern_analysis': get_pattern_analysis(sessions),
                'comparative_metrics': get_comparative_metrics(sessions, activity_type)
            }
            
            # Add activity-specific metrics
            if activity_type == 'reading':
                analytics['reading_specific'] = get_reading_specific_metrics(sessions)
            elif activity_type == 'quiz':
                analytics['quiz_specific'] = get_quiz_specific_metrics(sessions)
            
            return jsonify({
                'status': 'success',
                'activity_analytics': analytics,
                'filters': {
                    'activity_type': activity_type,
                    'days': days,
                    'course_id': course_id
                }
            })

        except Exception as e:
            logger.error(f"Error getting activity analytics: {str(e)}")
            return jsonify({'error': 'Error retrieving activity analytics'}), 500

    logger.info("Unified analytics routes registered successfully")


def calculate_overview_metrics(sessions):
    """Calculate high-level overview metrics for dashboard"""
    if not sessions:
        return {
            'total_study_hours': 0,
            'sessions_this_week': 0,
            'average_efficiency': 0,
            'study_streak_days': 0,
            'weekly_goal_progress': 0
        }
    
    # Calculate total time across all activity types
    total_time_seconds = 0
    for session in sessions:
        if session.get('sessionType') == 'slide_reading':
            total_time_seconds += session.get('activeReadingTime', 0)
        else:
            total_time_seconds += (session.get('activeTime', 0) * 60)  # Convert minutes to seconds
    
    total_hours = round(total_time_seconds / 3600, 1)
    
    # Sessions this week
    week_start = datetime.now() - timedelta(days=7)
    sessions_this_week = len([s for s in sessions if s['timestamp'] >= week_start])
    
    # Average efficiency
    efficiencies = [s.get('efficiency', 100) for s in sessions]
    avg_efficiency = round(sum(efficiencies) / len(efficiencies), 1) if efficiencies else 0
    
    # Study streak
    session_dates = sorted(set(s['timestamp'].date() for s in sessions), reverse=True)
    study_streak = calculate_consecutive_days(session_dates)
    
    # Weekly goal progress (10 hours target)
    weekly_target_hours = 10
    last_week_sessions = [s for s in sessions if s['timestamp'] >= week_start]
    last_week_hours = 0
    for session in last_week_sessions:
        if session.get('sessionType') == 'slide_reading':
            last_week_hours += session.get('activeReadingTime', 0) / 3600
        else:
            last_week_hours += (session.get('activeTime', 0) / 60)
    
    weekly_goal_progress = round((last_week_hours / weekly_target_hours) * 100, 1)
    
    return {
        'total_study_hours': total_hours,
        'sessions_this_week': sessions_this_week,
        'average_efficiency': avg_efficiency,
        'study_streak_days': study_streak,
        'weekly_goal_progress': min(weekly_goal_progress, 100)
    }


def calculate_activity_breakdown(session_types):
    """Calculate breakdown by activity type"""
    breakdown = {}
    
    for activity_type, sessions in session_types.items():
        if not sessions:
            breakdown[activity_type] = {
                'session_count': 0,
                'total_time_minutes': 0,
                'average_efficiency': 0,
                'percentage_of_total': 0
            }
            continue
        
        # Calculate time based on session type
        if activity_type == 'slide_reading':
            total_time = sum(s.get('activeReadingTime', 0) for s in sessions) / 60  # Convert to minutes
        else:
            total_time = sum(s.get('activeTime', 0) for s in sessions)
        
        efficiencies = [s.get('efficiency', 100) for s in sessions]
        avg_efficiency = round(sum(efficiencies) / len(efficiencies), 1) if efficiencies else 0
        
        breakdown[activity_type] = {
            'session_count': len(sessions),
            'total_time_minutes': round(total_time, 1),
            'average_efficiency': avg_efficiency,
            'percentage_of_total': 0  # Will be calculated after all types are processed
        }
    
    # Calculate percentages
    total_time_all = sum(data['total_time_minutes'] for data in breakdown.values())
    if total_time_all > 0:
        for data in breakdown.values():
            data['percentage_of_total'] = round((data['total_time_minutes'] / total_time_all) * 100, 1)
    
    return breakdown


def calculate_productivity_insights(sessions):
    """Calculate productivity insights and trends"""
    if not sessions:
        return {
            'best_productivity_hour': 'N/A',
            'efficiency_trend': 'stable',
            'most_productive_day': 'N/A',
            'focus_score': 0,
            'distraction_frequency': 0
        }
    
    # Find best productivity hour
    hourly_data = {}
    for session in sessions:
        hour = session['timestamp'].hour
        if hour not in hourly_data:
            hourly_data[hour] = {'efficiency_sum': 0, 'count': 0}
        hourly_data[hour]['efficiency_sum'] += session.get('efficiency', 100)
        hourly_data[hour]['count'] += 1
    
    best_hour = 'N/A'
    if hourly_data:
        avg_hourly_efficiency = {
            hour: data['efficiency_sum'] / data['count']
            for hour, data in hourly_data.items()
        }
        best_hour_num = max(avg_hourly_efficiency, key=avg_hourly_efficiency.get)
        best_hour = f"{best_hour_num:02d}:00"
    
    # Calculate efficiency trend
    if len(sessions) >= 4:
        midpoint = len(sessions) // 2
        recent_sessions = sessions[:midpoint]
        older_sessions = sessions[midpoint:]
        
        recent_avg = sum(s.get('efficiency', 100) for s in recent_sessions) / len(recent_sessions)
        older_avg = sum(s.get('efficiency', 100) for s in older_sessions) / len(older_sessions)
        
        diff = recent_avg - older_avg
        if diff > 5:
            efficiency_trend = 'improving'
        elif diff < -5:
            efficiency_trend = 'declining'
        else:
            efficiency_trend = 'stable'
    else:
        efficiency_trend = 'insufficient_data'
    
    # Most productive day of week
    daily_data = {}
    for session in sessions:
        day = session['timestamp'].strftime('%A')
        if day not in daily_data:
            daily_data[day] = {'efficiency_sum': 0, 'count': 0}
        daily_data[day]['efficiency_sum'] += session.get('efficiency', 100)
        daily_data[day]['count'] += 1
    
    most_productive_day = 'N/A'
    if daily_data:
        avg_daily_efficiency = {
            day: data['efficiency_sum'] / data['count']
            for day, data in daily_data.items()
        }
        most_productive_day = max(avg_daily_efficiency, key=avg_daily_efficiency.get)
    
    # Calculate focus score and distraction frequency
    focus_scores = [s.get('sessionMetrics', {}).get('focusScore', 100) for s in sessions]
    avg_focus_score = round(sum(focus_scores) / len(focus_scores), 1) if focus_scores else 0
    
    distraction_counts = [s.get('sessionMetrics', {}).get('distractionCount', 0) for s in sessions]
    avg_distraction_frequency = round(sum(distraction_counts) / len(distraction_counts), 1) if distraction_counts else 0
    
    return {
        'best_productivity_hour': best_hour,
        'efficiency_trend': efficiency_trend,
        'most_productive_day': most_productive_day,
        'focus_score': avg_focus_score,
        'distraction_frequency': avg_distraction_frequency
    }


def calculate_time_distribution(sessions):
    """Calculate time distribution across courses and activities"""
    course_distribution = {}
    daily_distribution = {}
    
    for session in sessions:
        course_id = session.get('courseId', 'unknown')
        course_name = session.get('courseName', 'Unknown Course')
        date_key = session['timestamp'].date().isoformat()
        
        # Calculate session time based on type
        if session.get('sessionType') == 'slide_reading':
            session_time = session.get('activeReadingTime', 0) / 60  # Convert to minutes
        else:
            session_time = session.get('activeTime', 0)
        
        # Course distribution
        if course_id not in course_distribution:
            course_distribution[course_id] = {
                'course_name': course_name,
                'total_time_minutes': 0,
                'session_count': 0,
                'activities': {
                    'slide_reading': {'time': 0, 'sessions': 0},
                    'general_study': {'time': 0, 'sessions': 0},
                    'quiz_taking': {'time': 0, 'sessions': 0}
                }
            }
        
        course_distribution[course_id]['total_time_minutes'] += session_time
        course_distribution[course_id]['session_count'] += 1
        
        activity_type = session.get('sessionType', 'general_study')
        # Map quiz sessionType to quiz_taking for consistency
        if activity_type == 'quiz':
            activity_type = 'quiz_taking'
        if activity_type in course_distribution[course_id]['activities']:
            course_distribution[course_id]['activities'][activity_type]['time'] += session_time
            course_distribution[course_id]['activities'][activity_type]['sessions'] += 1
        
        # Daily distribution
        if date_key not in daily_distribution:
            daily_distribution[date_key] = {
                'date': date_key,
                'total_time_minutes': 0,
                'activities': {
                    'slide_reading': 0,
                    'general_study': 0,
                    'quiz_taking': 0
                }
            }
        
        daily_distribution[date_key]['total_time_minutes'] += session_time
        activity_type = session.get('sessionType', 'general_study')
        # Map quiz sessionType to quiz_taking for consistency
        if activity_type == 'quiz':
            activity_type = 'quiz_taking'
        if activity_type in daily_distribution[date_key]['activities']:
            daily_distribution[date_key]['activities'][activity_type] += session_time
    
    # Convert to lists and sort
    course_list = list(course_distribution.values())
    daily_list = sorted(daily_distribution.values(), key=lambda x: x['date'])
    
    return {
        'by_course': course_list,
        'by_day': daily_list
    }


def get_real_time_status(user_id, user_object_id):
    """Get current real-time study status"""
    try:
        # Find active sessions (within last 30 minutes)
        recent_cutoff = datetime.now() - timedelta(minutes=30)
        
        active_sessions = list(study_sessions_collection.find({
            'userId': {'$in': [user_id, user_object_id]},
            'status': 'active',
            'lastActivity': {'$gte': recent_cutoff}
        }).sort('lastActivity', -1))
        
        # Get today's totals
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_sessions = list(study_sessions_collection.find({
            'userId': {'$in': [user_id, user_object_id]},
            'timestamp': {'$gte': today_start}
        }))
        
        # Calculate today's time by activity
        todays_breakdown = {'slide_reading': 0, 'general_study': 0, 'quiz_taking': 0}
        for session in today_sessions:
            session_type = session.get('sessionType', 'general_study')
            if session_type == 'slide_reading':
                time_minutes = session.get('activeReadingTime', 0) / 60
            else:
                time_minutes = session.get('activeTime', 0)
            
            # Map quiz sessionType to quiz_taking for consistency
            if session_type == 'quiz':
                session_type = 'quiz_taking'
                
            if session_type in todays_breakdown:
                todays_breakdown[session_type] += time_minutes
        
        return {
            'has_active_session': len(active_sessions) > 0,
            'active_session_count': len(active_sessions),
            'current_sessions': [format_active_session(s) for s in active_sessions],
            'todays_totals': {
                'total_minutes': sum(todays_breakdown.values()),
                'by_activity': todays_breakdown
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting real-time status: {str(e)}")
        return {'has_active_session': False, 'error': str(e)}


def calculate_weekly_trends(sessions):
    """Calculate weekly trends for visualization"""
    if not sessions:
        return {'weeks': [], 'trend_direction': 'stable'}
    
    # Group sessions by week
    weekly_data = {}
    for session in sessions:
        # Get start of week (Monday)
        session_date = session['timestamp'].date()
        week_start = session_date - timedelta(days=session_date.weekday())
        week_key = week_start.isoformat()
        
        if week_key not in weekly_data:
            weekly_data[week_key] = {
                'week_start': week_key,
                'total_time_minutes': 0,
                'session_count': 0,
                'efficiency_scores': []
            }
        
        # Add time based on session type
        if session.get('sessionType') == 'slide_reading':
            time_minutes = session.get('activeReadingTime', 0) / 60
        else:
            time_minutes = session.get('activeTime', 0)
        
        weekly_data[week_key]['total_time_minutes'] += time_minutes
        weekly_data[week_key]['session_count'] += 1
        weekly_data[week_key]['efficiency_scores'].append(session.get('efficiency', 100))
    
    # Convert to list and sort by week
    weeks_list = []
    for week_data in weekly_data.values():
        avg_efficiency = sum(week_data['efficiency_scores']) / len(week_data['efficiency_scores'])
        weeks_list.append({
            'week_start': week_data['week_start'],
            'total_time_minutes': round(week_data['total_time_minutes'], 1),
            'session_count': week_data['session_count'],
            'average_efficiency': round(avg_efficiency, 1)
        })
    
    weeks_list.sort(key=lambda x: x['week_start'])
    
    # Determine trend direction
    trend_direction = 'stable'
    if len(weeks_list) >= 2:
        recent_avg = sum(w['average_efficiency'] for w in weeks_list[-2:]) / 2
        older_avg = sum(w['average_efficiency'] for w in weeks_list[:-2]) / max(len(weeks_list) - 2, 1)
        
        if recent_avg > older_avg + 5:
            trend_direction = 'improving'
        elif recent_avg < older_avg - 5:
            trend_direction = 'declining'
    
    return {
        'weeks': weeks_list,
        'trend_direction': trend_direction
    }


def calculate_course_performance(sessions):
    """Calculate performance metrics by course"""
    course_data = {}
    
    for session in sessions:
        course_id = session.get('courseId', 'unknown')
        course_name = session.get('courseName', 'Unknown Course')
        
        if course_id not in course_data:
            course_data[course_id] = {
                'course_name': course_name,
                'total_time_minutes': 0,
                'session_count': 0,
                'efficiency_scores': [],
                'satisfaction_scores': [],
                'last_studied': None
            }
        
        # Add time based on session type
        if session.get('sessionType') == 'slide_reading':
            time_minutes = session.get('activeReadingTime', 0) / 60
        else:
            time_minutes = session.get('activeTime', 0)
        
        course_data[course_id]['total_time_minutes'] += time_minutes
        course_data[course_id]['session_count'] += 1
        course_data[course_id]['efficiency_scores'].append(session.get('efficiency', 100))
        course_data[course_id]['satisfaction_scores'].append(session.get('satisfaction', 5))
        
        # Update last studied date
        session_date = session['timestamp']
        if (course_data[course_id]['last_studied'] is None or 
            session_date > course_data[course_id]['last_studied']):
            course_data[course_id]['last_studied'] = session_date
    
    # Calculate averages and format output
    performance_list = []
    for course_id, data in course_data.items():
        avg_efficiency = sum(data['efficiency_scores']) / len(data['efficiency_scores'])
        avg_satisfaction = sum(data['satisfaction_scores']) / len(data['satisfaction_scores'])
        
        performance_list.append({
            'course_id': course_id,
            'course_name': data['course_name'],
            'total_time_minutes': round(data['total_time_minutes'], 1),
            'session_count': data['session_count'],
            'average_efficiency': round(avg_efficiency, 1),
            'average_satisfaction': round(avg_satisfaction, 1),
            'last_studied': data['last_studied'].isoformat() if data['last_studied'] else None
        })
    
    # Sort by total time (most studied first)
    performance_list.sort(key=lambda x: x['total_time_minutes'], reverse=True)
    
    return performance_list


def calculate_goals_progress(sessions):
    """Calculate progress toward study goals"""
    # Weekly goal: 10 hours
    # Monthly goal: 40 hours
    # Consistency goal: 5 days per week
    
    now = datetime.now()
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)
    
    # Weekly progress
    weekly_sessions = [s for s in sessions if s['timestamp'] >= week_start]
    weekly_time_hours = 0
    for session in weekly_sessions:
        if session.get('sessionType') == 'slide_reading':
            weekly_time_hours += session.get('activeReadingTime', 0) / 3600
        else:
            weekly_time_hours += session.get('activeTime', 0) / 60
    
    weekly_goal_progress = min((weekly_time_hours / 10) * 100, 100)
    
    # Monthly progress
    monthly_sessions = [s for s in sessions if s['timestamp'] >= month_start]
    monthly_time_hours = 0
    for session in monthly_sessions:
        if session.get('sessionType') == 'slide_reading':
            monthly_time_hours += session.get('activeReadingTime', 0) / 3600
        else:
            monthly_time_hours += session.get('activeTime', 0) / 60
    
    monthly_goal_progress = min((monthly_time_hours / 40) * 100, 100)
    
    # Consistency progress (days studied this week)
    weekly_dates = set(s['timestamp'].date() for s in weekly_sessions)
    consistency_progress = min((len(weekly_dates) / 5) * 100, 100)
    
    return {
        'weekly': {
            'target_hours': 10,
            'current_hours': round(weekly_time_hours, 1),
            'progress_percentage': round(weekly_goal_progress, 1)
        },
        'monthly': {
            'target_hours': 40,
            'current_hours': round(monthly_time_hours, 1),
            'progress_percentage': round(monthly_goal_progress, 1)
        },
        'consistency': {
            'target_days_per_week': 5,
            'current_days_this_week': len(weekly_dates),
            'progress_percentage': round(consistency_progress, 1)
        }
    }


def get_detailed_time_analysis(sessions):
    """Get detailed time analysis for sessions"""
    if not sessions:
        return {'total_minutes': 0, 'active_minutes': 0, 'efficiency_breakdown': {}}
    
    total_time = 0
    active_time = 0
    
    for session in sessions:
        if session.get('sessionType') == 'slide_reading':
            session_time = session.get('activeReadingTime', 0) / 60
            active_time += session_time
        else:
            session_time = session.get('activeTime', 0)
            active_time += session_time
        total_time += session.get('totalDuration', session_time)
    
    # Efficiency breakdown
    efficiency_ranges = {'excellent': 0, 'good': 0, 'fair': 0, 'poor': 0}
    for session in sessions:
        efficiency = session.get('efficiency', 100)
        if efficiency >= 90:
            efficiency_ranges['excellent'] += 1
        elif efficiency >= 75:
            efficiency_ranges['good'] += 1
        elif efficiency >= 60:
            efficiency_ranges['fair'] += 1
        else:
            efficiency_ranges['poor'] += 1
    
    return {
        'total_minutes': round(total_time, 1),
        'active_minutes': round(active_time, 1),
        'efficiency_breakdown': efficiency_ranges
    }


def get_efficiency_analysis(sessions):
    """Get detailed efficiency analysis"""
    if not sessions:
        return {'average': 0, 'trend': 'stable', 'best_session': None}
    
    efficiencies = [s.get('efficiency', 100) for s in sessions]
    avg_efficiency = round(sum(efficiencies) / len(efficiencies), 1)
    
    # Find best session
    best_session = max(sessions, key=lambda s: s.get('efficiency', 0))
    best_session_info = {
        'efficiency': best_session.get('efficiency', 0),
        'course_name': best_session.get('courseName', 'Unknown'),
        'date': best_session['timestamp'].date().isoformat()
    } if best_session else None
    
    return {
        'average': avg_efficiency,
        'trend': 'improving' if len(efficiencies) > 1 and efficiencies[0] > efficiencies[-1] else 'stable',
        'best_session': best_session_info
    }


def get_pattern_analysis(sessions):
    """Analyze study patterns and habits"""
    if not sessions:
        return {}
    
    # Time of day patterns
    hour_distribution = {}
    for session in sessions:
        hour = session['timestamp'].hour
        hour_distribution[hour] = hour_distribution.get(hour, 0) + 1
    
    # Day of week patterns
    day_distribution = {}
    for session in sessions:
        day = session['timestamp'].strftime('%A')
        day_distribution[day] = day_distribution.get(day, 0) + 1
    
    # Session length patterns
    length_distribution = {'short': 0, 'medium': 0, 'long': 0}
    for session in sessions:
        if session.get('sessionType') == 'slide_reading':
            time_minutes = session.get('activeReadingTime', 0) / 60
        else:
            time_minutes = session.get('activeTime', 0)
        
        if time_minutes < 30:
            length_distribution['short'] += 1
        elif time_minutes < 90:
            length_distribution['medium'] += 1
        else:
            length_distribution['long'] += 1
    
    return {
        'time_of_day': hour_distribution,
        'day_of_week': day_distribution,
        'session_lengths': length_distribution
    }


def get_comparative_metrics(sessions, activity_type):
    """Get comparative metrics for the specified activity type"""
    if not sessions:
        return {}
    
    # Compare with user's overall performance
    all_user_sessions = list(study_sessions_collection.find({
        'userId': sessions[0]['userId']
    }).sort('timestamp', -1).limit(100))
    
    # Calculate activity-specific vs overall metrics
    activity_avg_efficiency = sum(s.get('efficiency', 100) for s in sessions) / len(sessions)
    overall_avg_efficiency = sum(s.get('efficiency', 100) for s in all_user_sessions) / len(all_user_sessions) if all_user_sessions else 0
    
    return {
        'efficiency_vs_overall': {
            'activity_average': round(activity_avg_efficiency, 1),
            'overall_average': round(overall_avg_efficiency, 1),
            'difference': round(activity_avg_efficiency - overall_avg_efficiency, 1)
        }
    }


def get_reading_specific_metrics(sessions):
    """Get reading-specific metrics for slide reading sessions"""
    reading_sessions = [s for s in sessions if s.get('sessionType') == 'slide_reading']
    
    if not reading_sessions:
        return {}
    
    # Reading speed analysis
    reading_speeds = [s.get('readingSpeed', 0) for s in reading_sessions if s.get('readingSpeed', 0) > 0]
    avg_reading_speed = round(sum(reading_speeds) / len(reading_speeds), 0) if reading_speeds else 0
    
    # Comprehension analysis
    comprehension_scores = [s.get('comprehensionScore', 0) for s in reading_sessions if s.get('comprehensionScore', 0) > 0]
    avg_comprehension = round(sum(comprehension_scores) / len(comprehension_scores), 1) if comprehension_scores else 0
    
    # File completion analysis
    files_started = len(set((s.get('courseId'), s.get('filename')) for s in reading_sessions))
    files_completed = len([s for s in reading_sessions if s.get('readingProgress', 0) >= 100])
    
    return {
        'average_reading_speed_wpm': avg_reading_speed,
        'average_comprehension_score': avg_comprehension,
        'files_started': files_started,
        'files_completed': files_completed,
        'completion_rate': round((files_completed / files_started * 100), 1) if files_started > 0 else 0
    }


def get_quiz_specific_metrics(sessions):
    """Get quiz-specific metrics for quiz sessions"""
    quiz_sessions = [s for s in sessions if s.get('sessionType') in ['quiz_taking', 'quiz']]
    
    if not quiz_sessions:
        return {}
    
    # Extract quiz performance data
    total_scores = []
    total_percentages = []
    total_questions = []
    correct_answers = []
    quiz_types = []
    
    for session in quiz_sessions:
        quiz_data = session.get('quizData', {})
        if quiz_data:
            if 'score' in quiz_data:
                total_scores.append(quiz_data['score'])
            if 'percentage' in quiz_data:
                total_percentages.append(quiz_data['percentage'])
            if 'totalQuestions' in quiz_data:
                total_questions.append(quiz_data['totalQuestions'])
            if 'correctAnswers' in quiz_data:
                correct_answers.append(quiz_data['correctAnswers'])
            if 'quizType' in quiz_data:
                quiz_types.append(quiz_data['quizType'])
    
    # Calculate averages
    avg_score = round(sum(total_scores) / len(total_scores), 1) if total_scores else 0
    avg_percentage = round(sum(total_percentages) / len(total_percentages), 1) if total_percentages else 0
    avg_questions_per_quiz = round(sum(total_questions) / len(total_questions), 0) if total_questions else 0
    avg_correct_answers = round(sum(correct_answers) / len(correct_answers), 1) if correct_answers else 0
    
    # Quiz type distribution
    quiz_type_counts = {}
    for quiz_type in quiz_types:
        quiz_type_counts[quiz_type] = quiz_type_counts.get(quiz_type, 0) + 1
    
    # Calculate accuracy rate
    total_questions_all = sum(total_questions)
    total_correct_all = sum(correct_answers)
    overall_accuracy = round((total_correct_all / total_questions_all * 100), 1) if total_questions_all > 0 else 0
    
    # Time analysis
    time_per_quiz = round(sum(s.get('activeTime', 0) for s in quiz_sessions) / len(quiz_sessions), 1)
    
    return {
        'total_quizzes': len(quiz_sessions),
        'average_score': avg_score,
        'average_percentage': avg_percentage,
        'overall_accuracy': overall_accuracy,
        'average_questions_per_quiz': avg_questions_per_quiz,
        'average_correct_answers': avg_correct_answers,
        'time_per_quiz': time_per_quiz,
        'quiz_type_distribution': quiz_type_counts
    }


def format_active_session(session):
    """Format active session data for real-time display"""
    now = datetime.now()
    start_time = session.get('startTime', session.get('timestamp', now))
    current_duration = (now - start_time).total_seconds() / 60  # in minutes
    
    return {
        'session_id': str(session['_id']),
        'session_type': session.get('sessionType', 'general_study'),
        'course_name': session.get('courseName', 'Unknown'),
        'filename': session.get('filename'),
        'current_duration_minutes': round(current_duration, 1),
        'reading_progress': session.get('readingProgress', 0),
        'current_efficiency': session.get('efficiency', 100),
        'last_activity': session.get('lastActivity', now).isoformat()
    }


def calculate_consecutive_days(date_list):
    """Calculate consecutive study days from a sorted list of dates"""
    if not date_list:
        return 0
    
    current_date = datetime.now().date()
    consecutive_days = 0
    
    for i, date in enumerate(date_list):
        if date == current_date - timedelta(days=i):
            consecutive_days += 1
        else:
            break
    
    return consecutive_days
