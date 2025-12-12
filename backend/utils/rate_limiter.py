"""
Rate Limiter Configuration - Protects endpoints from brute force and DoS attacks
Uses Flask-Limiter with Redis backend for distributed rate limiting

IMPORTANT: Redis is REQUIRED in production for rate limiting to work across workers.
Without Redis, each of the 8 workers has independent counters, effectively
multiplying rate limits by 8 (5/min becomes 40/min total).
"""
import os
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Redis URL for distributed rate limiting
# CRITICAL: In production, this MUST be a real Redis URL, not 'memory://'
REDIS_URL = os.getenv('REDIS_URL')

if not REDIS_URL:
    env = os.getenv('FLASK_ENV', 'development')
    if env == 'production':
        print("⚠️ CRITICAL: REDIS_URL not set in production - rate limiting will NOT work correctly!")
    REDIS_URL = 'memory://'

# Initialize limiter (to be attached to Flask app in app.py)
# Increased limits to support 1000+ concurrent users:
# - 600/minute = 10 requests/second per IP (reasonable for normal browsing)
# - 100/second global burst allows for peak traffic
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=REDIS_URL,
    default_limits=["600 per minute", "100 per second"],
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
