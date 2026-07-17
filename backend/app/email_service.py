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


def _send_email_message(
    message: EmailMessage,
) -> None:
    smtp_host = _get_required_setting(
        "SMTP_HOST"
    )

    smtp_port = int(
        os.getenv(
            "SMTP_PORT",
            "587",
        )
    )

    smtp_username = _get_required_setting(
        "SMTP_USERNAME"
    )

    smtp_password = _get_required_setting(
        "SMTP_PASSWORD"
    )

    use_tls = os.getenv(
        "SMTP_USE_TLS",
        "true",
    ).lower() in {
        "1",
        "true",
        "yes",
    }

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


def send_password_reset_email(
    recipient_email: str,
    recipient_name: str | None,
    reset_token: str,
) -> None:
    smtp_username = _get_required_setting(
        "SMTP_USERNAME"
    )

    from_email = os.getenv(
        "SMTP_FROM_EMAIL",
        smtp_username,
    )

    from_name = os.getenv(
        "SMTP_FROM_NAME",
        "YakQuest",
    )

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

    _send_email_message(message)


def send_trip_plan_email(
    recipient_email: str,
    pdf_bytes: bytes,
    pdf_filename: str,
    river_name: str,
    state: str,
    launch_name: str,
    takeout_name: str,
    distance_miles: float,
    estimated_time: str,
    planned_launch: str | None = None,
) -> None:
    smtp_username = _get_required_setting(
        "SMTP_USERNAME"
    )

    from_email = os.getenv(
        "TRIP_SMTP_FROM_EMAIL",
        "trips@yakquest.com",
    )

    from_name = os.getenv(
        "TRIP_SMTP_FROM_NAME",
        "YakQuest Trips",
    )

    message = EmailMessage()

    message["Subject"] = (
        f"YakQuest Trip Plan: "
        f"{river_name}"
    )

    message["From"] = (
        f"{from_name} <{from_email}>"
    )

    message["To"] = recipient_email

    launch_time_text = (
        planned_launch
        if planned_launch
        else "Not specified"
    )

    message.set_content(
        f"""Your YakQuest trip plan is attached.

River: {river_name}, {state}
Launch: {launch_name}
Takeout: {takeout_name}
Distance: {distance_miles:.2f} miles
Estimated time: {estimated_time}
Expected launch: {launch_time_text}

Please verify current weather, river flow, access conditions, and safety information before beginning your trip.

Have a safe trip!

YakQuest
"""
    )

    message.add_alternative(
        f"""
        <html>
          <body style="
            font-family: Arial, sans-serif;
            color: #263139;
            line-height: 1.55;
          ">
            <h2>Your YakQuest Trip Plan</h2>

            <p>
              Your printable trip-plan PDF
              is attached to this email.
            </p>

            <table
              style="
                border-collapse: collapse;
                margin: 18px 0;
              "
            >
              <tr>
                <td style="
                  padding: 6px 18px 6px 0;
                  font-weight: bold;
                ">
                  River
                </td>

                <td>
                  {river_name}, {state}
                </td>
              </tr>

              <tr>
                <td style="
                  padding: 6px 18px 6px 0;
                  font-weight: bold;
                ">
                  Launch
                </td>

                <td>{launch_name}</td>
              </tr>

              <tr>
                <td style="
                  padding: 6px 18px 6px 0;
                  font-weight: bold;
                ">
                  Takeout
                </td>

                <td>{takeout_name}</td>
              </tr>

              <tr>
                <td style="
                  padding: 6px 18px 6px 0;
                  font-weight: bold;
                ">
                  Distance
                </td>

                <td>
                  {distance_miles:.2f} miles
                </td>
              </tr>

              <tr>
                <td style="
                  padding: 6px 18px 6px 0;
                  font-weight: bold;
                ">
                  Estimated time
                </td>

                <td>{estimated_time}</td>
              </tr>

              <tr>
                <td style="
                  padding: 6px 18px 6px 0;
                  font-weight: bold;
                ">
                  Expected launch
                </td>

                <td>{launch_time_text}</td>
              </tr>
            </table>

            <p>
              Please verify current weather,
              river flow, access conditions,
              and safety information before
              beginning your trip.
            </p>

            <p>Have a safe trip!</p>

            <p>YakQuest</p>
          </body>
        </html>
        """,
        subtype="html",
    )

    message.add_attachment(
        pdf_bytes,
        maintype="application",
        subtype="pdf",
        filename=pdf_filename,
    )

    _send_email_message(message)