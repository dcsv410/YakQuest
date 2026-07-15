import os
import smtplib
from email.message import EmailMessage


def _get_required_setting(name: str) -> str:
    value = os.getenv(name)

    if not value:
        raise RuntimeError(
            f"Missing required email setting: {name}"
        )

    return value


def send_password_reset_email(
    recipient_email: str,
    recipient_name: str | None,
    reset_token: str,
) -> None:
    smtp_host = _get_required_setting(
        "SMTP_HOST"
    )

    smtp_port = int(
        os.getenv("SMTP_PORT", "587")
    )

    smtp_username = _get_required_setting(
        "SMTP_USERNAME"
    )

    smtp_password = _get_required_setting(
        "SMTP_PASSWORD"
    )

    from_email = os.getenv(
        "SMTP_FROM_EMAIL",
        smtp_username,
    )

    from_name = os.getenv(
        "SMTP_FROM_NAME",
        "YakQuest",
    )

    use_tls = os.getenv(
        "SMTP_USE_TLS",
        "true",
    ).lower() in {
        "1",
        "true",
        "yes",
    }

    web_base_url = os.getenv(
        "WEB_BASE_URL",
        "http://localhost:5173",
    ).rstrip("/")

    reset_url = (
        f"{web_base_url}/reset-password"
        f"?token={reset_token}"
    )

    greeting_name = (
        recipient_name
        or recipient_email
    )

    message = EmailMessage()

    message["Subject"] = (
        "Reset your YakQuest password"
    )

    message["From"] = (
        f"{from_name} <{from_email}>"
    )

    message["To"] = recipient_email

    message.set_content(
        f"""Hello {greeting_name},

A password reset was requested for your YakQuest account.

Use the following link to choose a new password:

{reset_url}

This link expires in 30 minutes and can only be used once.

If you did not request this change, you can ignore this email.

YakQuest
"""
    )

    message.add_alternative(
        f"""
        <html>
          <body style="
            font-family: Arial, sans-serif;
            color: #263139;
            line-height: 1.5;
          ">
            <h2>Reset your YakQuest password</h2>

            <p>Hello {greeting_name},</p>

            <p>
              A password reset was requested
              for your YakQuest account.
            </p>

            <p>
              <a
                href="{reset_url}"
                style="
                  display: inline-block;
                  padding: 12px 18px;
                  border-radius: 8px;
                  background: #1f6f4a;
                  color: white;
                  font-weight: bold;
                  text-decoration: none;
                "
              >
                Choose a new password
              </a>
            </p>

            <p>
              This link expires in 30 minutes
              and can only be used once.
            </p>

            <p>
              If you did not request this
              change, you can ignore this
              email.
            </p>
          </body>
        </html>
        """,
        subtype="html",
    )

    with smtplib.SMTP(
        smtp_host,
        smtp_port,
        timeout=30,
    ) as smtp:
        if use_tls:
            smtp.starttls()

        smtp.login(
            smtp_username,
            smtp_password,
        )

        smtp.send_message(message)