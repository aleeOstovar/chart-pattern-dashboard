from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
import numpy as np
import pandas as pd
import talib
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

app = FastAPI(
    title="Candlestick Pattern Detection API",
    description="API for hybrid candlestick pattern detection using TA-Lib and Transformers",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class CandlestickData(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float

class PatternResponse(BaseModel):
    pattern_name: str
    confidence: float
    start_index: int
    end_index: int
    pattern_type: str  # 'bullish' or 'bearish'

class DetectionRequest(BaseModel):
    data: List[CandlestickData]
    timeframe: str
    patterns_to_detect: Optional[List[str]] = None

# Initialize TA-Lib patterns
TALIB_PATTERNS = {
    # Single Candlestick Patterns
    'DOJI': talib.CDLDOJI,
    'HAMMER': talib.CDLHAMMER,
    'SHOOTING_STAR': talib.CDLSHOOTINGSTAR,
    
    # Double Candlestick Patterns
    'ENGULFING': talib.CDLENGULFING,
    'HARAMI': talib.CDLHARAMI,
    'TWEEZER_TOP': talib.CDLTWEEZERBOT,
    
    # Triple Candlestick Patterns
    'MORNING_STAR': talib.CDLMORNINGSTAR,
    'EVENING_STAR': talib.CDLEVENINGSTAR,
    'THREE_WHITE_SOLDIERS': talib.CDL3WHITESOLDIERS,
    'THREE_BLACK_CROWS': talib.CDL3BLACKCROWS
}

# Load transformer model (placeholder - implement actual model loading)
def load_transformer_model():
    # TODO: Implement model loading
    pass

@app.on_event("startup")
async def startup_event():
    # Initialize models and connections
    load_transformer_model()

@app.get("/")
async def root():
    return {"message": "Candlestick Pattern Detection API"}

@app.post("/detect/", response_model=List[PatternResponse])
async def detect_patterns(request: DetectionRequest):
    try:
        # Convert input data to DataFrame
        df = pd.DataFrame([data.dict() for data in request.data])
        
        # Initialize results list
        patterns = []
        
        # Convert OHLCV data to numpy arrays
        open_data = df['open'].values
        high_data = df['high'].values
        low_data = df['low'].values
        close_data = df['close'].values
        volume_data = df['volume'].values
        
        # Apply TA-Lib pattern detection
        for pattern_name, pattern_func in TALIB_PATTERNS.items():
            if request.patterns_to_detect and pattern_name not in request.patterns_to_detect:
                continue
                
            # Get pattern recognition integers (-100 to 100)
            pattern_result = pattern_func(open_data, high_data, low_data, close_data)
            
            # Process the results
            for i, value in enumerate(pattern_result):
                if value != 0:  # Pattern detected
                    confidence = abs(value) / 100.0
                    pattern_type = 'bullish' if value > 0 else 'bearish'
                    
                    patterns.append(PatternResponse(
                        pattern_name=pattern_name,
                        confidence=confidence,
                        start_index=max(0, i-2),  # Consider up to 3 candles before
                        end_index=i,
                        pattern_type=pattern_type
                    ))
        
        # TODO: Add transformer-based pattern detection
        # This will be implemented in a separate function
        
        return patterns
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/patterns/")
async def list_available_patterns():
    return {
        "talib_patterns": list(TALIB_PATTERNS.keys()),
        "ai_patterns": []  # TODO: Add AI-based patterns
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 