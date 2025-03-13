import numpy as np
import pandas as pd
import talib
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from typing import List, Dict, Any, Tuple
import logging
from ..config import MODEL_CONFIG, PATTERN_SETTINGS

logger = logging.getLogger(__name__)

class PatternDetector:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self._initialize_model()
        self._initialize_talib_patterns()

    def _initialize_model(self):
        """Initialize the transformer model for pattern detection"""
        try:
            model_name = MODEL_CONFIG['transformer']['model_name']
            self.tokenizer = AutoTokenizer.from_pretrained(model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                model_name,
                num_labels=MODEL_CONFIG['transformer']['num_labels']
            )
            self.model.eval()
        except Exception as e:
            logger.error(f"Error initializing transformer model: {e}")
            self.model = None
            self.tokenizer = None

    def _initialize_talib_patterns(self):
        """Initialize TA-Lib pattern detection functions"""
        self.talib_patterns = {
            # Single Candlestick Patterns
            'DOJI': (talib.CDLDOJI, 1),
            'HAMMER': (talib.CDLHAMMER, 1),
            'SHOOTING_STAR': (talib.CDLSHOOTINGSTAR, 1),
            'SPINNING_TOP': (talib.CDLSPINNINGTOP, 1),
            'MARUBOZU': (talib.CDLMARUBOZU, 1),
            
            # Double Candlestick Patterns
            'ENGULFING': (talib.CDLENGULFING, 2),
            'HARAMI': (talib.CDLHARAMI, 2),
            'PIERCING': (talib.CDLPIERCING, 2),
            'DARK_CLOUD_COVER': (talib.CDLDARKCLOUDCOVER, 2),
            
            # Triple Candlestick Patterns
            'MORNING_STAR': (talib.CDLMORNINGSTAR, 3),
            'EVENING_STAR': (talib.CDLEVENINGSTAR, 3),
            'THREE_WHITE_SOLDIERS': (talib.CDL3WHITESOLDIERS, 3),
            'THREE_BLACK_CROWS': (talib.CDL3BLACKCROWS, 3),
            'THREE_INSIDE_UP': (talib.CDL3INSIDE, 3),
            'THREE_OUTSIDE_UP': (talib.CDL3OUTSIDE, 3),
            
            # Complex Patterns
            'ABANDONED_BABY': (talib.CDLABANDONEDBABY, 3),
            'BREAKAWAY': (talib.CDLBREAKAWAY, 5),
            'KICKING': (talib.CDLKICKING, 2),
            'LADDER_BOTTOM': (talib.CDLLADDERBOTTOM, 5)
        }

    def _prepare_data_for_transformer(self, ohlcv_data: pd.DataFrame) -> torch.Tensor:
        """
        Convert OHLCV data to a format suitable for the transformer model
        """
        # Calculate returns and normalize data
        data = ohlcv_data.copy()
        for col in ['open', 'high', 'low', 'close']:
            data[f'{col}_return'] = data[col].pct_change()
        data['volume_change'] = data['volume'].pct_change()
        
        # Create feature matrix
        features = data[[
            'open_return', 'high_return', 'low_return',
            'close_return', 'volume_change'
        ]].fillna(0).values
        
        # Scale features to [-1, 1] range
        features = np.clip(features, -1, 1)
        
        # Convert to tensor
        return torch.tensor(features, dtype=torch.float32)

    def _detect_patterns_talib(
        self,
        ohlcv_data: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        Detect patterns using TA-Lib functions
        """
        patterns = []
        
        for pattern_name, (pattern_func, length) in self.talib_patterns.items():
            try:
                # Get pattern recognition integers (-100 to 100)
                pattern_result = pattern_func(
                    ohlcv_data['open'].values,
                    ohlcv_data['high'].values,
                    ohlcv_data['low'].values,
                    ohlcv_data['close'].values
                )
                
                # Process the results
                for i, value in enumerate(pattern_result):
                    if abs(value) >= PATTERN_SETTINGS['confidence_threshold'] * 100:
                        confidence = abs(value) / 100.0
                        pattern_type = 'bullish' if value > 0 else 'bearish'
                        
                        patterns.append({
                            'pattern_name': pattern_name,
                            'confidence': confidence,
                            'start_index': max(0, i - length + 1),
                            'end_index': i,
                            'pattern_type': pattern_type,
                            'detection_method': 'talib'
                        })
                        
            except Exception as e:
                logger.error(f"Error detecting {pattern_name}: {e}")
                
        return patterns

    @torch.no_grad()
    def _detect_patterns_transformer(
        self,
        ohlcv_data: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        Detect patterns using the transformer model
        """
        if self.model is None or self.tokenizer is None:
            return []
            
        patterns = []
        window_size = 10  # Look at 10 candles at a time
        
        try:
            # Prepare data
            features = self._prepare_data_for_transformer(ohlcv_data)
            
            # Slide window over the data
            for i in range(len(features) - window_size + 1):
                window = features[i:i + window_size]
                
                # Get model predictions
                outputs = self.model(window.unsqueeze(0))
                probabilities = torch.softmax(outputs.logits, dim=1)
                prediction = torch.argmax(probabilities, dim=1).item()
                confidence = probabilities[0][prediction].item()
                
                if confidence >= PATTERN_SETTINGS['confidence_threshold']:
                    pattern_type = self._get_pattern_type(prediction)
                    if pattern_type:
                        patterns.append({
                            'pattern_name': f"AI_PATTERN_{pattern_type}",
                            'confidence': confidence,
                            'start_index': i,
                            'end_index': i + window_size - 1,
                            'pattern_type': pattern_type.lower(),
                            'detection_method': 'transformer'
                        })
                        
        except Exception as e:
            logger.error(f"Error in transformer pattern detection: {e}")
            
        return patterns

    def _get_pattern_type(self, prediction: int) -> str:
        """Map model prediction to pattern type"""
        pattern_types = [
            "NO_PATTERN",
            "BULLISH_REVERSAL",
            "BEARISH_REVERSAL",
            "CONTINUATION",
            "INDECISION"
        ]
        return pattern_types[prediction] if prediction < len(pattern_types) else "UNKNOWN"

    def detect_patterns(
        self,
        ohlcv_data: pd.DataFrame,
        use_ml: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Detect patterns using both TA-Lib and transformer model
        
        Args:
            ohlcv_data: DataFrame with OHLCV data
            use_ml: Whether to use the transformer model
            
        Returns:
            List of detected patterns with their properties
        """
        patterns = self._detect_patterns_talib(ohlcv_data)
        
        if use_ml and self.model is not None:
            ml_patterns = self._detect_patterns_transformer(ohlcv_data)
            patterns.extend(ml_patterns)
            
        # Sort patterns by confidence
        patterns.sort(key=lambda x: x['confidence'], reverse=True)
        
        return patterns

    def analyze_pattern(
        self,
        pattern: Dict[str, Any],
        ohlcv_data: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Analyze a detected pattern for additional insights
        
        Args:
            pattern: Detected pattern information
            ohlcv_data: OHLCV data
            
        Returns:
            Dictionary with pattern analysis
        """
        start_idx = pattern['start_index']
        end_idx = pattern['end_index']
        pattern_data = ohlcv_data.iloc[start_idx:end_idx + 1]
        
        analysis = {
            'price_change': (
                pattern_data['close'].iloc[-1] - pattern_data['close'].iloc[0]
            ) / pattern_data['close'].iloc[0],
            'volume_change': (
                pattern_data['volume'].iloc[-1] - pattern_data['volume'].iloc[0]
            ) / pattern_data['volume'].iloc[0],
            'pattern_duration': len(pattern_data),
            'price_range': (
                pattern_data['high'].max() - pattern_data['low'].min()
            ) / pattern_data['close'].mean(),
            'volume_intensity': pattern_data['volume'].mean() / ohlcv_data['volume'].mean()
        }
        
        return {**pattern, 'analysis': analysis} 