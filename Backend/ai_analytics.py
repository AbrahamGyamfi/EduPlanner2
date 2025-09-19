"""
AI-Enhanced Analytics module for EduMaster application.
This module uses the Gemini API to provide intelligent analysis of behavioral data,
advanced pattern recognition, predictive insights, and personalized recommendations.
"""

import logging
import json
import os
from datetime import datetime, timedelta
from flask import request, jsonify
from bson import ObjectId

import google.generativeai as genai
from dotenv import load_dotenv

from database import (
    scheduled_activities_collection, 
    quiz_results_collection, 
    users_collection,
    schedules_collection
)
from behavioral_analytics import calculate_comprehensive_behavioral_metrics
from quiz_analytics import calculate_quiz_stats, get_subject_performance

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Gemini API
GEMINI_API_KEY = None
model = None

def initialize_ai_analytics():
    """Initialize the Gemini API for analytics enhancement."""
    global GEMINI_API_KEY, model
    
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not found for AI analytics!")
        raise ValueError("GEMINI_API_KEY environment variable is required")
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
    logger.info("AI Analytics module initialized successfully")

def register_ai_analytics_routes(app):
    """Register AI-enhanced analytics routes with the Flask app."""
    
    try:
        initialize_ai_analytics()
    except Exception as e:
        logger.error(f"Failed to initialize AI Analytics: {e}")
        return False

    @app.route('/ai-analytics/<user_id>/insights', methods=['GET'])
    def get_ai_insights(user_id):
        """Get AI-powered insights about user's learning behavior and performance."""
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
            days = int(request.args.get('days', 30))
            
            # Get comprehensive behavioral data
            behavioral_data = calculate_comprehensive_behavioral_metrics(user_id, days)
            quiz_stats = calculate_quiz_stats(user_id)
            subject_performance = get_subject_performance(user_id, days)
            
            # Generate AI insights
            ai_insights = generate_ai_insights(behavioral_data, quiz_stats, subject_performance, user_id)
            
            return jsonify({
                'status': 'success',
                'ai_insights': ai_insights,
                'period_days': days,
                'generated_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {str(e)}")
            return jsonify({'error': 'Error generating AI insights'}), 500

    @app.route('/ai-analytics/<user_id>/predictions', methods=['GET'])
    def get_ai_predictions(user_id):
        """Get AI-powered academic performance predictions."""
        try:
            # Validate user
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Get comprehensive data
            days = int(request.args.get('days', 30))
            behavioral_data = calculate_comprehensive_behavioral_metrics(user_id, days)
            quiz_stats = calculate_quiz_stats(user_id)
            
            # Generate AI predictions
            predictions = generate_ai_predictions(behavioral_data, quiz_stats, user_id)
            
            return jsonify({
                'status': 'success',
                'predictions': predictions,
                'generated_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error generating AI predictions: {str(e)}")
            return jsonify({'error': 'Error generating AI predictions'}), 500

    @app.route('/ai-analytics/<user_id>/study-strategy', methods=['GET'])
    def get_ai_study_strategy(user_id):
        """Generate personalized study strategy using AI analysis."""
        try:
            # Validate user
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Get data
            days = int(request.args.get('days', 30))
            goal = request.args.get('goal', 'improve_overall')  # improve_overall, increase_efficiency, reduce_stress
            
            behavioral_data = calculate_comprehensive_behavioral_metrics(user_id, days)
            quiz_stats = calculate_quiz_stats(user_id)
            subject_performance = get_subject_performance(user_id, days)
            
            # Generate personalized study strategy
            study_strategy = generate_ai_study_strategy(
                behavioral_data, quiz_stats, subject_performance, goal, user_id
            )
            
            return jsonify({
                'status': 'success',
                'study_strategy': study_strategy,
                'goal': goal,
                'generated_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error generating AI study strategy: {str(e)}")
            return jsonify({'error': 'Error generating AI study strategy'}), 500

    @app.route('/ai-analytics/<user_id>/pattern-analysis', methods=['GET'])
    def get_ai_pattern_analysis(user_id):
        """Get AI-powered pattern analysis of learning behavior."""
        try:
            # Validate user
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Get data
            days = int(request.args.get('days', 30))
            behavioral_data = calculate_comprehensive_behavioral_metrics(user_id, days)
            quiz_stats = calculate_quiz_stats(user_id)
            
            # Generate pattern analysis
            patterns = generate_ai_pattern_analysis(behavioral_data, quiz_stats, user_id)
            
            return jsonify({
                'status': 'success',
                'patterns': patterns,
                'period_days': days,
                'generated_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error generating AI pattern analysis: {str(e)}")
            return jsonify({'error': 'Error generating AI pattern analysis'}), 500

    @app.route('/ai-analytics/<user_id>/smart-recommendations', methods=['GET'])
    def get_smart_recommendations(user_id):
        """Get AI-powered smart recommendations for learning improvement."""
        try:
            # Validate user
            try:
                user_object_id = ObjectId(user_id) if isinstance(user_id, str) else user_id
                user = users_collection.find_one({"_id": user_object_id})
                if not user:
                    return jsonify({'error': 'User not found'}), 404
            except:
                return jsonify({'error': 'Invalid user ID format'}), 400

            # Get data
            days = int(request.args.get('days', 30))
            priority = request.args.get('priority', 'balanced')  # performance, efficiency, wellbeing, balanced
            
            behavioral_data = calculate_comprehensive_behavioral_metrics(user_id, days)
            quiz_stats = calculate_quiz_stats(user_id)
            subject_performance = get_subject_performance(user_id, days)
            
            # Generate smart recommendations
            recommendations = generate_smart_recommendations(
                behavioral_data, quiz_stats, subject_performance, priority, user_id
            )
            
            return jsonify({
                'status': 'success',
                'recommendations': recommendations,
                'priority_focus': priority,
                'generated_at': datetime.now().isoformat()
            })
            
        except Exception as e:
            logger.error(f"Error generating smart recommendations: {str(e)}")
            return jsonify({'error': 'Error generating smart recommendations'}), 500

    logger.info("AI Analytics routes registered successfully")
    return True

def generate_ai_insights(behavioral_data, quiz_stats, subject_performance, user_id):
    """Generate comprehensive AI insights about the user's learning patterns."""
    try:
        # Prepare data summary for AI analysis
        data_summary = {
            'behavioral_summary': behavioral_data.get('summary', {}),
            'quiz_statistics': quiz_stats,
            'subject_performance': subject_performance[:5] if subject_performance else [],  # Top 5 subjects
            'study_patterns': behavioral_data.get('behavioral_insights', {}).get('study_pattern_analysis', []),
            'strengths': behavioral_data.get('behavioral_insights', {}).get('behavioral_strengths', []),
            'improvement_areas': behavioral_data.get('behavioral_insights', {}).get('improvement_areas', [])
        }
        
        insights_prompt = f"""
        As an expert educational data analyst and learning scientist, analyze this comprehensive student data and provide deep insights about their learning behavior and academic performance.

        STUDENT DATA:
        {json.dumps(data_summary, indent=2)}

        ANALYSIS REQUIREMENTS:
        1. **Learning Profile Analysis**: Identify the student's unique learning characteristics, preferences, and behavioral patterns
        2. **Performance Insights**: Analyze quiz performance, study habits, and academic trends
        3. **Efficiency Assessment**: Evaluate how effectively the student uses their study time
        4. **Behavioral Patterns**: Identify hidden patterns in scheduling, completion rates, and engagement
        5. **Growth Opportunities**: Identify specific areas for improvement with actionable insights
        6. **Risk Assessment**: Identify any concerning patterns that could impact academic success

        Please provide your analysis in the following JSON format:
        {{
            "learning_profile": {{
                "learning_style": "Description of identified learning style",
                "optimal_study_conditions": "When and how they study best",
                "motivation_patterns": "What drives their academic engagement",
                "cognitive_strengths": ["List of identified cognitive strengths"]
            }},
            "performance_analysis": {{
                "current_trajectory": "Improving/Stable/Declining with explanation",
                "consistency_level": "High/Medium/Low with details",
                "subject_mastery": "Analysis of subject-specific performance",
                "quiz_taking_behavior": "Insights about quiz preparation and performance"
            }},
            "efficiency_insights": {{
                "time_management_score": "1-10 with explanation",
                "study_effectiveness": "Analysis of study time vs results",
                "procrastination_patterns": "Specific procrastination tendencies identified",
                "focus_quality": "Assessment of attention and concentration"
            }},
            "behavioral_patterns": {{
                "scheduling_preferences": "Identified time and activity preferences",
                "completion_patterns": "How they approach and finish tasks",
                "engagement_cycles": "Patterns in motivation and engagement",
                "stress_indicators": "Signs of academic stress or pressure"
            }},
            "recommendations_summary": {{
                "top_priority": "Most important area to focus on",
                "quick_wins": ["2-3 easy improvements they can make immediately"],
                "long_term_goals": ["2-3 strategic improvements for sustained success"]
            }},
            "insights_confidence": "High/Medium/Low based on data quality and quantity"
        }}

        Focus on providing specific, actionable insights rather than generic advice. Base all conclusions on the actual data provided.
        """

        response = model.generate_content(insights_prompt)
        response_text = response.text.strip()
        
        # Clean and parse JSON response
        if response_text.startswith('```json'):
            response_text = response_text[7:-3]
        elif response_text.startswith('```'):
            response_text = response_text[3:-3]
        
        try:
            insights = json.loads(response_text)
            return insights
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI insights JSON: {response_text[:200]}...")
            return {"error": "Failed to parse AI insights", "raw_response": response_text[:500]}
            
    except Exception as e:
        logger.error(f"Error generating AI insights: {str(e)}")
        return {"error": f"Failed to generate insights: {str(e)}"}

def generate_ai_predictions(behavioral_data, quiz_stats, user_id):
    """Generate AI-powered academic performance predictions."""
    try:
        # Prepare data for prediction analysis
        prediction_data = {
            'current_metrics': {
                'study_hours_weekly': behavioral_data.get('summary', {}).get('study_hours_per_week', 0),
                'completion_rate': behavioral_data.get('summary', {}).get('task_completion_rate', 0),
                'quiz_average': quiz_stats.get('average_score', 0),
                'consistency_score': behavioral_data.get('summary', {}).get('consistency_score', 0),
                'schedule_adherence': behavioral_data.get('summary', {}).get('schedule_following_rate', 0)
            },
            'trend_data': {
                'performance_trend': behavioral_data.get('summary', {}).get('performance_trend', 'stable'),
                'procrastination_level': behavioral_data.get('summary', {}).get('procrastination_level', 0),
                'total_quizzes': quiz_stats.get('total_quizzes', 0),
                'recent_activity': behavioral_data.get('activity_patterns', {}).get('total_activities', 0)
            }
        }

        prediction_prompt = f"""
        As an expert educational data scientist specializing in academic performance prediction, analyze this student's data and provide comprehensive predictions about their future academic performance.

        CURRENT STUDENT METRICS:
        {json.dumps(prediction_data, indent=2)}

        PREDICTION REQUIREMENTS:
        1. **Short-term Performance (2-4 weeks)**: Predict immediate academic outcomes
        2. **Medium-term Performance (1-3 months)**: Forecast semester/term performance
        3. **Risk Assessment**: Identify potential academic risks and their probability
        4. **Success Probability**: Calculate likelihood of achieving different performance levels
        5. **Intervention Impact**: Predict how specific changes could affect outcomes
        6. **Confidence Intervals**: Provide realistic ranges for predictions

        Please provide predictions in this JSON format:
        {{
            "short_term_prediction": {{
                "expected_gpa": "Predicted GPA range (e.g., 3.2-3.6)",
                "quiz_performance": "Expected quiz score range",
                "completion_likelihood": "Percentage likelihood of completing planned tasks",
                "key_factors": ["Most influential factors affecting short-term performance"]
            }},
            "medium_term_prediction": {{
                "semester_gpa": "Predicted semester GPA range",
                "academic_standing": "Expected academic standing (Excellent/Good/Satisfactory/At Risk)",
                "trend_direction": "Improving/Stable/Declining with confidence level",
                "milestone_achievement": "Likelihood of reaching academic goals"
            }},
            "risk_assessment": {{
                "high_risk_areas": ["Specific areas of academic concern"],
                "risk_probability": "Overall risk level (Low/Medium/High)",
                "early_warning_signs": ["Indicators to monitor closely"],
                "intervention_urgency": "How quickly intervention is needed"
            }},
            "success_scenarios": {{
                "best_case": "Optimal outcome if current positive trends continue",
                "most_likely": "Most probable outcome based on current patterns",
                "worst_case": "Concerning outcome if negative patterns persist"
            }},
            "improvement_potential": {{
                "with_better_time_management": "Expected improvement percentage",
                "with_consistent_study_schedule": "Expected improvement percentage", 
                "with_reduced_procrastination": "Expected improvement percentage",
                "realistic_target_gpa": "Achievable GPA target with improvements"
            }},
            "confidence_level": "High/Medium/Low based on data reliability",
            "data_limitations": ["Any factors that may affect prediction accuracy"]
        }}

        Base all predictions on statistical analysis of the provided data patterns. Be realistic and avoid overly optimistic or pessimistic predictions.
        """

        response = model.generate_content(prediction_prompt)
        response_text = response.text.strip()
        
        # Clean and parse JSON response
        if response_text.startswith('```json'):
            response_text = response_text[7:-3]
        elif response_text.startswith('```'):
            response_text = response_text[3:-3]
        
        try:
            predictions = json.loads(response_text)
            return predictions
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI predictions JSON: {response_text[:200]}...")
            return {"error": "Failed to parse AI predictions", "raw_response": response_text[:500]}
            
    except Exception as e:
        logger.error(f"Error generating AI predictions: {str(e)}")
        return {"error": f"Failed to generate predictions: {str(e)}"}

def generate_ai_study_strategy(behavioral_data, quiz_stats, subject_performance, goal, user_id):
    """Generate personalized AI study strategy."""
    try:
        strategy_data = {
            'learning_profile': {
                'study_hours_weekly': behavioral_data.get('summary', {}).get('study_hours_per_week', 0),
                'preferred_times': behavioral_data.get('activity_patterns', {}).get('scheduling_patterns', {}),
                'completion_rate': behavioral_data.get('summary', {}).get('task_completion_rate', 0),
                'consistency_score': behavioral_data.get('summary', {}).get('consistency_score', 0)
            },
            'performance_data': {
                'quiz_average': quiz_stats.get('average_score', 0),
                'quiz_consistency': quiz_stats.get('performance_level', 'No data'),
                'subject_strengths': subject_performance[:3] if subject_performance else [],
                'subject_challenges': subject_performance[-2:] if len(subject_performance) > 2 else []
            },
            'improvement_goal': goal
        }

        strategy_prompt = f"""
        As an expert learning strategist and educational consultant, create a comprehensive, personalized study strategy for this student.

        STUDENT DATA:
        {json.dumps(strategy_data, indent=2)}

        STRATEGY GOAL: {goal}

        STRATEGY REQUIREMENTS:
        1. **Personalized Approach**: Tailor strategy to student's learning patterns and preferences
        2. **Specific Action Plan**: Provide concrete, actionable steps
        3. **Time Management**: Optimize study schedule based on their patterns
        4. **Subject-Specific Tactics**: Address performance variations across subjects
        5. **Efficiency Optimization**: Maximize learning outcomes per study hour
        6. **Sustainable Practices**: Ensure long-term adherence and motivation

        Please provide the strategy in this JSON format:
        {{
            "strategy_overview": {{
                "main_approach": "Primary strategy focus based on their learning profile",
                "key_principles": ["3-4 core principles guiding this strategy"],
                "expected_outcomes": ["Specific improvements they can expect"],
                "timeline": "Realistic timeframe for seeing results"
            }},
            "weekly_schedule": {{
                "optimal_study_hours": "Recommended weekly study hours",
                "session_structure": "Recommended length and frequency of study sessions",
                "best_study_times": "When they should study based on their patterns",
                "rest_and_recovery": "Recommended breaks and downtime"
            }},
            "subject_strategies": [
                {{
                    "subject": "Subject name",
                    "approach": "Specific strategy for this subject",
                    "priority_level": "High/Medium/Low",
                    "weekly_time": "Recommended time allocation"
                }}
            ],
            "efficiency_techniques": {{
                "study_methods": ["Specific techniques that match their learning style"],
                "time_management_tools": ["Tools and techniques for better time use"],
                "focus_strategies": ["Ways to improve concentration and attention"],
                "motivation_tactics": ["Strategies to maintain engagement"]
            }},
            "progress_tracking": {{
                "daily_habits": ["Small daily actions to track"],
                "weekly_reviews": ["What to assess each week"],
                "milestone_checkpoints": ["Key indicators of strategy effectiveness"],
                "adjustment_triggers": ["When to modify the strategy"]
            }},
            "quick_start_guide": {{
                "first_week_actions": ["Specific steps to take in the first week"],
                "immediate_changes": ["Changes they can implement today"],
                "habit_formation": ["New habits to establish gradually"]
            }},
            "personalization_notes": "Specific reasons why this strategy fits their profile"
        }}

        Focus on practical, implementable strategies that align with their current patterns while gently pushing them toward improvement.
        """

        response = model.generate_content(strategy_prompt)
        response_text = response.text.strip()
        
        # Clean and parse JSON response
        if response_text.startswith('```json'):
            response_text = response_text[7:-3]
        elif response_text.startswith('```'):
            response_text = response_text[3:-3]
        
        try:
            strategy = json.loads(response_text)
            return strategy
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI study strategy JSON: {response_text[:200]}...")
            return {"error": "Failed to parse AI study strategy", "raw_response": response_text[:500]}
            
    except Exception as e:
        logger.error(f"Error generating AI study strategy: {str(e)}")
        return {"error": f"Failed to generate study strategy: {str(e)}"}

def generate_ai_pattern_analysis(behavioral_data, quiz_stats, user_id):
    """Generate AI-powered pattern analysis of learning behavior."""
    try:
        pattern_data = {
            'activity_patterns': behavioral_data.get('activity_patterns', {}),
            'quiz_performance': behavioral_data.get('quiz_performance', {}),
            'schedule_adherence': behavioral_data.get('schedule_adherence', {}),
            'behavioral_insights': behavioral_data.get('behavioral_insights', {}),
            'quiz_statistics': quiz_stats
        }

        pattern_prompt = f"""
        As an expert behavioral analyst specializing in learning patterns, analyze this student's comprehensive data to identify sophisticated patterns, correlations, and insights that might not be immediately obvious.

        STUDENT BEHAVIORAL DATA:
        {json.dumps(pattern_data, indent=2)}

        ANALYSIS FOCUS:
        1. **Hidden Correlations**: Find relationships between different behavioral metrics
        2. **Cyclical Patterns**: Identify recurring patterns in performance and behavior
        3. **Trigger Events**: Discover what events or conditions lead to changes in behavior
        4. **Efficiency Patterns**: Analyze when and how the student is most/least effective
        5. **Stress Indicators**: Identify behavioral signs of academic stress or pressure
        6. **Success Patterns**: Determine what conditions lead to optimal performance

        Provide your analysis in this JSON format:
        {{
            "correlation_insights": {{
                "strong_correlations": [
                    {{
                        "variables": "What correlates with what",
                        "strength": "Strong/Moderate correlation",
                        "insight": "What this tells us about the student"
                    }}
                ],
                "surprising_findings": ["Unexpected relationships discovered in the data"]
            }},
            "temporal_patterns": {{
                "performance_cycles": "Identified cycles in academic performance",
                "productivity_rhythms": "When they're most/least productive",
                "consistency_patterns": "How consistent are their study habits",
                "seasonal_trends": "Any monthly or weekly patterns observed"
            }},
            "behavioral_triggers": {{
                "performance_boosters": ["Conditions that lead to better performance"],
                "performance_inhibitors": ["Conditions that hurt performance"],
                "procrastination_triggers": ["What typically leads to procrastination"],
                "motivation_drivers": ["What increases their engagement"]
            }},
            "efficiency_analysis": {{
                "peak_performance_conditions": "When they perform at their best",
                "optimal_session_length": "Ideal study session duration for this student",
                "subject_efficiency_patterns": "How efficiency varies by subject/topic",
                "attention_span_indicators": "Patterns in sustained attention"
            }},
            "stress_and_wellbeing": {{
                "stress_indicators": ["Behavioral signs of academic stress"],
                "coping_mechanisms": ["How they handle academic pressure"],
                "balance_assessment": "How well they balance study and rest",
                "burnout_risk": "Low/Medium/High risk of academic burnout"
            }},
            "success_formula": {{
                "optimal_conditions": "Recipe for their best academic performance",
                "key_success_factors": ["Most important elements for their success"],
                "replication_strategy": "How to consistently recreate their best performance"
            }},
            "pattern_confidence": "How confident are these pattern identifications",
            "data_quality_notes": "Any limitations in the pattern analysis"
        }}

        Look for subtle patterns and provide insights that go beyond surface-level observations.
        """

        response = model.generate_content(pattern_prompt)
        response_text = response.text.strip()
        
        # Clean and parse JSON response
        if response_text.startswith('```json'):
            response_text = response_text[7:-3]
        elif response_text.startswith('```'):
            response_text = response_text[3:-3]
        
        try:
            patterns = json.loads(response_text)
            return patterns
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI pattern analysis JSON: {response_text[:200]}...")
            return {"error": "Failed to parse AI pattern analysis", "raw_response": response_text[:500]}
            
    except Exception as e:
        logger.error(f"Error generating AI pattern analysis: {str(e)}")
        return {"error": f"Failed to generate pattern analysis: {str(e)}"}

def generate_smart_recommendations(behavioral_data, quiz_stats, subject_performance, priority, user_id):
    """Generate AI-powered smart recommendations for learning improvement."""
    try:
        recommendation_data = {
            'current_performance': {
                'overall_metrics': behavioral_data.get('summary', {}),
                'quiz_performance': quiz_stats,
                'subject_breakdown': subject_performance[:5] if subject_performance else []
            },
            'areas_for_improvement': behavioral_data.get('behavioral_insights', {}).get('improvement_areas', []),
            'current_strengths': behavioral_data.get('behavioral_insights', {}).get('behavioral_strengths', []),
            'priority_focus': priority
        }

        recommendation_prompt = f"""
        As an expert educational advisor and learning optimization specialist, generate highly personalized, actionable recommendations to help this student achieve their academic goals.

        STUDENT DATA:
        {json.dumps(recommendation_data, indent=2)}

        RECOMMENDATION CRITERIA:
        1. **Personalization**: Tailor recommendations to their specific learning profile
        2. **Actionability**: Provide concrete, implementable actions
        3. **Priority Alignment**: Focus on their stated priority ({priority})
        4. **Evidence-Based**: Base recommendations on data insights
        5. **Feasibility**: Ensure recommendations are realistic and achievable
        6. **Impact Potential**: Prioritize changes with highest improvement potential

        Provide recommendations in this JSON format:
        {{
            "high_impact_recommendations": [
                {{
                    "title": "Clear, actionable recommendation title",
                    "description": "Detailed explanation of the recommendation",
                    "rationale": "Why this recommendation based on their data",
                    "implementation_steps": ["Step 1", "Step 2", "Step 3"],
                    "expected_impact": "What improvement to expect",
                    "difficulty": "Easy/Medium/Hard",
                    "timeframe": "When to expect results",
                    "success_metrics": ["How to measure success"]
                }}
            ],
            "quick_wins": [
                {{
                    "action": "Simple action they can take immediately",
                    "benefit": "What improvement this will provide",
                    "time_required": "How much time this takes"
                }}
            ],
            "study_optimization": {{
                "time_management": "Specific time management improvement",
                "study_techniques": "Recommended study methods for their profile",
                "environment_setup": "Optimal study environment suggestions",
                "technology_tools": "Helpful apps or tools to use"
            }},
            "subject_specific_advice": [
                {{
                    "subject": "Subject name",
                    "specific_recommendation": "Targeted advice for this subject",
                    "improvement_strategy": "How to improve in this area"
                }}
            ],
            "habit_changes": {{
                "habits_to_start": ["New positive habits to develop"],
                "habits_to_modify": ["Current habits to adjust"],
                "habits_to_stop": ["Counterproductive patterns to eliminate"]
            }},
            "weekly_action_plan": {{
                "week_1": ["Specific actions for first week"],
                "week_2": ["Actions for second week"],
                "week_3": ["Actions for third week"],
                "week_4": ["Actions for fourth week"]
            }},
            "progress_tracking_plan": {{
                "daily_checkpoints": ["What to track daily"],
                "weekly_assessments": ["What to review weekly"],
                "monthly_evaluations": ["Comprehensive monthly review items"]
            }},
            "motivation_strategy": {{
                "reward_system": "How to reward progress and achievements",
                "accountability_measures": "Ways to stay accountable",
                "support_resources": "Where to get help when needed"
            }},
            "priority_alignment": "How these recommendations address their {priority} priority",
            "expected_timeline": "Realistic timeline for seeing significant improvements"
        }}

        Focus on practical, evidence-based recommendations that build on their strengths while addressing improvement areas.
        """

        response = model.generate_content(recommendation_prompt)
        response_text = response.text.strip()
        
        # Clean and parse JSON response
        if response_text.startswith('```json'):
            response_text = response_text[7:-3]
        elif response_text.startswith('```'):
            response_text = response_text[3:-3]
        
        try:
            recommendations = json.loads(response_text)
            return recommendations
        except json.JSONDecodeError:
            logger.error(f"Failed to parse AI recommendations JSON: {response_text[:200]}...")
            return {"error": "Failed to parse AI recommendations", "raw_response": response_text[:500]}
            
    except Exception as e:
        logger.error(f"Error generating smart recommendations: {str(e)}")
        return {"error": f"Failed to generate smart recommendations: {str(e)}"}

def get_ai_efficiency_suggestions(user_id, behavioral_data, target_improvement):
    """Generate AI suggestions for improving study efficiency."""
    try:
        efficiency_data = {
            'current_efficiency': {
                'study_hours': behavioral_data.get('summary', {}).get('study_hours_per_week', 0),
                'completion_rate': behavioral_data.get('summary', {}).get('task_completion_rate', 0),
                'focus_level': behavioral_data.get('summary', {}).get('focus_level', 0),
                'procrastination_score': behavioral_data.get('summary', {}).get('procrastination_level', 0)
            },
            'target_improvement': target_improvement
        }

        # This is a helper function that can be called by other modules
        # Implementation would be similar to the above functions
        return {"efficiency_suggestions": "AI-generated efficiency improvements"}
        
    except Exception as e:
        logger.error(f"Error generating efficiency suggestions: {str(e)}")
        return {"error": f"Failed to generate efficiency suggestions: {str(e)}"}
