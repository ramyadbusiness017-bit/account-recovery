from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime

class DeviceGeoInfo(BaseModel):
    ip_address: Optional[str] = None
    country: Optional[str] = "Unknown"
    country_code: Optional[str] = "--"
    city: Optional[str] = "Unknown"
    device_type: Optional[str] = "Desktop"
    os: Optional[str] = "Unknown OS"
    browser: Optional[str] = "Unknown Browser"
    screen_res: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None

class IdentifierLookupRequest(BaseModel):
    identifier: str
    device_info: Optional[DeviceGeoInfo] = None

class IdentifierLookupResponse(BaseModel):
    success: bool
    session_id: str
    email: str
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    masked_email: str
    match_number: int
    expires_in_seconds: int
    country: Optional[str] = None
    city: Optional[str] = None
    device_type: Optional[str] = None
    os: Optional[str] = None
    browser: Optional[str] = None
    target_device_name: Optional[str] = "Apple iPhone 16"
    device_name: Optional[str] = "Apple iPhone 16"
    message: str

class VerifyLastPasswordRequest(BaseModel):
    session_id: str
    password: str
    device_info: Optional[DeviceGeoInfo] = None

class VerifyMatchNumberRequest(BaseModel):
    session_id: str
    chosen_number: int
    token: Optional[str] = None
    device_info: Optional[DeviceGeoInfo] = None

class VerifyOtpRequest(BaseModel):
    session_id: str
    code: str
    device_info: Optional[DeviceGeoInfo] = None

class SessionStatusResponse(BaseModel):
    session_id: str
    status: str
    is_verified: bool
    is_completed: bool
    expires_at: datetime
    method: str
    match_number: Optional[int] = None
    device_name: Optional[str] = None
    device_type: Optional[str] = None
    country: Optional[str] = None
    admin_decision: Optional[str] = "PENDING"

class SwitchMethodRequest(BaseModel):
    session_id: str
    method: str  # NUMBER_MATCH, LAST_PASSWORD, OTP_CODE

class ResetPasswordRequest(BaseModel):
    session_id: str
    new_password: str
    confirm_password: str

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class EmailLogResponse(BaseModel):
    id: int
    to_email: str
    subject: str
    match_number: Optional[int]
    match_options: Optional[List[int]]
    approval_token: Optional[str]
    html_body: str
    delivery_status: str
    sent_at: datetime

    class Config:
        from_attributes = True

class UserAdminResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    action: str
    ip_address: Optional[str]
    country: Optional[str] = None
    city: Optional[str] = None
    device_type: Optional[str] = None
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class VisitorLogResponse(BaseModel):
    id: int
    ip_address: Optional[str]
    country: str
    country_code: str
    city: str
    device_type: str
    os: str
    browser: str
    screen_res: Optional[str]
    timezone: Optional[str]
    language: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
