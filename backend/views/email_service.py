# views/email_service.py
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from flask_mail import Message
import traceback
import re

logger = logging.getLogger(__name__)

class FlaskMailService:
    """Email service using Flask-Mail"""
    
    def __init__(self, mail_instance=None):
        self.mail = mail_instance
        self.from_email = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@homesbymwema.com')
        self.from_name = os.environ.get('MAIL_FROM_NAME', 'Homes by Mwema')
        
        # Check if mail is configured
        self.enabled = bool(
            os.environ.get('MAIL_USERNAME') and 
            os.environ.get('MAIL_PASSWORD')
        )
        
        if self.enabled:
            logger.info("✅ Flask-Mail email service initialized")
        else:
            logger.warning("⚠️ Mail credentials not set - emails will be logged only")
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None) -> Dict[str, Any]:
        """
        Send an email using Flask-Mail
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML version of email
            text_content: Plain text version (optional)
        
        Returns:
            Dict with status and message
        """
        # Log the email attempt
        logger.info(f"📧 Preparing to send email to: {to_email}")
        logger.info(f"📧 Subject: {subject}")
        
        # If email service is not enabled, just log
        if not self.enabled or not self.mail:
            logger.info("📧 Email sending is disabled (set MAIL_USERNAME and MAIL_PASSWORD to enable)")
            return {
                'success': True,
                'simulated': True,
                'message': 'Email logged (sending disabled)'
            }
        
        try:
            # Create message
            msg = Message(
                subject=subject,
                recipients=[to_email],
                html=html_content,
                sender=f"{self.from_name} <{self.from_email}>"
            )
            
            # Add plain text version if provided
            if text_content:
                msg.body = text_content
            else:
                # Generate simple text version from HTML
                text_content = re.sub('<.*?>', '', html_content)
                msg.body = text_content
            
            # Send email
            self.mail.send(msg)
            
            logger.info(f"✅ Email sent successfully via Flask-Mail to {to_email}")
            
            return {
                'success': True,
                'message': 'Email sent successfully'
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to send email: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to send email'
            }
    
    def generate_confirmation_email(self, consultation: Dict[str, Any], meeting_link: str = None) -> Dict[str, str]:
        """Generate confirmation email content"""
        # Format date
        date_obj = datetime.fromisoformat(consultation['date'].replace('Z', '+00:00'))
        formatted_date = date_obj.strftime('%B %d, %Y')
        formatted_time = f"{consultation['hour']:02d}:{consultation['minute']:02d}"
        
        # Default meeting link if not provided
        if not meeting_link:
            meeting_link = "https://meet.google.com/your-meeting-link"  # Placeholder
        
        # Get recipient name
        recipient_name = consultation.get('name') or consultation.get('user', {}).get('name', 'Valued Client')
        
        subject = f"Consultation Confirmed - Homes by Mwema"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: 'Georgia', serif; line-height: 1.6; color: #1C1917; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1C1917; color: #F5F2EE; padding: 30px; text-align: center; }}
                .header h1 {{ margin: 0; font-size: 28px; font-weight: normal; font-style: italic; }}
                .content {{ background-color: #F5F2EE; padding: 40px; }}
                .details {{ background-color: white; padding: 30px; margin: 20px 0; border-left: 4px solid #C1A173; }}
                .details p {{ margin: 10px 0; }}
                .details strong {{ color: #C1A173; }}
                .button {{ display: inline-block; background-color: #C1A173; color: white; padding: 12px 30px; 
                         text-decoration: none; margin-top: 20px; border-radius: 4px; font-family: Arial, sans-serif; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #EBE5DE; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Homes by Mwema</h1>
                </div>
                <div class="content">
                    <h2 style="margin-top: 0;">Your Consultation is Confirmed</h2>
                    <p>Dear {recipient_name},</p>
                    <p>We're pleased to confirm your consultation with our team. Your request has been reviewed and approved.</p>
                    
                    <div class="details">
                        <h3 style="margin-top: 0;">📅 Consultation Details</h3>
                        <p><strong>Date:</strong> {formatted_date}</p>
                        <p><strong>Time:</strong> {formatted_time}</p>
                        <p><strong>Topic:</strong> {consultation.get('topic', 'General Inquiry')}</p>
                        <p><strong>Meeting Link:</strong> <a href="{meeting_link}">{meeting_link}</a></p>
                    </div>
                    
                    {f'<p><strong>Notes from your request:</strong><br>{consultation["notes"]}</p>' if consultation.get('notes') else ''}
                    
                    <p>Please click the button below to join the meeting at the scheduled time:</p>
                    
                    <div style="text-align: center;">
                        <a href="{meeting_link}" class="button">Join Consultation</a>
                    </div>
                    
                    <p style="margin-top: 30px;">If you need to reschedule or have any questions, please reply to this email or contact us directly at <a href="mailto:info@homesbymwema.com">info@homesbymwema.com</a>.</p>
                    
                    <p>Warm regards,<br>The Homes by Mwema Team</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Homes by Mwema. All rights reserved.</p>
                    <p>Nairobi, Kenya</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text = f"""
        Consultation Confirmed - Homes by Mwema
        
        Dear {recipient_name},
        
        Your consultation has been confirmed.
        
        Details:
        Date: {formatted_date}
        Time: {formatted_time}
        Topic: {consultation.get('topic', 'General Inquiry')}
        Meeting Link: {meeting_link}
        
        Join the meeting at the scheduled time.
        
        If you need to reschedule, please contact us at info@homesbymwema.com.
        
        Warm regards,
        The Homes by Mwema Team
        """
        
        # Get recipient email
        recipient_email = consultation.get('email') or consultation.get('user', {}).get('email')
        
        return {
            'subject': subject,
            'html': html,
            'text': text,
            'recipient': recipient_email
        }
    
    def generate_rejection_email(self, consultation: Dict[str, Any], reason: str = None) -> Dict[str, str]:
        """Generate rejection email content"""
        recipient_name = consultation.get('name') or consultation.get('user', {}).get('name', 'Valued Client')
        recipient_email = consultation.get('email') or consultation.get('user', {}).get('email')
        
        subject = "Update on Your Consultation Request - Homes by Mwema"
        
        reason_text = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Georgia', serif; line-height: 1.6; color: #1C1917; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1C1917; color: #F5F2EE; padding: 30px; text-align: center; }}
                .content {{ background-color: #F5F2EE; padding: 40px; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Homes by Mwema</h1>
                </div>
                <div class="content">
                    <h2>Consultation Request Update</h2>
                    <p>Dear {recipient_name},</p>
                    <p>Thank you for your interest in consulting with us. Unfortunately, we're unable to accommodate your consultation request at this time.</p>
                    
                    {reason_text}
                    
                    <p>We encourage you to try scheduling again with a different date/time, or contact us directly via email if you have specific questions.</p>
                    
                    <p>We value your interest and hope to assist you in the future.</p>
                    
                    <p>Best regards,<br>The Homes by Mwema Team</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Homes by Mwema</p>
                </div>
            </div>
        </html>
        """
        
        text = f"""
        Consultation Request Update - Homes by Mwema
        
        Dear {recipient_name},
        
        Thank you for your interest in consulting with us. Unfortunately, we're unable to accommodate your consultation request at this time.
        
        {reason if reason else ''}
        
        We encourage you to try scheduling again with a different date/time.
        
        Best regards,
        The Homes by Mwema Team
        """
        
        return {
            'subject': subject,
            'html': html,
            'text': text,
            'recipient': recipient_email
        }

# Singleton instance - will be initialized with app context later
email_service = FlaskMailService()