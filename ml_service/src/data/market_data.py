import yfinance as yf
from binance.client import Client
import pandas as pd
from datetime import datetime, timedelta
import logging
from typing import List, Optional, Dict, Any
import redis
import json
from ..config import MARKET_DATA, CACHE_SETTINGS

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MarketDataFetcher:
    def __init__(self, redis_client: redis.Redis):
        self.redis_client = redis_client
        self.binance_client = None
        self._initialize_clients()

    def _initialize_clients(self):
        """Initialize API clients with credentials if available"""
        try:
            self.binance_client = Client()  # Add API keys if needed
        except Exception as e:
            logger.warning(f"Failed to initialize Binance client: {e}")

    def _get_cached_data(self, symbol: str, timeframe: str, start_time: datetime) -> Optional[pd.DataFrame]:
        """Attempt to get cached market data"""
        cache_key = f"market_data:{symbol}:{timeframe}:{start_time.timestamp()}"
        cached_data = self.redis_client.get(cache_key)
        
        if cached_data:
            try:
                data_dict = json.loads(cached_data)
                return pd.DataFrame(data_dict)
            except Exception as e:
                logger.error(f"Error deserializing cached data: {e}")
        
        return None

    def _cache_data(self, symbol: str, timeframe: str, start_time: datetime, data: pd.DataFrame):
        """Cache market data"""
        cache_key = f"market_data:{symbol}:{timeframe}:{start_time.timestamp()}"
        try:
            data_json = data.to_json(orient='records')
            self.redis_client.setex(
                cache_key,
                CACHE_SETTINGS['market_data_cache_ttl'],
                data_json
            )
        except Exception as e:
            logger.error(f"Error caching data: {e}")

    async def fetch_data(
        self,
        symbol: str,
        timeframe: str = MARKET_DATA['default_timeframe'],
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        source: str = 'binance'
    ) -> pd.DataFrame:
        """
        Fetch market data from specified source
        
        Args:
            symbol: Trading pair or stock symbol
            timeframe: Candlestick timeframe
            start_time: Start time for historical data
            end_time: End time for historical data
            source: Data source ('binance', 'yahoo')
            
        Returns:
            DataFrame with OHLCV data
        """
        if not start_time:
            start_time = datetime.now() - timedelta(days=30)
        if not end_time:
            end_time = datetime.now()

        # Check cache first
        cached_data = self._get_cached_data(symbol, timeframe, start_time)
        if cached_data is not None:
            return cached_data

        try:
            if source.lower() == 'binance':
                data = self._fetch_binance_data(symbol, timeframe, start_time, end_time)
            elif source.lower() == 'yahoo':
                data = self._fetch_yahoo_data(symbol, timeframe, start_time, end_time)
            else:
                raise ValueError(f"Unsupported data source: {source}")

            # Cache the fetched data
            self._cache_data(symbol, timeframe, start_time, data)
            
            return data

        except Exception as e:
            logger.error(f"Error fetching market data: {e}")
            raise

    def _fetch_binance_data(
        self,
        symbol: str,
        timeframe: str,
        start_time: datetime,
        end_time: datetime
    ) -> pd.DataFrame:
        """Fetch data from Binance"""
        if not self.binance_client:
            raise ValueError("Binance client not initialized")

        # Convert timeframe to Binance format
        timeframe_map = {
            '1m': Client.KLINE_INTERVAL_1MINUTE,
            '5m': Client.KLINE_INTERVAL_5MINUTE,
            '15m': Client.KLINE_INTERVAL_15MINUTE,
            '30m': Client.KLINE_INTERVAL_30MINUTE,
            '1h': Client.KLINE_INTERVAL_1HOUR,
            '4h': Client.KLINE_INTERVAL_4HOUR,
            '1d': Client.KLINE_INTERVAL_1DAY,
        }

        klines = self.binance_client.get_historical_klines(
            symbol,
            timeframe_map[timeframe],
            start_time.strftime('%Y-%m-%d %H:%M:%S'),
            end_time.strftime('%Y-%m-%d %H:%M:%S')
        )

        df = pd.DataFrame(klines, columns=[
            'timestamp', 'open', 'high', 'low', 'close', 'volume',
            'close_time', 'quote_asset_volume', 'number_of_trades',
            'taker_buy_base_asset_volume', 'taker_buy_quote_asset_volume', 'ignore'
        ])

        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
        
        # Convert string values to float
        for col in ['open', 'high', 'low', 'close', 'volume']:
            df[col] = df[col].astype(float)

        return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]

    def _fetch_yahoo_data(
        self,
        symbol: str,
        timeframe: str,
        start_time: datetime,
        end_time: datetime
    ) -> pd.DataFrame:
        """Fetch data from Yahoo Finance"""
        # Convert timeframe to Yahoo Finance format
        timeframe_map = {
            '1m': '1m',
            '5m': '5m',
            '15m': '15m',
            '30m': '30m',
            '1h': '1h',
            '4h': '4h',
            '1d': '1d',
        }

        ticker = yf.Ticker(symbol)
        df = ticker.history(
            interval=timeframe_map[timeframe],
            start=start_time,
            end=end_time
        )

        df = df.reset_index()
        df.columns = df.columns.str.lower()
        df = df.rename(columns={'date': 'timestamp'})

        return df[['timestamp', 'open', 'high', 'low', 'close', 'volume']]

    def get_available_symbols(self, source: str = 'binance') -> List[str]:
        """Get list of available trading symbols"""
        try:
            if source.lower() == 'binance':
                info = self.binance_client.get_exchange_info()
                return [s['symbol'] for s in info['symbols']]
            elif source.lower() == 'yahoo':
                # Return some common symbols for Yahoo Finance
                return ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META', 'TSLA', 'BTC-USD', 'ETH-USD']
        except Exception as e:
            logger.error(f"Error fetching available symbols: {e}")
            return [] 