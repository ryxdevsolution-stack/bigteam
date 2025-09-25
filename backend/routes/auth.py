from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from models.user_model import create_user, get_user_by_email, get_all_users

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
        role=data.get('role', 'customer')
    )

    # Handle duplicate email/username
    if error:
        return jsonify({'error': error}), 409  # Conflict

    return jsonify({'message': 'User registered successfully', 'user_id': user_id}), 201

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
                "role": user["role"]
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
        # Returns only customer users (excludes admin accounts)
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
                "is_active": user.get("is_active", True)
            })

        return jsonify(formatted_users), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
