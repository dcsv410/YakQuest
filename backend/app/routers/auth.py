import os
from datetime import (
    datetime,
    timedelta,
    timezone,
)

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.email_service import (
    send_password_reset_email,
)
from app.models import (
    CompletedTrip,
    Contribution,
    SavedTrip,
    User,
)
from app.schemas import (
    AuthResponse,
    ChangePasswordRequest,
    DeleteAccountRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    ResetPasswordRequest,
    UserCreate,
    UserOut,
)
from app.security import (
    create_access_token,
    generate_password_reset_token,
    get_current_user,
    hash_password,
    hash_password_reset_token,
    verify_password,
)

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)

MINIMUM_PASSWORD_LENGTH = 8


def validate_new_password(
    password: str,
) -> None:
    if len(password) < MINIMUM_PASSWORD_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must be at least "
                f"{MINIMUM_PASSWORD_LENGTH} "
                "characters long"
            ),
        )


@router.post(
    "/register",
    response_model=AuthResponse,
)
def register(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    email = payload.email.lower().strip()

    validate_new_password(payload.password)

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        email=email,
        display_name=payload.displayName,
        hashed_password=hash_password(
            payload.password
        ),
        is_admin=False,
        trust_score=0,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user)

    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": user,
    }


@router.post(
    "/login",
    response_model=AuthResponse,
)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    email = payload.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if (
        not user
        or not verify_password(
            payload.password,
            user.hashed_password,
        )
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid email or password"
            ),
        )

    token = create_access_token(user)

    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": user,
    }


@router.get(
    "/me",
    response_model=UserOut,
)
def me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user


@router.post(
    "/change-password",
    response_model=MessageResponse,
)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    if not verify_password(
        payload.currentPassword,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Current password is incorrect"
            ),
        )

    validate_new_password(
        payload.newPassword
    )

    if verify_password(
        payload.newPassword,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "New password must be "
                "different from the current "
                "password"
            ),
        )

    current_user.hashed_password = (
        hash_password(payload.newPassword)
    )

    current_user.password_reset_token_hash = (
        None
    )

    current_user.password_reset_expires_at = (
        None
    )

    db.commit()

    return {
        "message": (
            "Your password was changed."
        )
    }


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    generic_response = {
        "message": (
            "If an account exists for that "
            "email address, a password-reset "
            "link has been sent."
        )
    }

    email = payload.email.lower().strip()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:
        return generic_response

    raw_token = (
        generate_password_reset_token()
    )

    user.password_reset_token_hash = (
        hash_password_reset_token(
            raw_token
        )
    )

    reset_minutes = int(
        os.getenv(
            "PASSWORD_RESET_MINUTES",
            "30",
        )
    )

    user.password_reset_expires_at = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=reset_minutes
        )
    ).replace(tzinfo=None)

    db.commit()

    try:
        send_password_reset_email(
            recipient_email=user.email,
            recipient_name=(
                user.display_name
            ),
            reset_token=raw_token,
        )
    except Exception as error:
        print(
            "Failed to send password reset "
            f"email: {error}"
        )

        user.password_reset_token_hash = (
            None
        )

        user.password_reset_expires_at = (
            None
        )

        db.commit()

    return generic_response


@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    validate_new_password(
        payload.newPassword
    )

    token_hash = (
        hash_password_reset_token(
            payload.token
        )
    )

    user = (
        db.query(User)
        .filter(
            User.password_reset_token_hash
            == token_hash
        )
        .first()
    )

    now = datetime.utcnow()

    if (
        not user
        or not user.password_reset_expires_at
        or user.password_reset_expires_at
        < now
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "This password-reset link "
                "is invalid or has expired"
            ),
        )

    user.hashed_password = hash_password(
        payload.newPassword
    )

    user.password_reset_token_hash = None
    user.password_reset_expires_at = None

    db.commit()

    return {
        "message": (
            "Your password was reset. "
            "You can now log in."
        )
    }


@router.delete(
    "/account",
    response_model=MessageResponse,
)
def delete_account(
    payload: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    if payload.confirmation != "DELETE":
        raise HTTPException(
            status_code=400,
            detail=(
                'Type "DELETE" to confirm '
                "account deletion"
            ),
        )

    if not verify_password(
        payload.password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code=400,
            detail="Password is incorrect",
        )

    if current_user.is_admin:
        other_admin_count = (
            db.query(User)
            .filter(
                User.is_admin.is_(True),
                User.id != current_user.id,
            )
            .count()
        )

        if other_admin_count == 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    "You cannot delete the "
                    "only administrator account"
                ),
            )

    db.query(SavedTrip).filter(
        SavedTrip.user_id
        == current_user.id
    ).delete(
        synchronize_session=False
    )

    db.query(CompletedTrip).filter(
        CompletedTrip.user_id
        == current_user.id
    ).delete(
        synchronize_session=False
    )

    db.query(Contribution).filter(
        Contribution.user_id
        == current_user.id,
        Contribution.status.in_(
            ["pending", "submitted", "failed"]
        ),
    ).delete(
        synchronize_session=False
    )

    db.query(Contribution).filter(
        Contribution.user_id
        == current_user.id
    ).update(
        {
            Contribution.user_id: None,
        },
        synchronize_session=False,
    )

    db.delete(current_user)
    db.commit()

    return {
        "message": (
            "Your YakQuest account was "
            "deleted."
        )
    }