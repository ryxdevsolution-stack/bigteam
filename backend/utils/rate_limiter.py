"""
Rate Limiter Configuration - Protects endpoints from brute force and DoS attacks
Uses Flask-Limiter with Redis backend for distributed rate limiting
"""
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Redis URL for distributed rate limiting (falls back to memory if not available)
REDIS_URL = os.getenv('REDIS_URL', 'memory://')

# Initialize limiter (to be attached to Flask app in app.py)
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=REDIS_URL,
    default_limits=["200 per minute", "50 per second"],
    strategy="fixed-window"
)


# Rate limit configurations for different endpoint types
AUTH_LIMITS = {
    'login': "5 per minute",           # Prevent brute force attacks
    'register': "3 per minute",          # Prevent mass account creation
    'refresh': "10 per minute",          # Token refresh
    'password_reset': "3 per minute",    # Password reset requests
    'check_email': "20 per minute",      # Email availability checks
    'check_username': "20 per minute"    # Username availability checks
}

SENSITIVE_LIMITS = {
    'admin': "30 per minute",            # Admin operations
    'mlm_purchase': "5 per minute",      # MLM purchases
    'file_upload': "10 per minute"       # File uploads
}

API_LIMITS = {
    'read': "100 per minute",            # Read operations
    'write': "30 per minute"             # Write operations
}


def get_limit_string(limit_type: str, operation: str) -> str:
    """Get rate limit string for a specific operation"""
    limits = {
        'auth': AUTH_LIMITS,
        'sensitive': SENSITIVE_LIMITS,
        'api': API_LIMITS
    }
    return limits.get(limit_type, {}).get(operation, "60 per minute")


def init_limiter(app):
    """Initialize the rate limiter with the Flask app"""
    limiter.init_app(app)
    return limiter
