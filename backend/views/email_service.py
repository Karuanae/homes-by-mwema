"""
views/email_service.py
======================
Unified email service for Homes by Mwema.

Provider priority:
  1. Resend  (if RESEND_API_KEY is set)
  2. Flask-Mail  (if MAIL_USERNAME + MAIL_PASSWORD are set)
  3. Log-only fallback (dev / misconfigured environments)

Public API — callers only ever use these four methods:
  email_service.send_booking_confirmation(booking, user)
  email_service.send_payment_received(booking, user, payment)
  email_service.send_cancellation(booking, refund_amount)
  email_service.send_refund_processed(booking, user, refund_amount, method)
  email_service.send_consultation_confirmed(consultation, meeting_link)
  email_service.send_consultation_rejected(consultation, reason)
"""

import os
import re
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


# ─── base template ─────────────────────────────────────────────────────────────

def _base(title: str, body_html: str, booking_id: int = None) -> str:
    """
    Wrap body_html in the shared brand shell.
    Using a helper avoids repeating the outer chrome and sidesteps
    the double-brace escaping problem of embedding CSS in f-strings.
    """
    footer_ref = f"Booking #{booking_id} · " if booking_id else ""
    year = datetime.now().year
    return (
        "<!DOCTYPE html><html><head>"
        "<meta charset='UTF-8'>"
        "<meta name='viewport' content='width=device-width,initial-scale=1.0'>"
        "<style>"
        "body{margin:0;padding:0;background:#f5f2ee;font-family:Georgia,serif;color:#1c1917}"
        ".wrap{max-width:600px;margin:0 auto;padding:24px}"
        ".hdr{background:#093A3E;padding:28px 32px}"
        ".hdr-brand{color:#ED9B40;font-size:10px;text-transform:uppercase;letter-spacing:.2em;margin:0 0 6px}"
        ".hdr-title{color:#fff;font-size:22px;font-weight:normal;margin:0}"
        ".body{background:#fff;border:1px solid #ebe5de;padding:32px}"
        ".detail-box{background:#f9f8f6;border-left:4px solid #ED9B40;padding:16px;margin:20px 0}"
        ".detail-box p{margin:4px 0;font-size:14px}"
        ".btn{display:inline-block;background:#093A3E;color:#fff;padding:12px 28px;"
        "text-decoration:none;border-radius:4px;font-family:Arial,sans-serif;font-size:14px}"
        ".foot{text-align:center;padding:16px;color:#aaa;font-size:11px}"
        "p{font-size:14px;line-height:1.7;color:#444}"
        "h2{font-size:20px;font-weight:normal;color:#1c1917;margin-top:0}"
        "strong{color:#1c1917}"
        "a{color:#093A3E}"
        "</style></head><body>"
        "<div class='wrap'>"
        "<div class='hdr'>"
        "<p class='hdr-brand'>Homes by Mwema</p>"
        f"<h1 class='hdr-title'>{title}</h1>"
        "</div>"
        "<div class='body'>"
        + body_html +
        "</div>"
        "<div class='foot'>"
        f"{footer_ref}"
        f"<a href='https://homesbymwema.com' style='color:#aaa'>homesbymwema.com</a>"
        f" &middot; &copy; {year} Homes by Mwema"
        "</div>"
        "</div>"
        "</body></html>"
    )


def _fmt_kes(amount) -> str:
    return f"KES {float(amount or 0):,.0f}"


# ─── service class ─────────────────────────────────────────────────────────────

