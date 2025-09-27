"""
Behavioral Analytics module for EduMaster application.
This module provides comprehensive behavioral analysis by integrating:
- Schedule activities and completion rates
- Study session tracking and efficiency
- Quiz performance patterns  
- Schedule adherence and procrastination metrics
"""

import logging
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

from database import (
    scheduled_activities_collection, 
    quiz_results_collection, 
    users_collection,
    schedules_collection
)
from utils import validate_input, log_user_action

logger = logging.getLogger(__name__)

def register_behavioral_analytics_routes(app):
    """Register behavioral analytics routes with the Flask app"""
    
    @app.route('/behavioral-analytics/<user_id>', methods=['GET'])
    def get_behavioral_analytics(user_id):
        """Get comprehensive behavioral analytics for academic prediction"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Get time range from query params
            days = int(request.args.get('days', 30))  # Default to last 30 days
            
            # Calculate comprehensive behavioral metrics
            analytics = calculate_comprehensive_behavioral_metrics(user_id, days)
            
            return jsonify({
                'status': 'success',
                'analytics': analytics,
                'period_days': days,
                'generated_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error retrieving behavioral analytics: {str(e)}")
            return jsonify({'error': 'Error retrieving behavioral analytics'}), 500

    @app.route('/behavioral-analytics/<user_id>/prediction', methods=['GET'])
    def get_academic_prediction(user_id):
        """Get academic performance prediction based on behavioral data"""
        try:
            # Validate user exists
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Get comprehensive analytics
            behavioral_data = calculate_comprehensive_behavioral_metrics(user_id, 30)
            
            # Calculate academic prediction
            prediction = calculate_enhanced_academic_prediction(behavioral_data)
            
            # Generate personalized recommendations
            recommendations = generate_behavioral_recommendations(behavioral_data)
            
            # Identify risk factors
            risks = identify_behavioral_risks(behavioral_data)
            
            return jsonify({
                'status': 'success',
                'prediction': prediction,
                'recommendations': recommendations,
                'risks': risks,
                'behavioral_data': behavioral_data,
                'generated_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error generating academic prediction: {str(e)}")
            return jsonify({'error': 'Error generating academic prediction'}), 500

    logger.info("Behavioral analytics routes registered successfully")

def calculate_comprehensive_behavioral_metrics(user_id, days_back=30):
    """Calculate comprehensive behavioral metrics from all data sources"""
    try:
        # Convert user_id for MongoDB queries
        try:
            user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
        except:
            user_object_id = user_id

        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        # 1. Get activity completion and scheduling patterns
        activity_metrics = get_activity_behavioral_metrics(user_id, user_object_id, cutoff_date)
        
        # 2. Get quiz performance patterns
        quiz_metrics = get_quiz_behavioral_metrics(user_id, user_object_id, cutoff_date)
        
        # 3. Get schedule adherence patterns
        schedule_metrics = get_schedule_behavioral_metrics(user_id, user_object_id, cutoff_date)
        
        # 4. Calculate derived behavioral insights
        behavioral_insights = calculate_behavioral_insights(activity_metrics, quiz_metrics, schedule_metrics)
        
        return {
            'activity_patterns': activity_metrics,
            'quiz_performance': quiz_metrics,
            'schedule_adherence': schedule_metrics,
            'behavioral_insights': behavioral_insights,
            'summary': {
                'study_hours_per_week': behavioral_insights.get('weekly_study_hours', 0),
                'schedule_following_rate': behavioral_insights.get('schedule_adherence_rate', 0),
                'task_completion_rate': behavioral_insights.get('task_completion_rate', 0),
                'procrastination_level': behavioral_insights.get('procrastination_score', 0),
                'focus_level': behavioral_insights.get('focus_efficiency', 0),
                'help_seeking_behavior': behavioral_insights.get('help_seeking_score', 0),
                'consistency_score': behavioral_insights.get('consistency_score', 0),
                'performance_trend': behavioral_insights.get('performance_trend', 'stable')
            }
        }
        
    except Exception as e:
        logger.error(f"Error calculating behavioral metrics: {str(e)}")
        return {}

def get_activity_behavioral_metrics(user_id, user_object_id, cutoff_date):
    """Analyze activity completion patterns and scheduling behavior"""
    try:
        # Get activities from the specified period
        activities = list(scheduled_activities_collection.find({
            'userId': {'$in': [user_id, user_object_id]},
            'created_at': {'$gte': cutoff_date}
        }))
        
        if not activities:
            return {
                'total_activities': 0,
                'completion_rate': 0,
                'average_duration': 0,
                'category_distribution': {},
                'priority_handling': {},
                'scheduling_patterns': {}
            }
        
        # Calculate completion metrics
        total_activities = len(activities)
        completed_activities = len([a for a in activities if a.get('status') == 'completed'])
        completion_rate = (completed_activities / total_activities * 100) if total_activities > 0 else 0
        
        # Calculate average study duration
        study_activities = [a for a in activities if a.get('category') in ['study', 'review', 'assignment']]
        total_study_duration = sum([a.get('duration', 60) for a in study_activities])
        average_duration = (total_study_duration / len(study_activities)) if study_activities else 0
        
        # Category distribution
        category_dist = {}
        for activity in activities:
            cat = activity.get('category', 'general')
            category_dist[cat] = category_dist.get(cat, 0) + 1
        
        # Priority handling analysis
        priority_handling = {}
        for priority in ['low', 'medium', 'high']:
            priority_activities = [a for a in activities if a.get('priority') == priority]
            if priority_activities:
                completed = len([a for a in priority_activities if a.get('status') == 'completed'])
                priority_handling[priority] = {
                    'total': len(priority_activities),
                    'completed': completed,
                    'completion_rate': (completed / len(priority_activities) * 100) if priority_activities else 0
                }
        
        # Scheduling patterns (when activities are typically scheduled)
        scheduling_patterns = {}
        for activity in activities:
            hour = 12  # Default hour if no time specified
            if activity.get('activityTime'):
                try:
                    hour = int(activity['activityTime'].split(':')[0])
                except:
                    hour = 12
            
            time_period = 'morning' if hour < 12 else 'afternoon' if hour < 17 else 'evening'
            scheduling_patterns[time_period] = scheduling_patterns.get(time_period, 0) + 1
        
        return {
            'total_activities': total_activities,
            'completion_rate': round(completion_rate, 1),
            'average_duration': round(average_duration, 1),
            'category_distribution': category_dist,
            'priority_handling': priority_handling,
            'scheduling_patterns': scheduling_patterns,
            'study_focus_score': calculate_study_focus_score(activities)
        }
        
    except Exception as e:
        logger.error(f"Error calculating activity metrics: {str(e)}")
        return {}

def get_quiz_behavioral_metrics(user_id, user_object_id, cutoff_date):
    """Analyze quiz-taking behavior and performance patterns"""
    try:
        # Get quiz results from the specified period
        quiz_results = list(quiz_results_collection.find({
            'userId': {'$in': [user_id, user_object_id]},
            'completed_at': {'$gte': cutoff_date}
        }).sort('completed_at', 1))
        
        if not quiz_results:
            return {
                'total_quizzes': 0,
                'average_score': 0,
                'performance_trend': 'no_data',
                'preparation_pattern': {},
                'difficulty_handling': {},
                'time_management': {}
            }
        
        # Performance trend analysis
        recent_quizzes = quiz_results[-5:] if len(quiz_results) >= 5 else quiz_results
        older_quizzes = quiz_results[:-5] if len(quiz_results) >= 10 else quiz_results[:len(quiz_results)//2]
        
        recent_avg = sum([q.get('percentage', 0) for q in recent_quizzes]) / len(recent_quizzes)
        older_avg = sum([q.get('percentage', 0) for q in older_quizzes]) / len(older_quizzes) if older_quizzes else recent_avg
        
        performance_trend = 'improving' if recent_avg > older_avg + 5 else \
                          'declining' if recent_avg < older_avg - 5 else 'stable'
        
        # Preparation patterns (time between quiz creation and completion)
        preparation_scores = []
        for quiz in quiz_results:
            # Analyze multiple attempts as indicator of preparation level
            attempts = quiz.get('attemptsUsed', 1)
            if attempts == 1:
                preparation_scores.append(100)  # Well prepared
            elif attempts == 2:
                preparation_scores.append(70)   # Moderately prepared
            else:
                preparation_scores.append(40)   # Poor preparation
        
        avg_preparation = sum(preparation_scores) / len(preparation_scores) if preparation_scores else 0
        
        # Difficulty handling analysis
        difficulty_performance = {}
        for difficulty in ['Easy', 'Medium', 'Hard']:
            diff_quizzes = [q for q in quiz_results if q.get('difficulty') == difficulty]
            if diff_quizzes:
                avg_score = sum([q.get('percentage', 0) for q in diff_quizzes]) / len(diff_quizzes)
                difficulty_performance[difficulty] = {
                    'count': len(diff_quizzes),
                    'average_score': round(avg_score, 1)
                }
        
        # Time management analysis
        time_scores = [q.get('timeSpent', 30) for q in quiz_results if q.get('timeSpent')]
        avg_time = sum(time_scores) / len(time_scores) if time_scores else 30
        
        return {
            'total_quizzes': len(quiz_results),
            'average_score': round(sum([q.get('percentage', 0) for q in quiz_results]) / len(quiz_results), 1),
            'performance_trend': performance_trend,
            'preparation_level': round(avg_preparation, 1),
            'difficulty_handling': difficulty_performance,
            'time_management': {
                'average_time_per_quiz': round(avg_time, 1),
                'efficiency_score': calculate_time_efficiency_score(quiz_results)
            },
            'consistency_score': calculate_quiz_consistency_score(quiz_results)
        }
        
    except Exception as e:
        logger.error(f"Error calculating quiz behavioral metrics: {str(e)}")
        return {}

def get_schedule_behavioral_metrics(user_id, user_object_id, cutoff_date):
    """Analyze schedule creation and adherence patterns"""
    try:
        # Get user schedules
        schedules = list(schedules_collection.find({
            'userId': {'$in': [user_id, user_object_id]},
            'created_at': {'$gte': cutoff_date}
        }))
        
        if not schedules:
            return {
                'total_schedules': 0,
                'schedule_updates': 0,
                'adherence_rate': 0,
                'planning_consistency': 0
            }
        
        # Calculate schedule creation patterns
        total_schedules = len(schedules)
        total_sessions = sum([len(s.get('schedule', [])) for s in schedules])
        
        # Get schedule activities for adherence calculation
        scheduled_sessions = []
        for schedule in schedules:
            for session in schedule.get('schedule', []):
                scheduled_sessions.append(session)
        
        # Calculate adherence by comparing with completed activities
        adherence_score = calculate_schedule_adherence(user_id, user_object_id, scheduled_sessions, cutoff_date)
        
        # Planning consistency (how often user updates/creates schedules)
        schedule_dates = [s.get('created_at', datetime.now()) for s in schedules]
        planning_consistency = calculate_planning_consistency(schedule_dates)
        
        return {
            'total_schedules': total_schedules,
            'total_planned_sessions': total_sessions,
            'schedule_updates': len([s for s in schedules if s.get('updated_at')]),
            'adherence_rate': round(adherence_score, 1),
            'planning_consistency': round(planning_consistency, 1),
            'average_sessions_per_schedule': round(total_sessions / total_schedules, 1) if total_schedules > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Error calculating schedule metrics: {str(e)}")
        return {}

def calculate_behavioral_insights(activity_metrics, quiz_metrics, schedule_metrics):
    """Calculate derived behavioral insights from all metrics"""
    try:
        # Weekly study hours calculation
        total_study_duration = activity_metrics.get('total_activities', 0) * activity_metrics.get('average_duration', 60)
        weekly_study_hours = round((total_study_duration / 60) / 4, 1)  # Convert to weekly hours
        
        # Schedule adherence rate
        schedule_adherence_rate = schedule_metrics.get('adherence_rate', 0)
        
        # Task completion rate (weighted average of activities and quiz preparation)
        activity_completion = activity_metrics.get('completion_rate', 0)
        quiz_preparation = quiz_metrics.get('preparation_level', 0)
        task_completion_rate = round((activity_completion * 0.6 + quiz_preparation * 0.4), 1)
        
        # Procrastination score (derived from multiple factors)
        procrastination_indicators = []
        
        # Low activity completion suggests procrastination
        if activity_completion < 70:
            procrastination_indicators.append(40)
        
        # Poor quiz preparation suggests procrastination
        if quiz_preparation < 60:
            procrastination_indicators.append(35)
        
        # Low schedule adherence suggests procrastination
        if schedule_adherence_rate < 60:
            procrastination_indicators.append(30)
        
        procrastination_score = sum(procrastination_indicators) / len(procrastination_indicators) if procrastination_indicators else 20
        
        # Focus efficiency (from quiz time management and activity patterns)
        quiz_efficiency = quiz_metrics.get('time_management', {}).get('efficiency_score', 70)
        activity_focus = activity_metrics.get('study_focus_score', 70)
        focus_efficiency = round((quiz_efficiency + activity_focus) / 2, 1)
        
        # Help seeking behavior (inferred from quiz attempts and activity patterns)
        avg_quiz_attempts = 1.5  # Default
        if quiz_metrics.get('total_quizzes', 0) > 0:
            # This would be calculated from actual quiz data
            avg_quiz_attempts = 1.3  # Placeholder - would calculate from quiz attempts
        
        help_seeking_score = min(100, max(0, (3 - avg_quiz_attempts) * 50))  # More attempts = less help seeking
        
        # Consistency score (combination of quiz and activity consistency)
        quiz_consistency = quiz_metrics.get('consistency_score', 0)
        activity_consistency = activity_metrics.get('completion_rate', 0)
        planning_consistency = schedule_metrics.get('planning_consistency', 0)
        
        consistency_score = round((quiz_consistency * 0.4 + activity_consistency * 0.4 + planning_consistency * 0.2), 1)
        
        # Performance trend analysis
        quiz_trend = quiz_metrics.get('performance_trend', 'stable')
        performance_trend = quiz_trend  # Could be enhanced with activity trends
        
        return {
            'weekly_study_hours': weekly_study_hours,
            'schedule_adherence_rate': schedule_adherence_rate,
            'task_completion_rate': task_completion_rate,
            'procrastination_score': round(procrastination_score, 1),
            'focus_efficiency': focus_efficiency,
            'help_seeking_score': round(help_seeking_score, 1),
            'consistency_score': consistency_score,
            'performance_trend': performance_trend,
            'study_pattern_analysis': analyze_study_patterns(activity_metrics, schedule_metrics),
            'behavioral_strengths': identify_behavioral_strengths(activity_metrics, quiz_metrics, schedule_metrics),
            'improvement_areas': identify_improvement_areas(activity_metrics, quiz_metrics, schedule_metrics)
        }
        
    except Exception as e:
        logger.error(f"Error calculating behavioral insights: {str(e)}")
        return {}

def calculate_study_focus_score(activities):
    """Calculate study focus score based on activity patterns"""
    try:
        study_activities = [a for a in activities if a.get('category') in ['study', 'review', 'assignment']]
        if not study_activities:
            return 70  # Default score
        
        # Analyze completion rates for study activities
        completed_study = len([a for a in study_activities if a.get('status') == 'completed'])
        focus_score = (completed_study / len(study_activities) * 100) if study_activities else 70
        
        # Boost score for consistent longer sessions
        long_sessions = len([a for a in study_activities if a.get('duration', 60) > 90])
        if long_sessions > len(study_activities) * 0.5:  # More than half are long sessions
            focus_score = min(100, focus_score + 10)
        
        return round(focus_score, 1)
        
    except Exception as e:
        logger.error(f"Error calculating study focus score: {str(e)}")
        return 70

def calculate_time_efficiency_score(quiz_results):
    """Calculate time efficiency score from quiz completion times"""
    try:
        if not quiz_results:
            return 70
        
        # Analyze time spent vs performance
        efficiency_scores = []
        for quiz in quiz_results:
            time_spent = quiz.get('timeSpent', 30)
            score = quiz.get('percentage', 0)
            # Good efficiency = high score with reasonable time
            efficiency = (score / time_spent) * 10  # Scale factor
            efficiency_scores.append(efficiency)
        
        avg_efficiency = sum(efficiency_scores) / len(efficiency_scores)
        # Normalize to 0-100 scale
        normalized_efficiency = min(100, avg_efficiency * 2)
        
        return round(normalized_efficiency, 1)
        
    except Exception as e:
        logger.error(f"Error calculating time efficiency: {str(e)}")
        return 70

def calculate_quiz_consistency_score(quiz_results):
    """Calculate consistency score based on quiz performance variance"""
    try:
        if len(quiz_results) < 2:
            return 70  # Default for insufficient data
        
        scores = [q.get('percentage', 0) for q in quiz_results]
        mean_score = sum(scores) / len(scores)
        
        # Calculate standard deviation
        variance = sum([(score - mean_score) ** 2 for score in scores]) / len(scores)
        std_dev = variance ** 0.5
        
        # Convert to consistency score (lower deviation = higher consistency)
        consistency = max(0, 100 - (std_dev * 2))
        
        return round(consistency, 1)
        
    except Exception as e:
        logger.error(f"Error calculating quiz consistency: {str(e)}")
        return 70

def calculate_schedule_adherence(user_id, user_object_id, scheduled_sessions, cutoff_date):
    """Calculate how well user adheres to their planned schedule"""
    try:
        if not scheduled_sessions:
            return 50  # Default adherence score
        
        # Get completed activities in the time period
        completed_activities = list(scheduled_activities_collection.find({
            'userId': {'$in': [user_id, user_object_id]},
            'status': 'completed',
            'completed_at': {'$gte': cutoff_date.isoformat()}
        }))
        
        # Compare scheduled sessions with completed activities
        # This is a simplified calculation - in a real implementation,
        # you'd match by time, course, and type
        total_scheduled = len(scheduled_sessions)
        total_completed = len(completed_activities)
        
        adherence_rate = min(100, (total_completed / total_scheduled * 100)) if total_scheduled > 0 else 50
        
        return adherence_rate
        
    except Exception as e:
        logger.error(f"Error calculating schedule adherence: {str(e)}")
        return 50

def calculate_planning_consistency(schedule_dates):
    """Calculate how consistently user creates and updates schedules"""
    try:
        if len(schedule_dates) < 2:
            return 50
        
        # Sort dates
        sorted_dates = sorted(schedule_dates)
        
        # Calculate gaps between schedule updates
        gaps = []
        for i in range(1, len(sorted_dates)):
            gap = (sorted_dates[i] - sorted_dates[i-1]).days
            gaps.append(gap)
        
        # Calculate consistency (smaller gaps = more consistent)
        avg_gap = sum(gaps) / len(gaps)
        
        # Convert to consistency score
        consistency = 100 - min(90, avg_gap * 10)  # Penalty for large gaps
        
        return max(10, consistency)
        
    except Exception as e:
        logger.error(f"Error calculating planning consistency: {str(e)}")
        return 50

def analyze_study_patterns(activity_metrics, schedule_metrics):
    """Analyze study patterns and preferences"""
    try:
        patterns = []
        
        # Time preference patterns
        scheduling_patterns = activity_metrics.get('scheduling_patterns', {})
        morning = scheduling_patterns.get('morning', 0)
        afternoon = scheduling_patterns.get('afternoon', 0)
        evening = scheduling_patterns.get('evening', 0)
        
        total_activities = morning + afternoon + evening
        if total_activities > 0:
            if morning > afternoon and morning > evening:
                patterns.append('Morning learner')
            elif evening > morning and evening > afternoon:
                patterns.append('Evening learner')
            elif afternoon > morning and afternoon > evening:
                patterns.append('Afternoon focused')
        
        # Session length preferences
        avg_duration = activity_metrics.get('average_duration', 60)
        if avg_duration > 120:
            patterns.append('Long session preference')
        elif avg_duration < 45:
            patterns.append('Short burst learner')
        
        # Completion patterns
        completion_rate = activity_metrics.get('completion_rate', 0)
        if completion_rate > 85:
            patterns.append('High achiever')
        elif completion_rate > 70:
            patterns.append('Consistent performer')
        
        return patterns
        
    except Exception as e:
        logger.error(f"Error analyzing study patterns: {str(e)}")
        return []

def identify_behavioral_strengths(activity_metrics, quiz_metrics, schedule_metrics):
    """Identify user's behavioral strengths"""
    strengths = []
    
    if activity_metrics.get('completion_rate', 0) > 80:
        strengths.append('High task completion rate')
    
    if quiz_metrics.get('average_score', 0) > 80:
        strengths.append('Strong academic performance')
    
    if quiz_metrics.get('preparation_level', 0) > 75:
        strengths.append('Good preparation habits')
    
    if schedule_metrics.get('adherence_rate', 0) > 75:
        strengths.append('Good schedule adherence')
    
    if quiz_metrics.get('consistency_score', 0) > 75:
        strengths.append('Consistent performance')
    
    return strengths

