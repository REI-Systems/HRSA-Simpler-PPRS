"""
Flask backend API for the community-driven platform.
Separation of concerns: routes by page/feature (auth, welcome, layout, SVP list, initiate, status, coversheet, selected entities).
"""
import logging
import os

# Load .env first so DATABASE_URL / AZURE_DB_* are set before any DB code runs
from dotenv import load_dotenv
_load_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_load_env_path)

from flask import Flask, jsonify
from flask_cors import CORS

from routes.auth_routes import auth_bp
from routes.welcome_routes import welcome_bp
from routes.layout_routes import layout_bp
from routes.svp_list_routes import svp_list_bp
from routes.svp_initiate_routes import svp_initiate_bp
from routes.svp_status_routes import svp_status_bp
from routes.coversheet_routes import coversheet_bp
from routes.selected_entities_routes import selected_entities_bp
from routes.basic_info_routes import basic_info_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

app = Flask(__name__)
CORS(app)

# Register blueprints (endpoints organized by page/action)
app.register_blueprint(auth_bp)
app.register_blueprint(welcome_bp)
app.register_blueprint(layout_bp)
app.register_blueprint(svp_list_bp)
app.register_blueprint(svp_initiate_bp)
app.register_blueprint(svp_status_bp)
app.register_blueprint(coversheet_bp)
app.register_blueprint(selected_entities_bp)
app.register_blueprint(basic_info_bp)


@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "service": "python-backend"}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=False)
