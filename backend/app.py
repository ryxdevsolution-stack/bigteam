from flask import Flask, jsonify
from flask_cors import CORS
from routes.auth import auth_bp
from routes.post import post_bp
from routes.advertisement import ad_bp
from routes.feed import feed_bp
from routes.user import user_bp
from routes.team import team_bp
from routes.meetings import meetings_bp
from utils.rate_limiter import init_limiter
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Initialize rate limiter for security
limiter = init_limiter(app)

# Determine environment
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Configure CORS based on environment
if FLASK_ENV == 'production':
    # Production CORS - Allow specific frontend only (no wildcards for security)
    CORS(app, resources={
        r"/*": {
            "origins": [FRONTEND_URL],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
else:
    # Development CORS
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost:3000", "http://localhost:5173"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })


# Security headers middleware
@app.after_request
def set_security_headers(response):
    """Add security headers to all responses"""
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    # XSS protection (legacy browsers)
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    # Content Security Policy
    response.headers['Content-Security-Policy'] = "default-src 'self'; frame-ancestors 'none'"
    # HSTS (only in production)
    if FLASK_ENV == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# Health check endpoint for Render
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "environment": FLASK_ENV}), 200

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(post_bp)
app.register_blueprint(ad_bp)
app.register_blueprint(feed_bp)
app.register_blueprint(user_bp)
app.register_blueprint(team_bp)
app.register_blueprint(meetings_bp)

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    debug = FLASK_ENV != 'production'
    app.run(host="0.0.0.0", port=port, debug=debug)