def identify_improvement_areas(activity_metrics, quiz_metrics, schedule_metrics):
    """Identify areas that need improvement"""
    improvements = []
    
    if activity_metrics.get('completion_rate', 0) < 60:
        improvements.append('Task completion needs work')
    
    if quiz_metrics.get('preparation_level', 0) < 60:
        improvements.append('Quiz preparation could be better')
    
    if schedule_metrics.get('adherence_rate', 0) < 60:
        improvements.append('Schedule following needs improvement')
    
    if quiz_metrics.get('consistency_score', 0) < 60:
        improvements.append('Performance consistency needs work')
    
    if quiz_metrics.get('performance_trend') == 'declining':
        improvements.append('Performance trending downward')
    
    return improvements

def calculate_enhanced_academic_prediction(behavioral_data):
    """Calculate enhanced academic prediction using real behavioral data"""
    try:
        insights = behavioral_data.get('behavioral_insights', {})
        quiz_data = behavioral_data.get('quiz_performance', {})
        activity_data = behavioral_data.get('activity_patterns', {})
        
        # Component scores (same weighting as original but using real data)
        study_score = min(15, (insights.get('weekly_study_hours', 0) / 30) * 15)
        schedule_score = (insights.get('schedule_adherence_rate', 0) / 100) * 15
        completion_score = (insights.get('task_completion_rate', 0) / 100) * 12
        procrastination_score = ((100 - insights.get('procrastination_score', 50)) / 100) * 10
        focus_score = (insights.get('focus_efficiency', 0) / 100) * 8
        
        behavioral_total = study_score + schedule_score + completion_score + procrastination_score + focus_score
        
        # Quiz performance scores (40% weight)
        average_quiz_score = (quiz_data.get('average_score', 0) / 100) * 15
        preparation_score = (quiz_data.get('preparation_level', 0) / 100) * 10
        consistency_score = (quiz_data.get('consistency_score', 0) / 100) * 8
        difficulty_score = calculate_difficulty_score(quiz_data) * 7 / 100
        
        quiz_total = average_quiz_score + preparation_score + consistency_score + difficulty_score
        total_score = behavioral_total + quiz_total
        
        # Enhanced confidence calculation
        data_points = (
            quiz_data.get('total_quizzes', 0) +
            activity_data.get('total_activities', 0) +
            behavioral_data.get('schedule_adherence', {}).get('total_schedules', 0)
        )
        confidence = min(95, 60 + data_points * 2)  # More data = higher confidence
        
        return {
            'performance_percentage': round(total_score),
            'gpa': round((total_score / 100) * 4, 2),
            'grade': 'A' if total_score >= 85 else 'B' if total_score >= 75 else 'C' if total_score >= 65 else 'D',
            'confidence': confidence,
            'behavioral_score': round(behavioral_total),
            'quiz_score': round(quiz_total),
            'breakdown': {
                'behavioral': round((behavioral_total / 60) * 100),
                'quiz_performance': round((quiz_total / 40) * 100)
            },
            'trend': insights.get('performance_trend', 'stable'),
            'data_quality': 'high' if data_points > 20 else 'medium' if data_points > 10 else 'low'
        }
        
    except Exception as e:
        logger.error(f"Error calculating academic prediction: {str(e)}")
        return {}

