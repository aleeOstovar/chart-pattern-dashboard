import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

# Ensure directories exist
MODELS_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

# API Settings
API_V1_PREFIX = "/api/v1"
PROJECT_NAME = "Candlestick Pattern Detection"
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# MongoDB settings
MONGODB_URL = os.getenv("MONGODB_URI", "mongodb://mongodb:27017/candlestick_patterns")
MONGODB_DB_NAME = "candlestick_patterns"

# Redis settings
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

# Model settings
MODEL_CONFIG = {
    "transformer": {
        "model_name": "bert-base-uncased",  # Default model, can be changed
        "num_labels": len([
            "NO_PATTERN",
            "BULLISH_REVERSAL",
            "BEARISH_REVERSAL",
            "CONTINUATION",
            "INDECISION"
        ]),
        "max_length": 128
    }
}

# Pattern detection settings
PATTERN_SETTINGS = {
    "min_pattern_length": 1,
    "max_pattern_length": 4,
    "confidence_threshold": 0.6,
    "use_volume": True
}

# Market data settings
MARKET_DATA = {
    "default_timeframe": "1h",
    "available_timeframes": ["1m", "5m", "15m", "30m", "1h", "4h", "1d"],
    "max_lookback_periods": 500
}

# Cache settings
CACHE_SETTINGS = {
    "pattern_cache_ttl": 3600,  # 1 hour
    "market_data_cache_ttl": 300  # 5 minutes
}

# Backtesting settings
BACKTEST_SETTINGS = {
    "default_period": "1y",
    "available_periods": ["1m", "3m", "6m", "1y", "2y", "5y"],
    "min_trades": 30,
    "transaction_costs": 0.001  # 0.1% per trade
} 