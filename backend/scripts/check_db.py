#!/usr/bin/env python3
"""
Check if PostgreSQL is reachable using the app's DATABASE_URL (or AZURE_DB_*).
Run from repo root: python backend/scripts/check_db.py
Or from backend: python scripts/check_db.py
"""
import os
import sys

# Ensure backend is on path and .env is loaded
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from config.database import get_database_url, get_db_connection

def main():
    url = get_database_url()
    # Hide password in output
    if "@" in url and ":" in url:
        try:
            before_at = url.split("@", 1)[0]
            user = before_at.split("//", 1)[-1].split(":")[0]
            host_part = url.split("@", 1)[1]
            safe_url = f"postgresql://{user}:****@{host_part}"
        except Exception:
            safe_url = "postgresql://****"
    else:
        safe_url = url
    print(f"Connecting to: {safe_url}")
    conn = get_db_connection()
    if conn:
        try:
            cur = conn.cursor()
            cur.execute("SELECT 1")
            cur.fetchone()
            cur.close()
            print("PostgreSQL is reachable.")
        finally:
            conn.close()
        return 0
    print("PostgreSQL is not reachable. Check DATABASE_URL or AZURE_DB_* in backend/.env")
    return 1

if __name__ == "__main__":
    sys.exit(main())
