# backend/core/email.py
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Protocol, Optional

class EmailService(Protocol):
    """Email service protocol"""
    def send(self, to: str, subject: str, html: Optional[str] = None, text: Optional[str] = None) -> None: ...

class DevConsoleEmailService:
    """Development email service - prints to console"""
    def send(self, to: str, subject: str, html: Optional[str] = None, text: Optional[str] = None) -> None:
        print("\n" + "="*50)
        print("📧 DEV EMAIL")
        print("="*50)
        print(f"To: {to}")
        print(f"Subject: {subject}")
        if text:
            print(f"Text: {text}")
        if html:
            print(f"HTML: {html[:500]}{'...' if len(html) > 500 else ''}")
        print("="*50 + "\n")

class SMTPEmailService:
    """SMTP email service"""
    def __init__(self):
        self.host = os.getenv("SMTP_HOST")
        self.port = int(os.getenv("SMTP_PORT", "587"))
        self.user = os.getenv("SMTP_USER")
        self.password = os.getenv("SMTP_PASS")
        self.sender = os.getenv("SMTP_FROM", self.user)

    def send(self, to: str, subject: str, html: Optional[str] = None, text: Optional[str] = None) -> None:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = self.sender
        msg['To'] = to

        if html and text:
            part1 = MIMEText(text, 'plain')
            part2 = MIMEText(html, 'html')
            msg.attach(part1)
            msg.attach(part2)
        elif html:
            msg.attach(MIMEText(html, 'html'))
        else:
            msg.attach(MIMEText(text or "", 'plain'))

        with smtplib.SMTP(self.host, self.port) as server:
            server.starttls()
            if self.user and self.password:
                server.login(self.user, self.password)
            server.send_message(msg)

class SendGridEmailService:
    """SendGrid email service"""
    def __init__(self):
        self.key = os.getenv("SENDGRID_API_KEY")
        self.sender = os.getenv("SMTP_FROM")

    def send(self, to: str, subject: str, html: Optional[str] = None, text: Optional[str] = None) -> None:
        import json
        import urllib.request

        data = {
            "personalizations": [{"to": [{"email": to}], "subject": subject}],
            "from": {"email": self.sender},
            "content": [{"type": "text/html" if html else "text/plain", "value": html or text or ""}],
        }

        req = urllib.request.Request(
            "https://api.sendgrid.com/v3/mail/send",
            data=json.dumps(data).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.key}",
                "Content-Type": "application/json"
            },
            method="POST",
        )

        with urllib.request.urlopen(req) as _:
            pass

def get_email_service() -> EmailService:
    """Get email service based on environment configuration"""
    provider = (os.getenv("EMAIL_PROVIDER") or "dev").lower()
    
    if provider == "smtp":
        return SMTPEmailService()
    elif provider == "sendgrid":
        return SendGridEmailService()
    else:
        return DevConsoleEmailService()

# Email templates
def get_verification_email_template(link: str, app_name: str = "AI Learning Platform") -> tuple[str, str]:
    """Get email verification template"""
    text = f"""
Welcome to {app_name}!

Please verify your email address by clicking the link below:
{link}

This link will expire in 1 hour.

If you didn't create an account, please ignore this email.

Best regards,
The {app_name} Team
"""
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333;">Welcome to {app_name}!</h2>
    <p>Please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
    <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The {app_name} Team</p>
</body>
</html>
"""
    return text, html

def get_password_reset_email_template(link: str, app_name: str = "AI Learning Platform") -> tuple[str, str]:
    """Get password reset email template"""
    text = f"""
Password Reset Request

You requested to reset your password for {app_name}.

Click the link below to reset your password:
{link}

This link will expire in 30 minutes.

If you didn't request this, please ignore this email.

Best regards,
The {app_name} Team
"""
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #333;">Password Reset Request</h2>
    <p>You requested to reset your password for {app_name}.</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="{link}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
    </div>
    <p style="color: #666; font-size: 14px;">This link will expire in 30 minutes.</p>
    <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
    <p style="color: #999; font-size: 12px;">Best regards,<br>The {app_name} Team</p>
</body>
</html>
"""
    return text, html
