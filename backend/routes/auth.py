from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from models.user_model import create_user, get_user_by_email

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
