"""
PDF Generation utility for EduMaster application.
This module handles generating professional PDF schedules.
"""

import os
import logging
from datetime import datetime
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

logger = logging.getLogger(__name__)

class SchedulePDFGenerator:
    """Generates professional PDF schedules"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Setup custom styles for the PDF"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#667eea')
        ))
        
        # Subtitle style
        self.styles.add(ParagraphStyle(
            name='CustomSubTitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#2c3e50')
        ))
        
        # Header style
        self.styles.add(ParagraphStyle(
            name='CustomHeader',
            parent=self.styles['Heading3'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.HexColor('#34495e'),
            leftIndent=0
        ))
        
        # Footer style
        self.styles.add(ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            textColor=colors.grey
        ))
        
        # Session info style
        self.styles.add(ParagraphStyle(
            name='SessionInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6,
            leftIndent=10
        ))
    
    def generate_schedule_pdf(self, user_data, schedule_data, save_path=None):
        """
        Generate a PDF schedule for a user
        
        Args:
            user_data (dict): User information
            schedule_data (dict): Schedule information
            save_path (str): Optional path to save the PDF file
            
        Returns:
            bytes: PDF content as bytes
        """
        try:
            # Create PDF buffer
            buffer = BytesIO()
            
            # Create document
            doc = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Build the PDF content
            story = []
            
            # Add title and header information
            self._add_header(story, user_data, schedule_data)
            
            # Add schedule table
            self._add_schedule_table(story, schedule_data.get('schedule', []))
            
            # Add preferences and notes
            self._add_schedule_info(story, schedule_data)
            
            # Add footer
            self._add_footer(story)
            
            # Build PDF
            doc.build(story)
            
            # Get PDF content
            pdf_content = buffer.getvalue()
            buffer.close()
            
            # Save to file if path provided
            if save_path:
                with open(save_path, 'wb') as f:
                    f.write(pdf_content)
                logger.info(f"PDF schedule saved to {save_path}")
            
            return pdf_content
            
        except Exception as e:
            logger.error(f"Error generating PDF schedule: {e}")
            raise
    
    def _add_header(self, story, user_data, schedule_data):
        """Add header information to the PDF"""
        # Main title
        title = Paragraph("📚 EduMaster Study Schedule", self.styles['CustomTitle'])
        story.append(title)
        
        # User and schedule info
        user_name = f"{user_data.get('firstname', '')} {user_data.get('lastname', '')}".strip()
        if not user_name:
            user_name = user_data.get('email', 'Student')
        
        subtitle = f"Study Schedule for {user_name}"
        story.append(Paragraph(subtitle, self.styles['CustomSubTitle']))
        
        # Schedule metadata
        schedule_name = schedule_data.get('schedule_name', 'Default Schedule')
        created_date = schedule_data.get('created_at')
        updated_date = schedule_data.get('updated_at')
        
        metadata_text = f"<b>Schedule:</b> {schedule_name}<br/>"
        if created_date:
            if isinstance(created_date, str):
                created_date = datetime.fromisoformat(created_date.replace('Z', '+00:00'))
            metadata_text += f"<b>Created:</b> {created_date.strftime('%B %d, %Y at %I:%M %p')}<br/>"
        
        if updated_date:
            if isinstance(updated_date, str):
                updated_date = datetime.fromisoformat(updated_date.replace('Z', '+00:00'))
            metadata_text += f"<b>Last Updated:</b> {updated_date.strftime('%B %d, %Y at %I:%M %p')}<br/>"
        
        metadata_text += f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}"
        
        story.append(Paragraph(metadata_text, self.styles['Normal']))
        story.append(Spacer(1, 20))
    
    def _add_schedule_table(self, story, schedule_sessions):
        """Add the main schedule table to the PDF"""
        if not schedule_sessions:
            story.append(Paragraph("<i>No scheduled sessions found.</i>", self.styles['Normal']))
            return
        
        # Group sessions by day
        days_order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        schedule_by_day = {}
        
        for session in schedule_sessions:
            day = session.get('day', '').lower()
            if day not in schedule_by_day:
                schedule_by_day[day] = []
            schedule_by_day[day].append(session)
        
        # Sort sessions within each day by time
        for day in schedule_by_day:
            schedule_by_day[day].sort(key=lambda x: self._parse_time(x.get('time', '')))
        
        # Create table data
        table_data = [
            ['Day', 'Time', 'Subject', 'Type', 'Location']
        ]
        
        for day in days_order:
            if day in schedule_by_day:
                day_sessions = schedule_by_day[day]
                for i, session in enumerate(day_sessions):
                    row = [
                        day.title() if i == 0 else '',  # Only show day name for first session
                        session.get('time', 'N/A'),
                        session.get('subject', 'Study Session'),
                        session.get('type', 'Study'),
                        session.get('location', '')
                    ]
                    table_data.append(row)
        
        # Create table
        table = Table(table_data, colWidths=[1.2*inch, 1.5*inch, 2*inch, 1*inch, 1.5*inch])
        
        # Style the table
        table.setStyle(TableStyle([
            # Header row
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            
            # Data rows
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.beige, colors.white]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        
        story.append(Paragraph("Weekly Schedule", self.styles['CustomHeader']))
        story.append(table)
        story.append(Spacer(1, 20))
    
    def _add_schedule_info(self, story, schedule_data):
        """Add additional schedule information"""
        preferences = schedule_data.get('preferences', {})
        schedule_sessions = schedule_data.get('schedule', [])
        
        # Statistics
        stats_text = "<b>Schedule Statistics:</b><br/>"
        total_sessions = len(schedule_sessions)
        stats_text += f"• Total Sessions: {total_sessions}<br/>"
        
        if total_sessions > 0:
            # Calculate sessions per day
            day_counts = {}
            total_duration = 0
            
            for session in schedule_sessions:
                day = session.get('day', '').lower()
                day_counts[day] = day_counts.get(day, 0) + 1
                
                # Try to calculate duration from time range
                time_str = session.get('time', '')
                if '-' in time_str:
                    try:
                        start_time, end_time = time_str.split('-')
                        start_hour, start_min = map(int, start_time.strip().split(':'))
                        end_hour, end_min = map(int, end_time.strip().split(':'))
                        duration = (end_hour * 60 + end_min) - (start_hour * 60 + start_min)
                        total_duration += duration
                    except:
                        pass
            
            if day_counts:
                avg_sessions = total_sessions / len(day_counts)
                stats_text += f"• Average Sessions per Day: {avg_sessions:.1f}<br/>"
            
            if total_duration > 0:
                avg_duration = total_duration / total_sessions
                total_hours = total_duration / 60
                stats_text += f"• Total Study Hours per Week: {total_hours:.1f}<br/>"
                stats_text += f"• Average Session Duration: {avg_duration:.0f} minutes<br/>"
        
        story.append(Paragraph(stats_text, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Preferences
        if preferences:
            prefs_text = "<b>Schedule Preferences:</b><br/>"
            for key, value in preferences.items():
                formatted_key = key.replace('_', ' ').title()
                prefs_text += f"• {formatted_key}: {value}<br/>"
            
            story.append(Paragraph(prefs_text, self.styles['Normal']))
            story.append(Spacer(1, 15))
        
        # Study tips
        tips_text = """
        <b>Study Tips:</b><br/>
        • Take regular breaks between sessions<br/>
        • Prepare materials in advance<br/>
        • Find a quiet, distraction-free environment<br/>
        • Stay hydrated and maintain good posture<br/>
        • Review your progress regularly<br/>
        """
        story.append(Paragraph(tips_text, self.styles['Normal']))
    
    def _add_footer(self, story):
        """Add footer to the PDF"""
        story.append(Spacer(1, 30))
        
        footer_text = "Generated by EduMaster - Your Smart Learning Companion"
        story.append(Paragraph(footer_text, self.styles['Footer']))
        
        website_text = "Visit: https://edumaster.com | Email: support@edumaster.com"
        story.append(Paragraph(website_text, self.styles['Footer']))
    
    def _parse_time(self, time_str):
        """Parse time string for sorting"""
        try:
            if '-' in time_str:
                start_time = time_str.split('-')[0].strip()
            else:
                start_time = time_str.strip()
            
            if ':' in start_time:
                hour, minute = map(int, start_time.split(':'))
                return hour * 60 + minute
            return 0
        except:
            return 0

# Global PDF generator instance
pdf_generator = SchedulePDFGenerator()
