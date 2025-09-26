from flask import Flask
from flask_cors import CORS
from routes.auth import auth_bp
from routes.post import post_bp
from routes.advertisement import ad_bp
from routes.feed import feed_bp

app = Flask(__name__)

# Configure CORS with explicit settings
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(post_bp)
app.register_blueprint(ad_bp)
app.register_blueprint(feed_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

