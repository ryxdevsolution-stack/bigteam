"""
Authentication Routes - Secure user registration, login, and admin management
Implements JWT-based authentication with role-based access control
"""
from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from models.user_model import create_user, get_user_by_email, get_user_by_username, get_all_users, get_users_paginated, update_user, delete_user, get_user_by_id
from services.team_service import TeamService
from utils.auth import generate_tokens, verify_token, refresh_access_token, token_required, admin_required, get_current_user_id, blacklist_token, get_token_from_header
from utils.validators import (
    validate_email, validate_username, validate_password, validate_full_name,
    validate_amount, validate_role, sanitize_string, validate_uuid
)
from utils.rate_limiter import limiter
from decimal import Decimal

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()


@auth_bp.route('/register', methods=['POST'])
@limiter.limit("3 per minute")
def register():
    """Register a new user with optional team activation"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    # Validate required fields
    is_valid, result = validate_full_name(data.get('full_name', ''))
    if not is_valid:
        return jsonify({'error': result}), 400
    full_name = result

    is_valid, result = validate_email(data.get('email', ''))
    if not is_valid:
        return jsonify({'error': result}), 400
    email = result

    is_valid, result = validate_username(data.get('username', ''))
    if not is_valid:
        return jsonify({'error': result}), 400
    username = result

    is_valid, error = validate_password(data.get('password', ''))
    if not is_valid:
        return jsonify({'error': error}), 400

    # Validate optional fields
    is_valid, role = validate_role(data.get('role'))
    if not is_valid:
        return jsonify({'error': role}), 400

    # Validate amount if provided
    amount = Decimal('0')
    if data.get('amount'):
        is_valid, error, validated_amount = validate_amount(data.get('amount'), min_amount=Decimal('0'))
        if not is_valid:
            return jsonify({'error': error}), 400
        amount = validated_amount

    # Validate package_id if provided
    package_id = None
    if data.get('package_id'):
        is_valid, error = validate_uuid(data.get('package_id'))
        if not is_valid:
            return jsonify({'error': 'Invalid package ID'}), 400
        package_id = data.get('package_id')

    # Hash the password
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    # Create the user (team activation is handled in user_model if amount > 0)
    user_id, error = create_user(
        full_name=full_name,
        email=email,
        username=username,
        password_hash=hashed_pw,
        role=role,
        amount=float(amount),
        package_id=package_id
    )

    if error:
        return jsonify({'error': error}), 409

    # Get user data for token generation
    user = get_user_by_id(user_id)

    # Generate JWT tokens
    tokens = generate_tokens(
        user_id=str(user_id),
        role=role,
        email=email
    )

    return jsonify({
        'message': 'User registered successfully',
        'user': {
            'id': str(user_id),
            'full_name': full_name,
            'email': email,
            'username': username,
            'role': role,
            'is_active_member': user.get('is_mlm_active', False) if user else False
        },
        **tokens
    }), 201


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """Authenticate user and return JWT tokens"""
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body required'}), 400

    # Get login identifier (can be email or username)
    login_id = data.get('email', '').strip()
    if not login_id:
        return jsonify({'error': 'Email or username is required'}), 401

    password = data.get('password', '')
    if not password:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Try to fetch user by email first, then by username
    user = None
    if '@' in login_id:
        is_valid, result = validate_email(login_id)
        if is_valid:
            user = get_user_by_email(result)

    if not user:
        user = get_user_by_username(login_id)

    # Check password
    if not user or not bcrypt.check_password_hash(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Check if user is active
    if not user.get('is_active', True):
        return jsonify({'error': 'Account is deactivated'}), 401

    # Generate JWT tokens
    tokens = generate_tokens(
        user_id=str(user['id']),
        role=user['role'],
        email=user['email']
    )

    return jsonify({
        'message': 'Login successful',
        'user': {
            'id': str(user['id']),
            'full_name': user['full_name'],
            'email': user['email'],
            'username': user.get('username', ''),
            'role': user['role'],
            'is_active_member': user.get('is_mlm_active', False),
            'total_earnings': float(user.get('total_earnings', 0)),
            'available_balance': float(user.get('available_balance', 0))
        },
        **tokens
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("10 per minute")
def refresh_token():
    """Refresh access token using refresh token"""
    data = request.get_json()

    refresh_token_value = data.get('refresh_token') if data else None

    if not refresh_token_value:
        return jsonify({'error': 'Refresh token required'}), 400

    try:
        tokens = refresh_access_token(refresh_token_value)
        # Blacklist the old refresh token (rotation)
        blacklist_token(refresh_token_value, token_type='refresh')
        return jsonify(tokens), 200
    except Exception:
        return jsonify({'error': 'Invalid or expired refresh token'}), 401


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Logout user and blacklist the access token"""
    # Get the current token and blacklist it
    token = get_token_from_header()
    if token:
        blacklist_token(token, token_type='access')

    # Also blacklist refresh token if provided
    data = request.get_json() or {}
    refresh_token = data.get('refresh_token')
    if refresh_token:
        blacklist_token(refresh_token, token_type='refresh')

    return jsonify({'message': 'Logged out successfully'}), 200


