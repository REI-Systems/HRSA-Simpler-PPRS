# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install/update CA certificates (helps with SSL verify in corporate environments)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better layer caching
COPY requirements.txt .

# Optional: set PIP_TRUSTED_HOST=1 when building behind a corporate proxy that breaks SSL
ARG PIP_TRUSTED_HOST=0
RUN if [ "$PIP_TRUSTED_HOST" = "1" ]; then \
      pip install --no-cache-dir --trusted-host pypi.org --trusted-host files.pythonhosted.org -r requirements.txt; \
    else \
      pip install --no-cache-dir -r requirements.txt; \
    fi

# Copy application code
COPY . .

# Expose port 3001
EXPOSE 3001

# Set environment variable for port (can be overridden)
ENV PORT=3001

# Run the application
CMD ["python", "app.py"]
