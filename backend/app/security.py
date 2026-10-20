import bcrypt
import secrets
import string
import random
from typing import List

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except Exception:
        return False

def generate_secure_token(length: int = 48) -> str:
    """Generate a URL-safe cryptographically secure random token."""
    return secrets.token_urlsafe(length)

def generate_otp_code(length: int = 6) -> str:
    """Generate a 6-digit numeric OTP code."""
    return "".join(secrets.choice(string.digits) for _ in range(length))

def generate_match_challenge() -> tuple[int, List[int]]:
    """
    Generate the Google-style 2-digit matching challenge:
    Returns (target_number, [option_1, option_2, option_3])
    e.g. (74, [29, 74, 61])
    """
    target = random.randint(11, 99)
    distractors = set()
    while len(distractors) < 2:
        dist = random.randint(11, 99)
        if dist != target:
            distractors.add(dist)
    
    options = list(distractors) + [target]
    random.shuffle(options)
    return target, options

def mask_email(email: str) -> str:
    """Mask email for privacy display e.g. igwikejerome@gmail.com -> ig***e@gmail.com"""
    try:
        user_part, domain_part = email.split('@')
        if len(user_part) <= 2:
            masked_user = user_part[0] + "***"
        else:
            masked_user = user_part[:2] + "***" + user_part[-1]
        return f"{masked_user}@{domain_part}"
    except Exception:
        return email