def calculate_difficulty_score(quiz_data):
    """Calculate difficulty handling score from quiz performance by difficulty"""
    try:
        difficulty_handling = quiz_data.get('difficulty_handling', {})
        
        if not difficulty_handling:
            return 70  # Default score
        
        # Weight different difficulties
        easy_score = difficulty_handling.get('Easy', {}).get('average_score', 80) * 0.2
        medium_score = difficulty_handling.get('Medium', {}).get('average_score', 70) * 0.5
        hard_score = difficulty_handling.get('Hard', {}).get('average_score', 60) * 0.3
        
        total_score = easy_score + medium_score + hard_score
        return min(100, total_score)
        
    except Exception as e:
        logger.error(f"Error calculating difficulty score: {str(e)}")
        return 70

def generate_behavioral_recommendations(behavioral_data):
    """Generate personalized recommendations based on actual behavioral data"""
    try:
        recommendations = []
        insights = behavioral_data.get('behavioral_insights', {})
        quiz_data = behavioral_data.get('quiz_performance', {})
        activity_data = behavioral_data.get('activity_patterns', {})
        
        # Study hours recommendations
        weekly_hours = insights.get('weekly_study_hours', 0)
        if weekly_hours < 15:
            recommendations.append({
                'title': 'Increase Study Time',
                'description': f'Currently studying {weekly_hours}h/week. Aim for 20-25h for better results.',
                'action_steps': [
                    'Schedule 2-3 additional study sessions per week',
                    'Use the activity tracker to monitor study time',
                    'Set daily study time goals'
                ],
                'impact': '+0.5 GPA points',
                'difficulty': 'Medium',
                'timeframe': '2-3 weeks',
                'category': 'Study Time'
            })
        
        # Completion rate recommendations
        completion_rate = insights.get('task_completion_rate', 0)
        if completion_rate < 70:
            recommendations.append({
                'title': 'Improve Task Completion',
                'description': f'Current completion rate: {completion_rate}%. Focus on finishing started tasks.',
                'action_steps': [
                    'Break large tasks into smaller, manageable pieces',
                    'Set specific deadlines for each task',
                    'Use the schedule feature to plan task completion'
                ],
                'impact': '+0.4 GPA points',
                'difficulty': 'Easy',
                'timeframe': '1-2 weeks',
                'category': 'Task Management'
            })
        
        # Procrastination recommendations
        procrastination = insights.get('procrastination_score', 0)
        if procrastination > 40:
            recommendations.append({
                'title': 'Reduce Procrastination',
                'description': f'Procrastination level: {procrastination}%. Use time management techniques.',
                'action_steps': [
                    'Use the 2-minute rule: do tasks immediately if they take <2 minutes',
                    'Schedule specific time blocks for different activities',
                    'Start with the most challenging task when energy is high'
                ],
                'impact': '+0.6 GPA points',
                'difficulty': 'Medium',
                'timeframe': '3-4 weeks',
                'category': 'Time Management'
            })
        
        # Quiz performance recommendations
        quiz_avg = quiz_data.get('average_score', 0)
        if quiz_avg < 75:
            recommendations.append({
                'title': 'Improve Quiz Performance',
                'description': f'Current quiz average: {quiz_avg}%. Focus on preparation and understanding.',
                'action_steps': [
                    'Review course material before each quiz',
                    'Take practice quizzes to identify weak areas',
                    'Allocate more time for difficult topics'
                ],
                'impact': '+0.5 GPA points',
                'difficulty': 'Medium',
                'timeframe': '2-3 weeks',
                'category': 'Academic Performance'
            })
        
        # Schedule adherence recommendations
        adherence = insights.get('schedule_adherence_rate', 0)
        if adherence < 65:
            recommendations.append({
                'title': 'Better Schedule Following',
                'description': f'Schedule adherence: {adherence}%. Stick to your planned study times.',
                'action_steps': [
                    'Create realistic schedules with achievable time blocks',
                    'Set reminders for scheduled study sessions',
                    'Review and adjust schedule weekly based on actual performance'
                ],
                'impact': '+0.3 GPA points',
                'difficulty': 'Easy',
                'timeframe': '1-2 weeks',
                'category': 'Schedule Management'
            })
        
        return recommendations[:4]  # Return top 4 recommendations
        
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        return []

