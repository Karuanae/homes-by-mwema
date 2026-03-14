# views/email_service.py
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from flask_mail import Message
import traceback
import re
import resend

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
    
    def send_resend_email(self, to_email: str, subject: str, html_content: str) -> Dict[str, Any]:
        """
        Send an email using Resend API (alternative to Flask-Mail)
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML version of email
        
        Returns:
            Dict with status and message
        """
        try:
            resend.api_key = os.environ.get('RESEND_API_KEY')
            if not resend.api_key:
                logger.error("❌ RESEND_API_KEY not set in environment")
                return {
                    'success': False,
                    'error': 'RESEND_API_KEY not configured'
                }
            
            params = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            
            email = resend.Emails.send(params)
            logger.info(f"✅ Email sent via Resend to {to_email} (ID: {email['id']})")
            
            return {
                'success': True,
                'message': 'Email sent successfully',
                'id': email['id']
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to send email via Resend: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def generate_confirmation_email(self, consultation: Dict[str, Any], meeting_link: str = None) -> Dict[str, str]:
        """Generate consultation confirmation email content"""
        # Format date
        date_obj = datetime.fromisoformat(consultation['date'].replace('Z', '+00:00'))
        formatted_date = date_obj.strftime('%B %d, %Y')
        formatted_time = f"{consultation['hour']:02d}:{consultation['minute']:02d}"
        
        # Default meeting link if not provided
        if not meeting_link:
            meeting_link = "https://meet.google.com/your-meeting-link"  # Placeholder
        
        # Get recipient name
        recipient_name = consultation.get('name') or consultation.get('user', {}).get('name', 'Valued Client')
        recipient_email = consultation.get('email') or consultation.get('user', {}).get('email')
        
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
        
        return {
            'subject': subject,
            'html': html,
            'text': text,
            'recipient': recipient_email
        }
    
    def generate_rejection_email(self, consultation: Dict[str, Any], reason: str = None) -> Dict[str, str]:
        """Generate consultation rejection email content"""
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
    
    def generate_booking_confirmation_email(self, booking, user) -> Dict[str, str]:
        """Generate booking confirmation email"""
        property_name = booking.property.name if booking.property else 'Property'
        check_in = booking.check_in.strftime('%B %d, %Y')
        check_out = booking.check_out.strftime('%B %d, %Y')
        
        subject = f"Booking Confirmed - {property_name}"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Georgia', serif; line-height: 1.6; color: #1C1917; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #093A3E; color: white; padding: 30px; text-align: center; }}
                .content {{ background-color: #F5F2EE; padding: 40px; }}
                .details {{ background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #ED9B40; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Homes by Mwema</h1>
                </div>
                <div class="content">
                    <h2>Booking Confirmed!</h2>
                    <p>Dear {user.name},</p>
                    <p>Your booking at <strong>{property_name}</strong> has been confirmed.</p>
                    
                    <div class="details">
                        <p><strong>Check-in:</strong> {check_in}</p>
                        <p><strong>Check-out:</strong> {check_out}</p>
                        <p><strong>Total:</strong> KES {float(booking.total_amount):,.0f}</p>
                    </div>
                    
                    <p>You can view your booking details in your dashboard.</p>
                    
                    <p>We look forward to hosting you!</p>
                    
                    <p>Best regards,<br>The Homes by Mwema Team</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Homes by Mwema</p>
                </div>
            </div>
        </html>
        """
        
        return {
            'subject': subject,
            'html': html,
            'recipient': user.email
        }
    
    def send_cancellation_email(self, booking, refund_amount):
        """Send cancellation confirmation email"""
        try:
            resend.api_key = os.environ.get('RESEND_API_KEY')
            if not resend.api_key:
                logger.error("❌ RESEND_API_KEY not set in environment")
                return {
                    'success': False,
                    'error': 'RESEND_API_KEY not configured'
                }
            
            user = booking.user
            property_name = booking.property.name if booking.property else 'Property'
            
            # Format dates
            check_in = booking.check_in.strftime('%B %d, %Y')
            check_out = booking.check_out.strftime('%B %d, %Y')
            
            # Determine refund text
            if refund_amount == 0:
                refund_text = "No refund applicable as per cancellation policy."
            elif refund_amount == booking.total_amount:
                refund_text = f"Full refund of KES {float(booking.total_amount):,.0f} will be processed."
            else:
                refund_text = f"Partial refund of KES {float(refund_amount):,.0f} will be processed."
            
            html_body = f"""
            <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; background: #f9f8f6; padding: 24px;">
              <div style="background: #093A3E; color: white; padding: 24px;">
                <p style="color: #ED9B40; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; margin: 0 0 8px;">Homes by Mwema</p>
                <h1 style="font-size: 20px; margin: 0; font-weight: normal;">Booking Cancelled</h1>
              </div>
              <div style="background: white; border: 1px solid #ebe5de; padding: 24px;">
                <p style="color: #555; font-size: 14px; line-height: 1.6;">Dear {user.name or 'Valued Client'},</p>
                <p style="color: #555; font-size: 14px; line-height: 1.6;">
                  Your booking at <strong>{property_name}</strong> has been successfully cancelled.
                </p>
                
                <div style="background: #f9f8f6; border-left: 3px solid #ED9B40; padding: 16px; margin: 16px 0;">
                  <p style="margin: 0 0 8px; font-weight: bold;">Booking Details:</p>
                  <p style="margin: 4px 0;">📅 Check-in: {check_in}</p>
                  <p style="margin: 4px 0;">📅 Check-out: {check_out}</p>
                  <p style="margin: 4px 0;">💰 Total: KES {float(booking.total_amount):,.0f}</p>
                  <p style="margin: 8px 0 0; color: {'#16a34a' if refund_amount > 0 else '#dc2626'};">{refund_text}</p>
                </div>
                
                <p style="color: #555; font-size: 13px; line-height: 1.6;">
                  Refunds typically process within 5-7 business days and will be returned to your original payment method.
                </p>
                
                <p style="color: #888; font-size: 13px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;">
                  We hope to welcome you again in the future.<br/>
                  <strong style="color: #1C1917;">The Homes by Mwema Team</strong>
                </p>
              </div>
              <p style="color: #aaa; font-size: 11px; text-align: center; margin-top: 16px;">
                Booking #{booking.id} · <a href="https://homesbymwema.com" style="color: #aaa;">homesbymwema.com</a>
              </p>
            </div>
            """
            
            params = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [user.email],
                "subject": f"Booking Cancelled - {property_name}",
                "html": html_body,
            }
            
            email = resend.Emails.send(params)
            logger.info(f"✅ Cancellation email sent to {user.email} (ID: {email['id']})")
            
            return {
                'success': True,
                'message': 'Cancellation email sent',
                'id': email['id']
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to send cancellation email: {e}")
            return {
                'success': False,
                'error': str(e)
            }

# Singleton instance - will be initialized with app context later
email_service = FlaskMailService()