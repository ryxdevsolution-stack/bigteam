"""
Authentication Utilities - JWT Token Management and Security Middleware
Implements secure token generation, validation, and role-based access control
Includes token blacklisting for secure logout
"""
import os
import jwt
import functools
import hashlib
from datetime import datetime, timedelta
from flask import request, jsonify, g
from dotenv import load_dotenv

load_dotenv()

# Get secret key from environment (NEVER hardcode)
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 3600))  # 1 hour default
JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800))  # 7 days default
JWT_ALGORITHM = 'HS256'

# Validate secret key exists
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")

# Token blacklist storage (uses Redis if available, falls back to in-memory)
_token_blacklist = set()
_redis_client = None

def _get_redis_client():
    """Get Redis client for token blacklisting"""
    global _redis_client
    if _redis_client is None:
        try:
            import redis
            redis_url = os.getenv('REDIS_URL')
            if redis_url:
                _redis_client = redis.from_url(redis_url)
                _redis_client.ping()
            else:
                _redis_client = False  # No Redis configured
        except Exception:
            _redis_client = False  # Redis not available
    return _redis_client if _redis_client else None


def _get_token_hash(token: str) -> str:
    """Get hash of token for blacklist storage (avoids storing actual tokens)"""
    return hashlib.sha256(token.encode()).hexdigest()


def blacklist_token(token: str, token_type: str = 'access') -> bool:
    """
    Add a token to the blacklist
    Returns True if successful
    """
    try:
        token_hash = _get_token_hash(token)
        redis_client = _get_redis_client()

        # Calculate TTL based on token type
        ttl = JWT_ACCESS_TOKEN_EXPIRES if token_type == 'access' else JWT_REFRESH_TOKEN_EXPIRES

        if redis_client:
            # Use Redis with expiration
            redis_client.setex(f"blacklist:{token_hash}", ttl, "1")
        else:
            # Fall back to in-memory set (not suitable for multi-instance deployments)
            _token_blacklist.add(token_hash)

        return True
    except Exception:
        return False


def is_token_blacklisted(token: str) -> bool:
    """Check if a token is blacklisted"""
    try:
        token_hash = _get_token_hash(token)
        redis_client = _get_redis_client()

        if redis_client:
            return redis_client.exists(f"blacklist:{token_hash}") > 0
        else:
            return token_hash in _token_blacklist
    except Exception:
        return False


def generate_tokens(user_id: str, role: str, email: str) -> dict:
    """
    Generate access and refresh tokens for a user
    Returns dict with access_token, refresh_token, and expires_in
    """
    now = datetime.utcnow()

    # Access token payload
    access_payload = {
        'user_id': str(user_id),
        'role': role,
        'email': email,
        'type': 'access',
        'iat': now,
        'exp': now + timedelta(seconds=JWT_ACCESS_TOKEN_EXPIRES)
    }

    # Refresh token payload
    refresh_payload = {
        'user_id': str(user_id),
        'type': 'refresh',
        'iat': now,
        'exp': now + timedelta(seconds=JWT_REFRESH_TOKEN_EXPIRES)
    }

    access_token = jwt.encode(access_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'expires_in': JWT_ACCESS_TOKEN_EXPIRES,
        'token_type': 'Bearer'
    }


def verify_token(token: str, token_type: str = 'access') -> dict:
    """
    Verify and decode a JWT token
    Returns decoded payload or raises exception
    """
    try:
        # Check if token is blacklisted
        if is_token_blacklisted(token):
            raise jwt.InvalidTokenError("Token has been revoked")

        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

        # Verify token type
        if payload.get('type') != token_type:
            raise jwt.InvalidTokenError(f"Invalid token type. Expected {token_type}")

        return payload
    except jwt.ExpiredSignatureError:
        raise jwt.ExpiredSignatureError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise jwt.InvalidTokenError(f"Invalid token: {str(e)}")


def refresh_access_token(refresh_token: str) -> dict:
    """
    Generate new access token from refresh token
    Returns new tokens or raises exception
    """
    # Verify refresh token
    payload = verify_token(refresh_token, token_type='refresh')

    # Get user info from database to ensure user still exists and is active
    from models.user_model import get_user_by_id
    user = get_user_by_id(payload['user_id'])

    if not user:
        raise jwt.InvalidTokenError("User not found")

    if not user.get('is_active', True):
        raise jwt.InvalidTokenError("User account is deactivated")

    # Generate new tokens
    return generate_tokens(
        user_id=str(user['id']),
        role=user['role'],
        email=user['email']
    )


def get_token_from_header() -> str:
    """
    Extract token from Authorization header
    Expected format: Bearer <token>
    """
    auth_header = request.headers.get('Authorization', '')

    if not auth_header:
        return None

    parts = auth_header.split()

    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return None

    return parts[1]


def token_required(f):
    """
    Decorator to require valid access token for endpoint
    Sets g.current_user with decoded token payload
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()

        if not token:
            return jsonify({'error': 'Authorization token required'}), 401

        try:
            payload = verify_token(token, token_type='access')
            g.current_user = {
                'user_id': payload['user_id'],
                'role': payload['role'],
                'email': payload['email']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'error': str(e)}), 401

        return f(*args, **kwargs)

    return decorated


def admin_required(f):
    """
    Decorator to require admin role
    Must be used after @token_required
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_header()

        if not token:
            return jsonify({'error': 'Authorization token required'}), 401

        try:
            payload = verify_token(token, token_type='access')

            if payload.get('role') != 'admin':
                return jsonify({'error': 'Admin access required'}), 403

            g.current_user = {
                'user_id': payload['user_id'],
                'role': payload['role'],
                'email': payload['email']
            }
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired', 'code': 'TOKEN_EXPIRED'}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({'error': str(e)}), 401

        return f(*args, **kwargs)

    return decorated


def get_current_user_id() -> str:
    """
    Get current user ID from request context
    Must be called within @token_required decorated function
    """
    if hasattr(g, 'current_user'):
        return g.current_user.get('user_id')
    return None


def get_current_user_role() -> str:
    """
    Get current user role from request context
    Must be called within @token_required decorated function
    """
    if hasattr(g, 'current_user'):
        return g.current_user.get('role')
    return None


def validate_user_access(user_id: str) -> bool:
    """
    Validate that current user can access resource belonging to user_id
    Admins can access any resource, users can only access their own
    """
    current_user_id = get_current_user_id()
    current_role = get_current_user_role()

    if not current_user_id:
        return False

    # Admins can access any resource
    if current_role == 'admin':
        return True

    # Users can only access their own resources
    return str(current_user_id) == str(user_id)
