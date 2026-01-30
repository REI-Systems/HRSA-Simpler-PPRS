# Welcome App

A simple full-stack application with Next.js frontend and Python Flask backend, displaying content from a static JSON file.

## Project Structure

- **backend/** - Python Flask API server
- **frontend/** - Next.js application

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (recommended):
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   Or 
   ```bash
   python -m pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   python app.py
   ```
   Or with Flask's development server:
   ```bash
   flask run --port 3001
   ```
   
   The backend will run on `http://localhost:3001`

### Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   
   The frontend will run on `http://localhost:3000`

## Usage

1. Start the backend server first (port 3001)
2. Start the frontend application (port 3000)
3. Open your browser to `http://localhost:3000`
4. You should see the welcome message loaded from the backend API

## Docker

To run the backend with Docker:

```bash
cd backend
docker build -t welcome-backend .
docker run -p 3001:3001 welcome-backend
```

If the build fails with SSL certificate errors (e.g. behind a corporate proxy), use:

```bash
docker build --build-arg PIP_TRUSTED_HOST=1 -t welcome-backend .
```

## Customization

### Changing the Content

Edit `backend/data/content.json` to modify the welcome message and features displayed on the page.

### Future Database Integration

The current setup uses a static JSON file. To swap it for a database:

1. Add your database driver to `requirements.txt` (e.g., `psycopg2-binary`, `pymongo`, `mysql-connector-python`)
2. Update `backend/app.py` to connect to your database
3. Replace the file reading logic in the `/api/welcome` endpoint with database queries
4. The frontend code requires no changes!

## Tech Stack

- **Frontend:** Next.js 14 (React 18)
- **Backend:** Python with Flask
- **Content:** Static JSON file
