"""
Flask backend API for the community-driven platform.
Serves welcome content from a static JSON file.
"""
import json
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_DIR = Path(__file__).resolve().parent / "data"
CONTENT_PATH = DATA_DIR / "content.json"


@app.route("/api/welcome", methods=["GET"])
def get_welcome():
    """Return welcome message and features from content.json."""
    try:
        with open(CONTENT_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        return jsonify({"error": "Failed to load content"}), 500


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify(
        {"status": "OK", "timestamp": datetime.utcnow().isoformat() + "Z"}
    )


if __name__ == "__main__":
    port = int(__import__("os").environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=port, debug=True)
