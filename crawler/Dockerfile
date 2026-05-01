FROM python:3.12-slim

# Install Chromium dependencies for Crawl4AI
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium
ENV CHROMEDRIVER_PATH=/usr/bin/chromedriver

WORKDIR /app

COPY crawler/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Crawl4AI browser dependencies
RUN crawl4ai-setup

COPY crawler/app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
