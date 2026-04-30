import os


API_KEY = os.environ.get("API_KEY", "dev-key")
CRAWL_TIMEOUT = int(os.environ.get("CRAWL_TIMEOUT", "60"))
REQUEST_DELAY = float(os.environ.get("REQUEST_DELAY", "2.0"))
