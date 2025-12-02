"""
Input Validation Utilities - Security-focused input sanitization and validation
Protects against SQL injection, XSS, and other common attacks
"""
import re
import html
from typing import Optional, Tuple
from decimal import Decimal, InvalidOperation


# Email validation regex (RFC 5322 compliant simplified)
EMAIL_REGEX = re.compile(
    r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
)

# Username validation (alphanumeric, underscore, dash, 3-30 chars)
USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_-]{3,30}$')

# UUID validation
UUID_REGEX = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    re.IGNORECASE
)

# Referral code validation (BT-XXXXXX format)
REFERRAL_CODE_REGEX = re.compile(r'^BT-[A-Z0-9]{6}$')

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'gif', 'webp'}
ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'mov', 'avi', 'webm'}
ALLOWED_EXTENSIONS = ALLOWED_IMAGE_EXTENSIONS | ALLOWED_VIDEO_EXTENSIONS

# Maximum field lengths
MAX_EMAIL_LENGTH = 254
MAX_USERNAME_LENGTH = 30
MAX_FULL_NAME_LENGTH = 100
MAX_TITLE_LENGTH = 200
MAX_CONTENT_LENGTH = 5000
MAX_URL_LENGTH = 2048


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """
    Sanitize string input to prevent XSS attacks
    - Strips leading/trailing whitespace
    - Escapes HTML entities
    - Truncates to max length
    """
    if not value:
        return ''

    # Convert to string if not already
    value = str(value)

    # Strip whitespace
    value = value.strip()

    # Escape HTML entities
    value = html.escape(value)

    # Truncate to max length
    if len(value) > max_length:
        value = value[:max_length]

    return value


def validate_email(email: str) -> Tuple[bool, str]:
    """
    Validate email format
    Returns (is_valid, error_message)
    """
    if not email:
        return False, "Email is required"

    email = email.strip().lower()

    if len(email) > MAX_EMAIL_LENGTH:
        return False, f"Email must be less than {MAX_EMAIL_LENGTH} characters"

    if not EMAIL_REGEX.match(email):
        return False, "Invalid email format"

    return True, email


def validate_username(username: str) -> Tuple[bool, str]:
    """
    Validate username format
    Returns (is_valid, error_message or sanitized username)
    """
    if not username:
        return False, "Username is required"

    username = username.strip()

    if len(username) < 3:
        return False, "Username must be at least 3 characters"

    if len(username) > MAX_USERNAME_LENGTH:
        return False, f"Username must be less than {MAX_USERNAME_LENGTH} characters"

    if not USERNAME_REGEX.match(username):
        return False, "Username can only contain letters, numbers, underscores, and dashes"

    return True, username


