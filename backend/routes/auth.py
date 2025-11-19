from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from models.user_model import create_user, get_user_by_email, get_all_users, update_user, delete_user, get_user_by_id
from services.mlm_service import MLMService
from decimal import Decimal

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

# --------------------------
# Register Endpoint
# --------------------------
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    # Validate required fields
    if not all(k in data for k in ('full_name', 'email', 'username', 'password')):
        return jsonify({'error': 'Missing required fields'}), 400

    # Hash the password
    hashed_pw = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    # Create the user
    user_id, error = create_user(
        full_name=data['full_name'],
        email=data['email'],
        username=data['username'],
        password_hash=hashed_pw,
        role=data.get('role', 'customer'),
        amount=data.get('amount', 0.00)
    )

    # Handle duplicate email/username
    if error:
        return jsonify({'error': error}), 409  # Conflict

    # Auto-activate user in MLM if amount is provided
    mlm_result = None
    amount = data.get('amount', 0)
    if amount and amount > 0:
        try:
            # Get MLM settings
            settings = MLMService.get_settings()
            activation_amount = settings.get('activation_amount', Decimal('1000'))

            # Activate if user has enough amount
            if Decimal(str(amount)) >= activation_amount:
                sponsored_by = data.get('referred_by')  # Optional sponsor
                success, message, result = MLMService.activate_user(
                    user_id=str(user_id),
                    amount=Decimal(str(amount)),
                    sponsored_by=sponsored_by
                )
                mlm_result = {
                    'activated': success,
                    'message': message,
                    'details': result if success else None
                }
        except Exception as e:
            # Don't fail registration if MLM activation fails
            mlm_result = {'activated': False, 'error': str(e)}

    response = {
        'message': 'User registered successfully',
        'user_id': str(user_id)
    }

    if mlm_result:
        response['mlm'] = mlm_result

    return jsonify(response), 201

# --------------------------
# Login Endpoint
# --------------------------
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    # Validate required fields
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Missing email or password'}), 400

    # Fetch user by email
    user = get_user_by_email(data['email'])

    # Check password
    if user and bcrypt.check_password_hash(user['password_hash'], data['password']):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user["id"],
                "full_name": user["full_name"],
                "email": user["email"],
                "role": user["role"],
                "amount": float(user["amount"]) if user.get("amount") else 0.0
            }
        }), 200

    return jsonify({"error": "Invalid email or password"}), 401

# --------------------------
# Check if Email Exists Endpoint
# --------------------------
@auth_bp.route('/check-email', methods=['POST'])
def check_email():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({'error': 'Email is required'}), 400

    user = get_user_by_email(email)
    exists = user is not None

    return jsonify({'exists': exists}), 200

# --------------------------
# Check if Username Exists Endpoint
# --------------------------
@auth_bp.route('/check-username', methods=['POST'])
def check_username():
    data = request.get_json()
    username = data.get('username')

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    from models.user_model import get_user_by_username
    user = get_user_by_username(username)
    exists = user is not None

    return jsonify({'exists': exists}), 200

# --------------------------
# Get All Users Endpoint (Admin)
# --------------------------
@auth_bp.route('/admin/users', methods=['GET'])
def get_users():
    try:
        # Returns all users with MLM fields for admin tree view
        # In production, you would also verify the requesting user is an admin
        users = get_all_users()

        # Format the response
        formatted_users = []
        for user in users:
            formatted_users.append({
                "id": user["id"],
                "full_name": user["full_name"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"],
                "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
                "is_active": user.get("is_active", True),
                "sponsored_by": str(user["sponsored_by"]) if user.get("sponsored_by") else None,
                "is_mlm_active": user.get("is_mlm_active", False),
                "total_earnings": float(user["total_earnings"]) if user.get("total_earnings") else 0.0,
                "referral_code": user.get("referral_code"),
                "activation_date": user["activation_date"].isoformat() if user.get("activation_date") else None,
                "amount": float(user["amount"]) if user.get("amount") else 0.0,
                "commission_received_count": user.get("commission_received_count", 0)
            })

        return jsonify(formatted_users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------
# Update User Endpoint (Admin)
# --------------------------
@auth_bp.route('/admin/users/<user_id>', methods=['PUT'])
def update_user_endpoint(user_id):
    try:
        data = request.get_json()

        # Extract fields to update
        full_name = data.get('full_name')
        email = data.get('email')
        username = data.get('username')
        role = data.get('role')
        amount = data.get('amount')
        is_active = data.get('is_active')

        # Update user
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
            return jsonify({'error': error}), 400 if error == "No fields to update" else 404

        # Format response
        formatted_user = {
            "id": user["id"],
            "full_name": user["full_name"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
            "is_active": user.get("is_active", True),
            "sponsored_by": str(user["sponsored_by"]) if user.get("sponsored_by") else None,
            "is_mlm_active": user.get("is_mlm_active", False),
            "total_earnings": float(user["total_earnings"]) if user.get("total_earnings") else 0.0,
            "referral_code": user.get("referral_code"),
            "activation_date": user["activation_date"].isoformat() if user.get("activation_date") else None,
            "amount": float(user["amount"]) if user.get("amount") else 0.0,
            "commission_received_count": user.get("commission_received_count", 0)
        }

        return jsonify({
            'message': 'User updated successfully',
            'user': formatted_user
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --------------------------
# Delete User Endpoint (Admin)
# --------------------------
@auth_bp.route('/admin/users/<user_id>', methods=['DELETE'])
def delete_user_endpoint(user_id):
    try:
        success, error = delete_user(user_id)

        if error:
            return jsonify({'error': error}), 404

        return jsonify({
            'message': 'User deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
