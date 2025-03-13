import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from src.models import PatternBacktester
from src.config import BACKTEST_SETTINGS

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
    data.set_index('timestamp', inplace=True)
    
    return data

@pytest.fixture
def sample_patterns():
    """Create sample pattern occurrences for testing"""
    return [
        {
            'pattern_name': 'DOJI',
            'confidence': 0.8,
            'start_index': 5,
            'end_index': 5,
            'pattern_type': 'bullish'
        },
        {
            'pattern_name': 'ENGULFING',
            'confidence': 0.9,
            'start_index': 20,
            'end_index': 21,
            'pattern_type': 'bearish'
        },
        {
            'pattern_name': 'MORNING_STAR',
            'confidence': 0.85,
            'start_index': 40,
            'end_index': 42,
            'pattern_type': 'bullish'
        }
    ]

@pytest.fixture
def backtester():
    """Create a PatternBacktester instance"""
    return PatternBacktester()

def test_backtester_initialization(backtester):
    """Test backtester initialization"""
    assert backtester is not None
    assert hasattr(backtester, 'transaction_cost')
    assert hasattr(backtester, 'min_trades')
    assert backtester.transaction_cost == BACKTEST_SETTINGS['transaction_costs']
    assert backtester.min_trades == BACKTEST_SETTINGS['min_trades']

def test_calculate_returns(backtester, sample_data, sample_patterns):
    """Test return calculation for pattern trades"""
    trade_results = backtester._calculate_returns(
        sample_data,
        sample_patterns,
        holding_period=5,
        stop_loss=-0.02,
        take_profit=0.04
    )
    
    assert isinstance(trade_results, list)
    assert len(trade_results) > 0
    
    for trade in trade_results:
        assert isinstance(trade, dict)
        assert all(key in trade for key in [
            'pattern_name', 'pattern_type', 'confidence',
            'entry_time', 'exit_time', 'entry_price',
            'exit_price', 'return', 'exit_reason',
            'holding_duration'
        ])
        assert isinstance(trade['return'], float)
        assert isinstance(trade['holding_duration'], int)
        assert trade['holding_duration'] >= 0

def test_calculate_pattern_statistics(backtester, sample_data, sample_patterns):
    """Test pattern statistics calculation"""
    trade_results = backtester._calculate_returns(
        sample_data,
        sample_patterns
    )
    
    stats = backtester._calculate_pattern_statistics(trade_results)
    
    assert isinstance(stats, dict)
    assert all(key in stats for key in [
        'total_trades', 'winning_trades', 'losing_trades',
        'win_rate', 'avg_return', 'std_return',
        'max_return', 'min_return', 'sharpe_ratio',
        'avg_holding_duration', 'max_drawdown'
    ])
    
    assert stats['total_trades'] == len(trade_results)
    assert stats['winning_trades'] + stats['losing_trades'] == stats['total_trades']
    assert 0 <= stats['win_rate'] <= 1

def test_backtest_pattern(backtester, sample_data, sample_patterns):
    """Test complete pattern backtesting"""
    results = backtester.backtest_pattern(
        sample_data,
        sample_patterns,
        holding_period=5,
        stop_loss=-0.02,
        take_profit=0.04
    )
    
    assert isinstance(results, dict)
    assert all(key in results for key in [
        'overall_stats', 'pattern_stats',
        'confidence_stats', 'trade_results'
    ])
    
    # Check overall stats
    assert isinstance(results['overall_stats'], dict)
    assert len(results['overall_stats']) > 0
    
    # Check pattern-specific stats
    assert isinstance(results['pattern_stats'], dict)
    for pattern_name in set(p['pattern_name'] for p in sample_patterns):
        if pattern_name in results['pattern_stats']:
            assert isinstance(results['pattern_stats'][pattern_name], dict)
    
    # Check confidence stats
    assert isinstance(results['confidence_stats'], dict)
    
    # Check trade results
    assert isinstance(results['trade_results'], list)
    assert len(results['trade_results']) > 0

def test_generate_performance_report(backtester, sample_data, sample_patterns):
    """Test performance report generation"""
    backtest_results = backtester.backtest_pattern(
        sample_data,
        sample_patterns
    )
    
    report = backtester.generate_performance_report(backtest_results)
    
    assert isinstance(report, str)
    assert len(report) > 0
    assert "Pattern Performance Report" in report
    assert "Overall Performance" in report
    assert "Performance by Pattern" in report
    assert "Performance by Confidence Level" in report

def test_edge_cases(backtester, sample_data):
    """Test edge cases and error handling"""
    # Test with empty pattern list
    results = backtester.backtest_pattern(sample_data, [])
    assert isinstance(results, dict)
    
    # Test with invalid pattern data
    invalid_patterns = [{
        'pattern_name': 'INVALID',
        'confidence': 'not_a_number',
        'start_index': 'invalid',
        'end_index': 'invalid',
        'pattern_type': 'invalid'
    }]
    results = backtester.backtest_pattern(sample_data, invalid_patterns)
    assert isinstance(results, dict)
    
    # Test with single pattern
    single_pattern = [sample_patterns[0]]
    results = backtester.backtest_pattern(sample_data, single_pattern)
    assert isinstance(results, dict)
    
    # Test report generation with empty results
    report = backtester.generate_performance_report({})
    assert isinstance(report, str)
    assert "No backtest results available" in report 