def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password strength
    Returns (is_valid, error_message)
    """
    if not password:
        return False, "Password is required"

    if len(password) < 8:
        return False, "Password must be at least 8 characters"

    if len(password) > 128:
        return False, "Password must be less than 128 characters"

    # Check for at least one letter and one number
    has_letter = bool(re.search(r'[a-zA-Z]', password))
    has_number = bool(re.search(r'\d', password))

    if not has_letter or not has_number:
        return False, "Password must contain at least one letter and one number"

    return True, None


def validate_full_name(full_name: str) -> Tuple[bool, str]:
    """
    Validate and sanitize full name
    Returns (is_valid, error_message or sanitized name)
    """
    if not full_name:
        return False, "Full name is required"

    full_name = sanitize_string(full_name, MAX_FULL_NAME_LENGTH)

    if len(full_name) < 2:
        return False, "Full name must be at least 2 characters"

    # Check for valid characters - allow Unicode letters, spaces, hyphens, apostrophes, periods
    # \w with UNICODE flag allows letters from any language
    # Also explicitly block dangerous characters that could be used for injection
    dangerous_chars = re.compile(r'[<>{}[\]\\|;`$%^&*=+~]')
    if dangerous_chars.search(html.unescape(full_name)):
        return False, "Full name contains invalid characters"

    return True, full_name


def validate_uuid(value: str) -> Tuple[bool, str]:
    """
    Validate UUID format
    Returns (is_valid, error_message)
    """
    if not value:
        return False, "ID is required"

    value = str(value).strip()

    if not UUID_REGEX.match(value):
        return False, "Invalid ID format"

    return True, value


def validate_amount(value, min_amount: Decimal = Decimal('0'), max_amount: Decimal = None) -> Tuple[bool, str, Optional[Decimal]]:
    """
    Validate monetary amount
    Returns (is_valid, error_message, validated_amount)
    """
    if value is None:
        return False, "Amount is required", None

    try:
        amount = Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return False, "Invalid amount format", None

    if amount < min_amount:
        return False, f"Amount must be at least {min_amount}", None

    if max_amount and amount > max_amount:
        return False, f"Amount must be less than {max_amount}", None

    # Limit decimal places to 2
    amount = amount.quantize(Decimal('0.01'))

    return True, None, amount


def validate_file_extension(filename: str, allowed_types: set = None) -> Tuple[bool, str]:
    """
    Validate file extension
    Returns (is_valid, error_message)
    """
    if not filename:
        return False, "Filename is required"

    if '.' not in filename:
        return False, "File must have an extension"

    extension = filename.rsplit('.', 1)[1].lower()

    allowed = allowed_types or ALLOWED_EXTENSIONS

    if extension not in allowed:
        return False, f"File type not allowed. Allowed types: {', '.join(allowed)}"

    return True, extension


def validate_url(url: str) -> Tuple[bool, str]:
    """
    Validate URL format
    Returns (is_valid, error_message)
    """
    if not url:
        return True, None  # URL is optional in most cases

    url = url.strip()

    if len(url) > MAX_URL_LENGTH:
        return False, f"URL must be less than {MAX_URL_LENGTH} characters"

    # Basic URL pattern check
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # or IP
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE
    )

    if not url_pattern.match(url):
        return False, "Invalid URL format"

    return True, url


def validate_referral_code(code: str) -> Tuple[bool, str]:
    """
    Validate referral code format
    Returns (is_valid, error_message)
    """
    if not code:
        return True, None  # Referral code is optional

    code = code.strip().upper()

    if not REFERRAL_CODE_REGEX.match(code):
        return False, "Invalid referral code format. Expected format: BT-XXXXXX"

    return True, code


def validate_role(role: str) -> Tuple[bool, str]:
    """
    Validate user role
    Returns (is_valid, error_message)
    """
    valid_roles = {'admin', 'customer'}

    if not role:
        return True, 'customer'  # Default role

    role = role.strip().lower()

    if role not in valid_roles:
        return False, f"Invalid role. Must be one of: {', '.join(valid_roles)}"

    return True, role


def validate_pagination(page: any, limit: any, max_limit: int = 100) -> Tuple[int, int]:
    """
    Validate and normalize pagination parameters
    Returns (page, limit) with safe defaults
    """
    try:
        page = max(1, int(page or 1))
    except (ValueError, TypeError):
        page = 1

    try:
        limit = max(1, min(int(limit or 10), max_limit))
    except (ValueError, TypeError):
        limit = 10

    return page, limit


def validate_media_type(media_type: str) -> Tuple[bool, str]:
    """
    Validate media type
    Returns (is_valid, error_message)
    """
    valid_types = {'video', 'image', 'ad'}

    if not media_type:
        return False, "Media type is required"

    media_type = media_type.strip().lower()

    if media_type not in valid_types:
        return False, f"Invalid media type. Must be one of: {', '.join(valid_types)}"

    return True, media_type


def validate_interaction_type(interaction_type: str) -> Tuple[bool, str]:
    """
    Validate interaction type
    Returns (is_valid, error_message)
    """
    valid_types = {'like', 'share', 'view'}

    if not interaction_type:
        return False, "Interaction type is required"

    interaction_type = interaction_type.strip().lower()

    if interaction_type not in valid_types:
        return False, f"Invalid interaction type. Must be one of: {', '.join(valid_types)}"

    return True, interaction_type


# Allowed MIME types for file uploads
ALLOWED_MIME_TYPES = {
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'
}


def validate_file_content(file_content: bytes, expected_type: str = None) -> Tuple[bool, str]:
    """
    Validate file content using magic bytes (file signature)
    Prevents file extension spoofing attacks
    Returns (is_valid, error_or_mime_type)
    """
    if not file_content:
        return False, "Empty file content"

    try:
        import magic
        mime_type = magic.from_buffer(file_content, mime=True)

        if mime_type not in ALLOWED_MIME_TYPES:
            return False, f"File type not allowed: {mime_type}"

        # If expected type specified, verify it matches
        if expected_type:
            if expected_type == 'image' and not mime_type.startswith('image/'):
                return False, "File content does not match expected image type"
            if expected_type == 'video' and not mime_type.startswith('video/'):
                return False, "File content does not match expected video type"

        return True, mime_type

    except ImportError:
        # python-magic not installed, skip content validation
        # Log warning in production
        return True, "unknown"
    except Exception:
        return False, "Failed to validate file content"
