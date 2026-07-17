import re
import time
from collections import defaultdict

from fastapi import (
    APIRouter,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
)

from app.email_service import (
    send_trip_plan_email,
)


router = APIRouter(
    prefix="/trip-plans",
    tags=["trip-plans"],
)


MAX_PDF_SIZE_BYTES = (
    10 * 1024 * 1024
)

MAX_EMAILS_PER_HOUR = 5

email_attempts: dict[
    str,
    list[float],
] = defaultdict(list)


def _validate_email(
    email: str,
) -> bool:
    return bool(
        re.fullmatch(
            r"[^@\s]+@[^@\s]+\.[^@\s]+",
            email,
        )
    )


def _safe_pdf_filename(
    filename: str,
) -> str:
    safe_name = re.sub(
        r"[^a-zA-Z0-9._-]+",
        "_",
        filename,
    ).strip("._")

    if not safe_name:
        safe_name = (
            "yakquest_trip_plan.pdf"
        )

    if not safe_name.lower().endswith(
        ".pdf"
    ):
        safe_name += ".pdf"

    return safe_name[:180]


def _enforce_email_limit(
    request: Request,
) -> None:
    client_ip = (
        request.client.host
        if request.client
        else "unknown"
    )

    now = time.time()
    one_hour_ago = now - 3600

    recent_attempts = [
        attempt
        for attempt in email_attempts[
            client_ip
        ]
        if attempt > one_hour_ago
    ]

    if (
        len(recent_attempts)
        >= MAX_EMAILS_PER_HOUR
    ):
        raise HTTPException(
            status_code=429,
            detail=(
                "Too many trip-plan emails "
                "have been requested. Please "
                "try again later."
            ),
        )

    recent_attempts.append(now)

    email_attempts[
        client_ip
    ] = recent_attempts


@router.post("/email")
async def email_trip_plan(
    request: Request,
    recipient_email: str = Form(...),
    river_name: str = Form(...),
    state: str = Form(...),
    launch_name: str = Form(...),
    takeout_name: str = Form(...),
    distance_miles: float = Form(...),
    estimated_time: str = Form(...),
    planned_launch: str | None = Form(
        None
    ),
    pdf: UploadFile = File(...),
):
    _enforce_email_limit(request)

    recipient_email = (
        recipient_email
        .strip()
        .lower()
    )

    if not _validate_email(
        recipient_email
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Enter a valid email "
                "address."
            ),
        )

    river_name = river_name.strip()
    state = state.strip()
    launch_name = launch_name.strip()
    takeout_name = takeout_name.strip()
    estimated_time = (
        estimated_time.strip()
    )

    if (
        not river_name
        or not state
        or not launch_name
        or not takeout_name
        or not estimated_time
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "The trip plan is missing "
                "required information."
            ),
        )

    if (
        pdf.content_type
        != "application/pdf"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "The attachment must be "
                "a PDF."
            ),
        )

    pdf_bytes = await pdf.read()

    if not pdf_bytes:
        raise HTTPException(
            status_code=400,
            detail=(
                "The generated PDF was empty."
            ),
        )

    if (
        len(pdf_bytes)
        > MAX_PDF_SIZE_BYTES
    ):
        raise HTTPException(
            status_code=413,
            detail=(
                "The generated PDF exceeds "
                "the 10 MB email limit."
            ),
        )

    if not pdf_bytes.startswith(
        b"%PDF"
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "The attachment is not a "
                "valid PDF."
            ),
        )

    filename = _safe_pdf_filename(
        pdf.filename
        or "yakquest_trip_plan.pdf"
    )

    try:
        send_trip_plan_email(
            recipient_email=(
                recipient_email
            ),
            pdf_bytes=pdf_bytes,
            pdf_filename=filename,
            river_name=river_name,
            state=state,
            launch_name=launch_name,
            takeout_name=takeout_name,
            distance_miles=(
                distance_miles
            ),
            estimated_time=(
                estimated_time
            ),
            planned_launch=(
                planned_launch.strip()
                if planned_launch
                else None
            ),
        )
    except Exception as error:
        print(
            "Unable to email trip plan:",
            error,
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "YakQuest could not send "
                "the trip-plan email."
            ),
        ) from error

    return {
        "message": (
            "The trip plan was emailed "
            "successfully."
        )
    }