class EmailService:
    """
    Single entry point for all transactional emails.
    Automatically picks the best available provider.
    """

    def __init__(self, mail_instance=None):
        self._mail        = mail_instance
        self._from_addr   = os.environ.get("MAIL_DEFAULT_SENDER", "noreply@homesbymwema.com")
        self._from_name   = os.environ.get("MAIL_FROM_NAME",      "Homes by Mwema")
        self._from_header = f"{self._from_name} <{self._from_addr}>"

        # Detect available providers once at startup
        self._resend_key    = os.environ.get("RESEND_API_KEY", "")
        self._flaskmail_ok  = bool(
            os.environ.get("MAIL_USERNAME") and os.environ.get("MAIL_PASSWORD")
        )

        if self._resend_key:
            try:
                import resend as _resend_mod
                self._resend = _resend_mod
                self._resend.api_key = self._resend_key
                logger.info("✅ Email provider: Resend")
            except ImportError:
                self._resend = None
                logger.warning("⚠️  resend package not installed — pip install resend")
        else:
            self._resend = None

        if self._flaskmail_ok and mail_instance:
            logger.info("✅ Email provider: Flask-Mail (fallback)")
        elif not self._resend_key:
            logger.warning("⚠️  No email provider configured — emails will be logged only")

    # ── internal dispatcher ───────────────────────────────────────────────────

    def _send(self, to: str, subject: str, html: str) -> Dict[str, Any]:
        """
        Internal send dispatcher.  Tries Resend → Flask-Mail → log-only.
        Returns {"success": bool, "message": str, ...}
        """
        if not to:
            logger.warning("Email skipped — no recipient address")
            return {"success": False, "error": "No recipient address"}

        logger.info(f"📧 Sending '{subject}' → {to}")

        # 1. Resend
        if self._resend:
            try:
                result = self._resend.Emails.send({
                    "from":    self._from_header,
                    "to":      [to],
                    "subject": subject,
                    "html":    html,
                })
                logger.info(f"✅ Sent via Resend (id={result.get('id')})")
                return {"success": True, "provider": "resend", "id": result.get("id")}
            except Exception as e:
                logger.warning(f"⚠️  Resend failed ({e}), trying Flask-Mail…")

        # 2. Flask-Mail
        if self._flaskmail_ok and self._mail:
            try:
                from flask_mail import Message
                msg = Message(
                    subject=subject,
                    recipients=[to],
                    html=html,
                    body=re.sub("<.*?>", "", html),
                    sender=self._from_header,
                )
                self._mail.send(msg)
                logger.info(f"✅ Sent via Flask-Mail")
                return {"success": True, "provider": "flask_mail"}
            except Exception as e:
                logger.error(f"❌ Flask-Mail failed: {e}")
                logger.error(traceback.format_exc())
                return {"success": False, "provider": "flask_mail", "error": str(e)}

        # 3. Log-only fallback
        logger.info(f"📋 Email logged (no provider): subject='{subject}' to='{to}'")
        return {"success": True, "provider": "log_only", "simulated": True}

    # ── public transactional methods ──────────────────────────────────────────

    def send_booking_confirmation(self, booking, user) -> Dict[str, Any]:
        """
        Send when booking.status becomes 'confirmed' after payment.
        booking: Booking ORM object
        user:    User ORM object
        """
        prop        = booking.property.name if booking.property else "your property"
        check_in    = booking.check_in.strftime("%B %d, %Y")
        check_out   = booking.check_out.strftime("%B %d, %Y")

        body = (
            f"<h2>Your booking is confirmed</h2>"
            f"<p>Dear {user.name},</p>"
            f"<p>Great news — your stay at <strong>{prop}</strong> is confirmed and ready.</p>"
            f"<div class='detail-box'>"
            f"<p><strong>Property:</strong> {prop}</p>"
            f"<p><strong>Check-in:</strong>  {check_in}</p>"
            f"<p><strong>Check-out:</strong> {check_out}</p>"
            f"<p><strong>Nights:</strong>    {booking.nights}</p>"
            f"<p><strong>Total paid:</strong> {_fmt_kes(booking.total_amount)}</p>"
            f"</div>"
            f"<p>You can view your booking details in your <a href='https://homesbymwema.com/my-bookings'>dashboard</a>.</p>"
            f"<p>We look forward to hosting you!</p>"
            f"<p>Warm regards,<br><strong>The Homes by Mwema Team</strong></p>"
        )

        return self._send(
            to      = user.email,
            subject = f"Booking Confirmed — {prop}",
            html    = _base("Booking Confirmed", body, booking_id=booking.id),
        )

    def send_payment_received(self, booking, user, payment) -> Dict[str, Any]:
        """
        Send when a payment row is completed (M-PESA or PayPal).
        payment: Payment ORM object
        """
        prop     = booking.property.name if booking.property else "your property"
        method   = (payment.method or "").upper()
        receipt  = payment.mpesa_receipt_number or payment.transaction_id or "—"

        body = (
            f"<h2>Payment received</h2>"
            f"<p>Dear {user.name},</p>"
            f"<p>We've received your payment for <strong>{prop}</strong>.</p>"
            f"<div class='detail-box'>"
            f"<p><strong>Amount:</strong>      {_fmt_kes(payment.amount)}</p>"
            f"<p><strong>Method:</strong>      {method}</p>"
            f"<p><strong>Reference:</strong>   {receipt}</p>"
            f"<p><strong>Date:</strong>        {(payment.completed_at or datetime.utcnow()).strftime('%B %d, %Y %H:%M UTC')}</p>"
            f"</div>"
            f"<p>Your booking is now confirmed. See you soon!</p>"
            f"<p>Warm regards,<br><strong>The Homes by Mwema Team</strong></p>"
        )

        return self._send(
            to      = user.email,
            subject = f"Payment Received — {_fmt_kes(payment.amount)}",
            html    = _base("Payment Received", body, booking_id=booking.id),
        )

    def send_cancellation(self, booking, refund_amount) -> Dict[str, Any]:
        """
        Send when a booking is cancelled.
        refund_amount: float — may be 0 if no refund applies.
        """
        user     = booking.user
        prop     = booking.property.name if booking.property else "your property"
        check_in  = booking.check_in.strftime("%B %d, %Y")
        check_out = booking.check_out.strftime("%B %d, %Y")

        if refund_amount <= 0:
            refund_line = "<p style='color:#dc2626'><strong>Refund:</strong> No refund applicable per cancellation policy.</p>"
        elif float(refund_amount) == float(booking.total_amount):
            refund_line = f"<p style='color:#16a34a'><strong>Refund:</strong> Full refund of {_fmt_kes(refund_amount)} will be processed within 5–7 business days.</p>"
        else:
            refund_line = f"<p style='color:#d97706'><strong>Refund:</strong> Partial refund of {_fmt_kes(refund_amount)} will be processed within 5–7 business days.</p>"

        body = (
            f"<h2>Booking cancelled</h2>"
            f"<p>Dear {user.name},</p>"
            f"<p>Your booking at <strong>{prop}</strong> has been successfully cancelled.</p>"
            f"<div class='detail-box'>"
            f"<p><strong>Property:</strong>  {prop}</p>"
            f"<p><strong>Check-in:</strong>  {check_in}</p>"
            f"<p><strong>Check-out:</strong> {check_out}</p>"
            f"<p><strong>Total:</strong>     {_fmt_kes(booking.total_amount)}</p>"
            + refund_line +
            f"</div>"
            f"<p>Refunds are returned to your original payment method. If you have questions, "
            f"contact us at <a href='mailto:info@homesbymwema.com'>info@homesbymwema.com</a>.</p>"
            f"<p>We hope to welcome you again in the future.</p>"
            f"<p>Warm regards,<br><strong>The Homes by Mwema Team</strong></p>"
        )

        return self._send(
            to      = user.email,
            subject = f"Booking Cancelled — {prop}",
            html    = _base("Booking Cancelled", body, booking_id=booking.id),
        )

    def send_refund_processed(self, booking, user, refund_amount, method: str) -> Dict[str, Any]:
        """
        Send when the admin actually processes the refund payout.
        Called from views/payment.py process_refund() after success.
        """
        prop    = booking.property.name if booking.property else "your property"
        method_display = method.upper() if method else "your original payment method"

        body = (
            f"<h2>Refund processed</h2>"
            f"<p>Dear {user.name},</p>"
            f"<p>Your refund for the cancelled booking at <strong>{prop}</strong> has been processed.</p>"
            f"<div class='detail-box'>"
            f"<p><strong>Refund amount:</strong> {_fmt_kes(refund_amount)}</p>"
            f"<p><strong>Sent via:</strong>      {method_display}</p>"
            f"<p><strong>Date:</strong>           {datetime.utcnow().strftime('%B %d, %Y')}</p>"
            f"</div>"
            f"<p>Funds typically appear within 1–5 business days depending on your provider.</p>"
            f"<p>If you have any questions, reply to this email or contact "
            f"<a href='mailto:info@homesbymwema.com'>info@homesbymwema.com</a>.</p>"
            f"<p>Thank you for your patience.</p>"
            f"<p>Warm regards,<br><strong>The Homes by Mwema Team</strong></p>"
        )

        return self._send(
            to      = user.email,
            subject = f"Refund Processed — {_fmt_kes(refund_amount)}",
            html    = _base("Refund Processed", body, booking_id=booking.id),
        )

    def send_consultation_confirmed(self, consultation: Dict[str, Any], meeting_link: str = None) -> Dict[str, Any]:
        """Send when admin confirms a consultation request."""
        meeting_link  = meeting_link or "https://meet.google.com/your-meeting-link"
        date_obj      = datetime.fromisoformat(consultation["date"].replace("Z", "+00:00"))
        formatted_date = date_obj.strftime("%B %d, %Y")
        formatted_time = f"{consultation['hour']:02d}:{consultation['minute']:02d}"
        name           = consultation.get("name") or consultation.get("user", {}).get("name", "Valued Client")
        email          = consultation.get("email") or consultation.get("user", {}).get("email")

        body = (
            f"<h2>Your consultation is confirmed</h2>"
            f"<p>Dear {name},</p>"
            f"<p>We're pleased to confirm your consultation with our team.</p>"
            f"<div class='detail-box'>"
            f"<p><strong>Date:</strong>         {formatted_date}</p>"
            f"<p><strong>Time:</strong>         {formatted_time}</p>"
            f"<p><strong>Topic:</strong>        {consultation.get('topic', 'General Inquiry')}</p>"
            f"<p><strong>Meeting link:</strong> <a href='{meeting_link}'>{meeting_link}</a></p>"
            f"</div>"
            + (f"<p><strong>Your notes:</strong> {consultation['notes']}</p>" if consultation.get("notes") else "")
            + f"<div style='text-align:center;margin:28px 0'>"
            f"<a href='{meeting_link}' class='btn'>Join consultation</a>"
            f"</div>"
            f"<p>To reschedule, reply to this email or contact "
            f"<a href='mailto:info@homesbymwema.com'>info@homesbymwema.com</a>.</p>"
            f"<p>Warm regards,<br><strong>The Homes by Mwema Team</strong></p>"
        )

        return self._send(
            to      = email,
            subject = "Consultation Confirmed — Homes by Mwema",
            html    = _base("Consultation Confirmed", body),
        )

    def send_consultation_rejected(self, consultation: Dict[str, Any], reason: str = None) -> Dict[str, Any]:
        """Send when admin rejects a consultation request."""
        name  = consultation.get("name") or consultation.get("user", {}).get("name", "Valued Client")
        email = consultation.get("email") or consultation.get("user", {}).get("email")

        reason_block = (
            f"<div class='detail-box'><p><strong>Reason:</strong> {reason}</p></div>"
            if reason else ""
        )

        body = (
            f"<h2>Consultation request update</h2>"
            f"<p>Dear {name},</p>"
            f"<p>Thank you for your interest in consulting with us. Unfortunately we're unable to "
            f"accommodate your request at this time.</p>"
            + reason_block
            + f"<p>We encourage you to schedule again with a different date or time, or reach out "
            f"directly at <a href='mailto:info@homesbymwema.com'>info@homesbymwema.com</a>.</p>"
            f"<p>We value your interest and hope to assist you soon.</p>"
            f"<p>Best regards,<br><strong>The Homes by Mwema Team</strong></p>"
        )

        return self._send(
            to      = email,
            subject = "Update on Your Consultation Request — Homes by Mwema",
            html    = _base("Consultation Request Update", body),
        )


# ─── singleton ──────────────────────────────────────────────────────────────────
# Initialised without a mail instance here.
# In app.py, after mail = Mail(app), call: email_service.attach_mail(mail)
# OR simply pass it at startup: email_service = EmailService(mail)

email_service = EmailService()


def init_email_service(mail_instance) -> EmailService:
    """
    Call this in app.py after Flask-Mail is initialised:

        from views.email_service import init_email_service
        init_email_service(mail)

    Returns the singleton so callers can import it directly.
    """
    global email_service
    email_service = EmailService(mail_instance)
    return email_service