@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current authenticated user's profile"""
    user_id = get_current_user_id()
    user = get_user_by_id(user_id)

    if not user:
        return jsonify({'error': 'User not found'}), 404

    return jsonify({
        'user': {
            'id': str(user['id']),
            'full_name': user['full_name'],
            'email': user['email'],
            'username': user.get('username', ''),
            'role': user['role'],
            'is_active_member': user.get('is_mlm_active', False),
            'total_earnings': float(user.get('total_earnings', 0)),
            'available_balance': float(user.get('available_balance', 0)),
            'created_at': user['created_at'].isoformat() if user.get('created_at') else None
        }
    }), 200


@auth_bp.route('/check-email', methods=['POST'])
@limiter.limit("20 per minute")
def check_email():
    """Check if email is already registered"""
    data = request.get_json()

    is_valid, result = validate_email(data.get('email', '') if data else '')
    if not is_valid:
        return jsonify({'error': result}), 400

    user = get_user_by_email(result)
    return jsonify({'exists': user is not None}), 200


@auth_bp.route('/check-username', methods=['POST'])
@limiter.limit("20 per minute")
def check_username():
    """Check if username is already registered"""
    data = request.get_json()

    is_valid, result = validate_username(data.get('username', '') if data else '')
    if not is_valid:
        return jsonify({'error': result}), 400

    from models.user_model import get_user_by_username
    user = get_user_by_username(result)
    return jsonify({'exists': user is not None}), 200


# Admin-only endpoints

