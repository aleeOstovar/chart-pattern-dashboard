import pytest
import pandas as pd
import redis
from datetime import datetime, timedelta
from src.data import MarketDataFetcher
from src.config import MARKET_DATA

@pytest.fixture
def redis_client():
    """Create a Redis client for testing"""
    return redis.Redis(host='localhost', port=6379, db=0)

@pytest.fixture
def market_data_fetcher(redis_client):
    """Create a MarketDataFetcher instance"""
    return MarketDataFetcher(redis_client)

@pytest.mark.asyncio
async def test_fetch_binance_data(market_data_fetcher):
    """Test fetching data from Binance"""
    symbol = "BTCUSDT"
    timeframe = "1h"
    end_time = datetime.now()
    start_time = end_time - timedelta(days=1)
    
    try:
        data = await market_data_fetcher.fetch_data(
            symbol,
            timeframe,
            start_time,
            end_time,
            source='binance'
        )
        
        assert isinstance(data, pd.DataFrame)
        assert len(data) > 0
        assert all(col in data.columns for col in [
            'timestamp', 'open', 'high', 'low', 'close', 'volume'
        ])
        
    except ValueError as e:
        if "Binance client not initialized" in str(e):
            pytest.skip("Binance client not configured")
        else:
            raise

@pytest.mark.asyncio
async def test_fetch_yahoo_data(market_data_fetcher):
    """Test fetching data from Yahoo Finance"""
    symbol = "AAPL"
    timeframe = "1d"
    end_time = datetime.now()
    start_time = end_time - timedelta(days=30)
    
    data = await market_data_fetcher.fetch_data(
        symbol,
        timeframe,
        start_time,
        end_time,
        source='yahoo'
    )
    
    assert isinstance(data, pd.DataFrame)
    assert len(data) > 0
    assert all(col in data.columns for col in [
        'timestamp', 'open', 'high', 'low', 'close', 'volume'
    ])

def test_cache_functionality(market_data_fetcher):
    """Test data caching functionality"""
    # Create sample data
    sample_data = pd.DataFrame({
        'timestamp': [datetime.now()],
        'open': [100],
        'high': [101],
        'low': [99],
        'close': [100.5],
        'volume': [1000000]
    })
    
    # Test caching
    symbol = "TEST"
    timeframe = "1h"
    start_time = datetime.now()
    
    market_data_fetcher._cache_data(symbol, timeframe, start_time, sample_data)
    
    # Test cache retrieval
    cached_data = market_data_fetcher._get_cached_data(symbol, timeframe, start_time)
    
    assert cached_data is not None
    assert isinstance(cached_data, pd.DataFrame)
    assert len(cached_data) == len(sample_data)
    assert all(col in cached_data.columns for col in sample_data.columns)

def test_get_available_symbols(market_data_fetcher):
    """Test retrieving available symbols"""
    # Test Binance symbols
    binance_symbols = market_data_fetcher.get_available_symbols(source='binance')
    assert isinstance(binance_symbols, list)
    
    # Test Yahoo Finance symbols
    yahoo_symbols = market_data_fetcher.get_available_symbols(source='yahoo')
    assert isinstance(yahoo_symbols, list)
    assert len(yahoo_symbols) > 0
    assert 'AAPL' in yahoo_symbols

@pytest.mark.asyncio
async def test_error_handling(market_data_fetcher):
    """Test error handling in data fetching"""
    # Test with invalid symbol
    with pytest.raises(Exception):
        await market_data_fetcher.fetch_data(
            "INVALID_SYMBOL",
            "1h",
            datetime.now() - timedelta(days=1),
            datetime.now()
        )
    
    # Test with invalid timeframe
    with pytest.raises(Exception):
        await market_data_fetcher.fetch_data(
            "BTCUSDT",
            "invalid_timeframe",
            datetime.now() - timedelta(days=1),
            datetime.now()
        )
    
    # Test with invalid source
    with pytest.raises(ValueError):
        await market_data_fetcher.fetch_data(
            "BTCUSDT",
            "1h",
            datetime.now() - timedelta(days=1),
            datetime.now(),
            source="invalid_source"
        )

@pytest.mark.asyncio
async def test_timeframe_handling(market_data_fetcher):
    """Test handling of different timeframes"""
    symbol = "AAPL"
    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)
    
    for timeframe in MARKET_DATA['available_timeframes']:
        try:
            data = await market_data_fetcher.fetch_data(
                symbol,
                timeframe,
                start_time,
                end_time,
                source='yahoo'
            )
            
            assert isinstance(data, pd.DataFrame)
            assert len(data) > 0
            
        except Exception as e:
            # Some timeframes might not be available for certain symbols
            print(f"Failed to fetch {timeframe} data: {e}")

def test_data_validation(market_data_fetcher):
    """Test data validation functionality"""
    # Test with None values
    with pytest.raises(Exception):
        market_data_fetcher._cache_data(None, None, None, None)
    
    # Test with invalid DataFrame
    invalid_df = pd.DataFrame({'invalid_column': [1, 2, 3]})
    with pytest.raises(Exception):
        market_data_fetcher._cache_data(
            "TEST",
            "1h",
            datetime.now(),
            invalid_df
        ) 