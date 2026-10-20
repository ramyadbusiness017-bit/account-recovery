import smtplib
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models import EmailLog

def generate_recovery_email_html(
    to_email: str,
    match_number: int,
    match_options: List[int],
    approval_token: str,
    otp_code: str,
    ip_address: str = "127.0.0.1",
    user_agent: str = "Chrome on Windows"
) -> str:
    """
    Builds a sleek, dark-and-accent responsive security email template
    featuring the 3-number tap choice (Google-style) and 1-click verification.
    """
    options_buttons_html = ""
    for opt in match_options:
        # Link directly verifies the number
        verify_url = f"{settings.FRONTEND_URL}/?action=verify_match&token={approval_token}&num={opt}"
        options_buttons_html += f"""
        <a href="{verify_url}" style="
            display: inline-block;
            background-color: #1e293b;
            color: #38bdf8;
            font-size: 26px;
            font-weight: 700;
            text-decoration: none;
            padding: 18px 28px;
            margin: 0 10px 10px 10px;
            border-radius: 12px;
            border: 1px solid #334155;
            min-width: 44px;
            text-align: center;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        ">{opt}</a>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Gonnit Security Alert</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #090d16; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
              
              <!-- Brand Header -->
              <tr>
                <td style="padding: 32px 32px 20px 32px; border-bottom: 1px solid #1e293b;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td align="left">
                        <div style="display: inline-flex; align-items: center; gap: 10px;">
                          <div style="background: linear-gradient(135deg, #0ea5e9, #6366f1); border-radius: 10px; width: 36px; height: 36px; display: inline-block; vertical-align: middle; line-height: 36px; text-align: center; color: white; font-weight: 800; font-size: 20px;">G</div>
                          <span style="font-size: 22px; font-weight: 700; color: #ffffff; vertical-align: middle; margin-left: 8px; letter-spacing: -0.5px;">Gonnit</span>
                        </div>
                      </td>
                      <td align="right">
                        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #38bdf8; background-color: rgba(56, 189, 248, 0.1); padding: 4px 10px; border-radius: 20px;">Security Alert</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Email Body -->
              <tr>
                <td style="padding: 32px;">
                  <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                    Is it you trying to recover your account?
                  </h1>
                  <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #94a3b8;">
                    A recovery request was initiated for your Gonnit account (<strong style="color: #f1f5f9;">{to_email}</strong>).
                  </p>

                  <!-- Instruction Box -->
                  <div style="background: rgba(14, 165, 233, 0.05); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px;">
                    <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #e2e8f0;">
                      Check the number shown on your recovery screen, then tap the matching number below:
                    </p>
                    <div style="padding: 10px 0;">
                      {options_buttons_html}
                    </div>
                  </div>

                  <!-- Backup OTP Option -->
                  <div style="background-color: #1e293b; border-radius: 12px; padding: 18px 20px; margin-bottom: 28px; border: 1px solid #334155;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #94a3b8; font-weight: 500;">
                      Can't tap a number? Enter this 6-digit verification code on your screen instead:
                    </p>
                    <p style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #38bdf8; font-family: monospace;">
                      {otp_code}
                    </p>
                  </div>

                  <!-- Device Metadata Info -->
                  <div style="border-top: 1px solid #1e293b; padding-top: 20px; margin-top: 20px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Request Details</p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #94a3b8;"><strong>Device:</strong> {user_agent}</p>
                    <p style="margin: 0; font-size: 13px; color: #94a3b8;"><strong>IP Address:</strong> {ip_address}</p>
                  </div>

                  <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                    If you did not request this recovery, you can safely ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #475569;">
                    &copy; 2026 Gonnit Inc. All rights reserved. Secure Identity & Account Protection.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """
    return html


def send_recovery_email(
    db: Session,
    to_email: str,
    match_number: int,
    match_options: List[int],
    approval_token: str,
    otp_code: str,
    ip_address: str = "127.0.0.1",
    user_agent: str = "Chrome on Windows"
) -> EmailLog:
    """
    Dispatches the email:
    1. Always logs to database table EmailLog for local inbox view & admin audits.
    2. If SMTP is configured, sends via real SMTP connection.
    """
    subject = f"Gonnit Security: Account recovery request (Number: {match_number})"
    html_body = generate_recovery_email_html(
        to_email=to_email,
        match_number=match_number,
        match_options=match_options,
        approval_token=approval_token,
        otp_code=otp_code,
        ip_address=ip_address,
        user_agent=user_agent
    )

    delivery_status = "LOCAL_INBOX"

    # Attempt real SMTP if configured
    if settings.SMTP_ENABLED and settings.SMTP_HOST:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM}>"
            msg["To"] = to_email

            text_body = f"Gonnit Account Recovery.\nMatch number: {match_number}\nOr use 6-digit OTP: {otp_code}"
            part1 = MIMEText(text_body, "plain")
            part2 = MIMEText(html_body, "html")
            msg.attach(part1)
            msg.attach(part2)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                if settings.SMTP_USER and settings.SMTP_PASS:
                    server.login(settings.SMTP_USER, settings.SMTP_PASS)
                server.sendmail(settings.SMTP_FROM, [to_email], msg.as_string())
            delivery_status = "SENT_SMTP"
        except Exception as e:
            print(f"[EmailService Error] SMTP sending failed: {e}")
            delivery_status = f"SMTP_FAILED_LOCAL_SAVED"

    email_log = EmailLog(
        to_email=to_email,
        subject=subject,
        match_number=match_number,
        match_options=json.dumps(match_options),
        approval_token=approval_token,
        html_body=html_body,
        delivery_status=delivery_status
    )
    db.add(email_log)
    db.commit()
    db.refresh(email_log)
    return email_log