@auth_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_users():
    """
    Get users with pagination and filters (admin only)
    Query params:
    - page: Page number (default: 1)
    - limit: Items per page (default: 50, max: 100)
    - search: Search term for name/email/username
    - role: Filter by role ('admin', 'customer')
    - status: Filter by status ('active', 'inactive', 'mlm_active')
    """
    try:
        # Parse pagination params with validation
        try:
            page_raw = request.args.get('page', 1, type=int)
            limit_raw = request.args.get('limit', 50, type=int)

            # Validate and cap pagination params to prevent DoS
            page = max(1, min(10000, page_raw)) if page_raw else 1
            limit = max(1, min(100, limit_raw)) if limit_raw else 50
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid pagination parameters'}), 400

        # Parse and validate filter params
        search = request.args.get('search', '').strip() or None
        role_filter = request.args.get('role', '').strip() or None
        status_filter = request.args.get('status', '').strip() or None

        # Validate role filter against whitelist
        if role_filter and role_filter not in ('admin', 'customer'):
            role_filter = None

        # Validate status filter against whitelist
        if status_filter and status_filter not in ('active', 'inactive', 'mlm_active'):
            status_filter = None

        # Sanitize search input
        if search:
            search = sanitize_string(search, max_length=100)

        users, total_count = get_users_paginated(
            page=page,
            limit=limit,
            search=search,
            role_filter=role_filter,
            status_filter=status_filter
        )

        formatted_users = []
        for user in users:
            formatted_users.append({
                'id': str(user['id']),
                'full_name': user['full_name'],
                'username': user.get('username', ''),
                'email': user['email'],
                'role': user['role'],
                'created_at': user['created_at'].isoformat() if user.get('created_at') else None,
                'is_active': user.get('is_active', True),
                'is_active_member': user.get('is_active_member', False),
                'total_earnings': float(user.get('total_earnings', 0)),
                'activation_date': user['activation_date'].isoformat() if user.get('activation_date') else None,
                'amount': float(user.get('amount', 0)),
                'commission_received_count': user.get('commission_received_count', 0)
            })

        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 0

        return jsonify({
            'data': formatted_users,
            'pagination': {
                'page': page,
                'limit': limit,
                'total_count': total_count,
                'total_pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }), 200
    except Exception:
        return jsonify({'error': 'Failed to fetch users'}), 500


@auth_bp.route('/admin/users/<user_id>', methods=['PUT'])
@admin_required
def update_user_endpoint(user_id):
    """Update user (admin only)"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        # Validate and sanitize fields
        full_name = None
        if data.get('full_name'):
            is_valid, result = validate_full_name(data['full_name'])
            if not is_valid:
                return jsonify({'error': result}), 400
            full_name = result

        email = None
        if data.get('email'):
            is_valid, result = validate_email(data['email'])
            if not is_valid:
                return jsonify({'error': result}), 400
            email = result

        username = None
        if data.get('username'):
            is_valid, result = validate_username(data['username'])
            if not is_valid:
                return jsonify({'error': result}), 400
            username = result

        role = None
        if data.get('role'):
            is_valid, result = validate_role(data['role'])
            if not is_valid:
                return jsonify({'error': result}), 400
            role = result

        amount = None
        if data.get('amount') is not None:
            is_valid, error, validated_amount = validate_amount(data['amount'])
            if not is_valid:
                return jsonify({'error': error}), 400
            amount = float(validated_amount)

        is_active = data.get('is_active')

        user, error = update_user(
            user_id=user_id,
            full_name=full_name,
            email=email,
            username=username,
            role=role,
            amount=amount,
            is_active=is_active
        )

        if error:
            status_code = 400 if error == "No fields to update" else 404
            return jsonify({'error': error}), status_code

        formatted_user = {
            'id': str(user['id']),
            'full_name': user['full_name'],
            'username': user.get('username', ''),
            'email': user['email'],
            'role': user['role'],
            'created_at': user['created_at'].isoformat() if user.get('created_at') else None,
            'is_active': user.get('is_active', True),
            'is_active_member': user.get('is_active_member', False),
            'total_earnings': float(user.get('total_earnings', 0)),
            'activation_date': user['activation_date'].isoformat() if user.get('activation_date') else None,
            'amount': float(user.get('amount', 0)),
            'commission_received_count': user.get('commission_received_count', 0)
        }

        return jsonify({
            'message': 'User updated successfully',
            'user': formatted_user
        }), 200
    except Exception:
        return jsonify({'error': 'Failed to update user'}), 500


@auth_bp.route('/admin/users/<user_id>', methods=['DELETE'])
@limiter.limit("5 per minute")
@admin_required
def delete_user_endpoint(user_id):
    """Delete user (admin only) with business logic validation"""
    try:
        # Validate user_id format
        is_valid, error = validate_uuid(user_id)
        if not is_valid:
            return jsonify({'error': error}), 400

        # Prevent admin from deleting themselves
        current_user_id = get_current_user_id()
        if str(current_user_id) == str(user_id):
            return jsonify({'error': 'Cannot delete your own account'}), 400

        # SECURITY: Check business logic constraints before deletion
        # Check if user exists and get their data
        user = get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Prevent deleting users with pending balance (financial integrity)
        if user.get('pending_balance', 0) > 0:
            return jsonify({'error': 'Cannot delete user with pending balance. Please settle balance first.'}), 400

        # Check if user has active team members (MLM chain integrity)
        team_members = TeamService.get_user_team_members(user_id)
        if team_members and len(team_members) > 0:
            return jsonify({
                'error': 'Cannot delete user with active team members. Reassign or remove team members first.',
                'team_member_count': len(team_members)
            }), 400

        success, error = delete_user(user_id)

        if error:
            return jsonify({'error': error}), 404

        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception:
        return jsonify({'error': 'Failed to delete user'}), 500
