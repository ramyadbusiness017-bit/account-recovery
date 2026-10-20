import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import EmailLog, RecoverySession
from app.schemas import EmailLogResponse, StandardResponse

router = APIRouter(prefix="/api/emails", tags=["Email Log & Webhook"])

@router.get("/recent")
def get_recent_emails(
    limit: int = Query(15, ge=1, le=50),
    to_email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns recent emails for live in-browser preview and dev testing.
    """
    query = db.query(EmailLog)
    if to_email:
        query = query.filter(EmailLog.to_email == to_email)
    
    logs = query.order_by(desc(EmailLog.sent_at)).limit(limit).all()
    
    results = []
    for log in logs:
        try:
            options = json.loads(log.match_options) if log.match_options else []
        except Exception:
            options = []
            
        results.append({
            "id": log.id,
            "to_email": log.to_email,
            "subject": log.subject,
            "match_number": log.match_number,
            "match_options": options,
            "approval_token": log.approval_token,
            "html_body": log.html_body,
            "delivery_status": log.delivery_status,
            "sent_at": log.sent_at.isoformat()
        })
    return results


@router.get("/{email_id}")
def get_email_detail(email_id: int, db: Session = Depends(get_db)):
    """
    Returns full raw HTML and details of an email by ID.
    """
    log = db.query(EmailLog).filter(EmailLog.id == email_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Email not found.")
    
    try:
        options = json.loads(log.match_options) if log.match_options else []
    except Exception:
        options = []

    return {
        "id": log.id,
        "to_email": log.to_email,
        "subject": log.subject,
        "match_number": log.match_number,
        "match_options": options,
        "approval_token": log.approval_token,
        "html_body": log.html_body,
        "delivery_status": log.delivery_status,
        "sent_at": log.sent_at.isoformat()
    }


@router.post("/verify-link", response_model=StandardResponse)
def verify_via_email_link(token: str, chosen_number: int, db: Session = Depends(get_db)):
    """
    Called when a user clicks one of the 3 match numbers in their email.
    Validates token & number, marks session as VERIFIED.
    """
    session = db.query(RecoverySession).filter(RecoverySession.approval_token == token).first()
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or expired security token.")

    if session.status != "PENDING":
        return StandardResponse(success=True, message=f"Session is already {session.status.lower()}.")

    if chosen_number != session.match_number:
        raise HTTPException(status_code=400, detail="Incorrect number selected. Please try again.")

    from datetime import datetime
    session.status = "VERIFIED"
    session.verified_at = datetime.utcnow()
    db.commit()

    return StandardResponse(
        success=True,
        message="Match confirmed! Return to your original tab to reset your password.",
        data={"session_id": session.id}
    )
