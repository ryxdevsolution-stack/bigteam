from flask import Flask
from flask_cors import CORS
from routes.auth import auth_bp
from routes.post import post_bp

app = Flask(__name__)

CORS(app)

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(post_bp)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

