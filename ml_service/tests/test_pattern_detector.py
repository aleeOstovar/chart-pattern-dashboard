import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.models import PatternDetector
from src.config import PATTERN_SETTINGS

@pytest.fixture
def sample_data():
    """Create sample OHLCV data for testing"""
    dates = pd.date_range(start='2023-01-01', periods=100, freq='1H')
    data = pd.DataFrame({
        'timestamp': dates,
        'open': np.random.normal(100, 2, 100),
        'high': np.random.normal(102, 2, 100),
        'low': np.random.normal(98, 2, 100),
        'close': np.random.normal(101, 2, 100),
        'volume': np.random.normal(1000000, 200000, 100)
    })
    
    # Ensure high is highest and low is lowest
    data['high'] = data[['open', 'high', 'close']].max(axis=1)
    data['low'] = data[['open', 'low', 'close']].min(axis=1)
    
    return data

@pytest.fixture
def pattern_detector():
    """Create a PatternDetector instance"""
    return PatternDetector()

def test_pattern_detector_initialization(pattern_detector):
    """Test pattern detector initialization"""
    assert pattern_detector is not None
    assert hasattr(pattern_detector, 'talib_patterns')
    assert len(pattern_detector.talib_patterns) > 0

def test_talib_pattern_detection(pattern_detector, sample_data):
    """Test TA-Lib pattern detection"""
    patterns = pattern_detector._detect_patterns_talib(sample_data)
    
    assert isinstance(patterns, list)
    for pattern in patterns:
        assert isinstance(pattern, dict)
        assert 'pattern_name' in pattern
        assert 'confidence' in pattern
        assert 'start_index' in pattern
        assert 'end_index' in pattern
        assert 'pattern_type' in pattern
        assert pattern['confidence'] >= PATTERN_SETTINGS['confidence_threshold']

def test_transformer_pattern_detection(pattern_detector, sample_data):
    """Test transformer-based pattern detection"""
    patterns = pattern_detector._detect_patterns_transformer(sample_data)
    
    # Skip test if model is not initialized
    if pattern_detector.model is None:
        pytest.skip("Transformer model not initialized")
    
    assert isinstance(patterns, list)
    for pattern in patterns:
        assert isinstance(pattern, dict)
        assert 'pattern_name' in pattern
        assert 'confidence' in pattern
        assert 'start_index' in pattern
        assert 'end_index' in pattern
        assert 'pattern_type' in pattern
        assert pattern['confidence'] >= PATTERN_SETTINGS['confidence_threshold']

def test_pattern_analysis(pattern_detector, sample_data):
    """Test pattern analysis functionality"""
    # Create a sample pattern
    pattern = {
        'pattern_name': 'TEST_PATTERN',
        'confidence': 0.8,
        'start_index': 5,
        'end_index': 7,
        'pattern_type': 'bullish'
    }
    
    analysis = pattern_detector.analyze_pattern(pattern, sample_data)
    
    assert isinstance(analysis, dict)
    assert 'analysis' in analysis
    assert 'price_change' in analysis['analysis']
    assert 'volume_change' in analysis['analysis']
    assert 'pattern_duration' in analysis['analysis']
    assert 'price_range' in analysis['analysis']
    assert 'volume_intensity' in analysis['analysis']

def test_detect_patterns_integration(pattern_detector, sample_data):
    """Test the complete pattern detection pipeline"""
    patterns = pattern_detector.detect_patterns(sample_data)
    
    assert isinstance(patterns, list)
    if patterns:  # If any patterns were detected
        pattern = patterns[0]
        assert isinstance(pattern, dict)
        assert all(key in pattern for key in [
            'pattern_name', 'confidence', 'start_index',
            'end_index', 'pattern_type'
        ])
        
        # Test pattern analysis
        analysis = pattern_detector.analyze_pattern(pattern, sample_data)
        assert isinstance(analysis, dict)
        assert 'analysis' in analysis

def test_edge_cases(pattern_detector):
    """Test edge cases and error handling"""
    # Test with empty DataFrame
    empty_df = pd.DataFrame()
    patterns = pattern_detector.detect_patterns(empty_df)
    assert isinstance(patterns, list)
    assert len(patterns) == 0
    
    # Test with single row
    single_row = pd.DataFrame({
        'timestamp': [datetime.now()],
        'open': [100],
        'high': [101],
        'low': [99],
        'close': [100.5],
        'volume': [1000000]
    })
    patterns = pattern_detector.detect_patterns(single_row)
    assert isinstance(patterns, list)
    
    # Test with invalid data
    invalid_df = pd.DataFrame({
        'timestamp': [datetime.now()],
        'open': ['invalid'],
        'high': ['invalid'],
        'low': ['invalid'],
        'close': ['invalid'],
        'volume': ['invalid']
    })
    with pytest.raises(Exception):
        pattern_detector.detect_patterns(invalid_df) 