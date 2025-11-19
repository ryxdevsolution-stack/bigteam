from flask import Flask, jsonify
from flask_cors import CORS
from .routes.auth import auth_bp
from .routes.post import post_bp
from .routes.advertisement import ad_bp
from .routes.feed import feed_bp
from .routes.user import user_bp
from .routes.mlm import mlm_bp
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Determine environment
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Configure CORS based on environment
if FLASK_ENV == 'production':
    # Production CORS - Allow Vercel frontend
    CORS(app, resources={
        r"/*": {
            "origins": [FRONTEND_URL, "https://*.vercel.app"],
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
app.register_blueprint(mlm_bp)

if __name__ == "__main__":
    port = int(os.getenv('PORT', 5000))
    debug = FLASK_ENV != 'production'
    app.run(host="0.0.0.0", port=port, debug=debug)