def identify_behavioral_risks(behavioral_data):
    """Identify behavioral risk factors based on real data"""
    try:
        risks = []
        insights = behavioral_data.get('behavioral_insights', {})
        quiz_data = behavioral_data.get('quiz_performance', {})
        
        # High procrastination risk
        if insights.get('procrastination_score', 0) > 50:
            risks.append({
                'issue': 'High Procrastination Detected',
                'impact': 'May lead to missed deadlines and poor performance',
                'solution': 'Implement time-blocking and break tasks into smaller chunks',
                'priority': 'High',
                'category': 'Time Management'
            })
        
        # Declining performance risk
        if insights.get('performance_trend') == 'declining':
            risks.append({
                'issue': 'Declining Performance Trend',
                'impact': 'Academic performance is trending downward',
                'solution': 'Analyze recent changes in study habits and adjust accordingly',
                'priority': 'High',
                'category': 'Performance Trend'
            })
        
        # Low quiz performance risk
        if quiz_data.get('average_score', 0) < 65:
            risks.append({
                'issue': 'Low Quiz Performance',
                'impact': 'Indicates gaps in subject understanding',
                'solution': 'Increase preparation time and seek additional help',
                'priority': 'High',
                'category': 'Academic Performance'
            })
        
        # Poor schedule adherence risk
        if insights.get('schedule_adherence_rate', 0) < 50:
            risks.append({
                'issue': 'Poor Schedule Adherence',
                'impact': 'Inconsistent study patterns affecting learning',
                'solution': 'Create more realistic schedules and use reminders',
                'priority': 'Medium',
                'category': 'Schedule Management'
            })
        
        # Low study time risk
        if insights.get('weekly_study_hours', 0) < 10:
            risks.append({
                'issue': 'Insufficient Study Time',
                'impact': 'May not have enough time to master course material',
                'solution': 'Increase weekly study hours gradually',
                'priority': 'Medium',
                'category': 'Study Time'
            })
        
        return risks
        
    except Exception as e:
        logger.error(f"Error identifying risks: {str(e)}")
        return []
