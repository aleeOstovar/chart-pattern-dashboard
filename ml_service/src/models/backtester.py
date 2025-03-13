import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from ..config import BACKTEST_SETTINGS

logger = logging.getLogger(__name__)

class PatternBacktester:
    def __init__(self):
        self.transaction_cost = BACKTEST_SETTINGS['transaction_costs']
        self.min_trades = BACKTEST_SETTINGS['min_trades']

    def _calculate_returns(
        self,
        data: pd.DataFrame,
        pattern_occurrences: List[Dict[str, Any]],
        holding_period: int = 5,
        stop_loss: float = -0.02,
        take_profit: float = 0.04
    ) -> List[Dict[str, Any]]:
        """
        Calculate returns for each pattern occurrence
        
        Args:
            data: OHLCV data
            pattern_occurrences: List of detected patterns
            holding_period: Number of candles to hold the position
            stop_loss: Stop loss percentage
            take_profit: Take profit percentage
            
        Returns:
            List of trade results
        """
        trade_results = []
        
        for pattern in pattern_occurrences:
            entry_idx = pattern['end_index'] + 1
            if entry_idx >= len(data) - 1:
                continue
                
            entry_price = data['open'].iloc[entry_idx]
            pattern_type = pattern['pattern_type']
            is_long = pattern_type == 'bullish'
            
            # Track position
            position_active = True
            exit_idx = entry_idx
            exit_price = entry_price
            exit_reason = 'holding_period'
            
            # Simulate trading
            for i in range(entry_idx + 1, min(entry_idx + holding_period + 1, len(data))):
                current_price = data['close'].iloc[i]
                returns = (current_price - entry_price) / entry_price
                
                if is_long:
                    if returns <= stop_loss:
                        exit_price = entry_price * (1 + stop_loss)
                        exit_idx = i
                        exit_reason = 'stop_loss'
                        break
                    elif returns >= take_profit:
                        exit_price = entry_price * (1 + take_profit)
                        exit_idx = i
                        exit_reason = 'take_profit'
                        break
                else:  # Short position
                    if returns >= -stop_loss:
                        exit_price = entry_price * (1 - stop_loss)
                        exit_idx = i
                        exit_reason = 'stop_loss'
                        break
                    elif returns <= -take_profit:
                        exit_price = entry_price * (1 - take_profit)
                        exit_idx = i
                        exit_reason = 'take_profit'
                        break
                        
                exit_price = current_price
                
            # Calculate trade metrics
            trade_return = (exit_price - entry_price) / entry_price
            if not is_long:
                trade_return = -trade_return
                
            # Account for transaction costs
            trade_return -= self.transaction_cost * 2
            
            trade_results.append({
                'pattern_name': pattern['pattern_name'],
                'pattern_type': pattern_type,
                'confidence': pattern['confidence'],
                'entry_time': data.index[entry_idx],
                'exit_time': data.index[exit_idx],
                'entry_price': entry_price,
                'exit_price': exit_price,
                'return': trade_return,
                'exit_reason': exit_reason,
                'holding_duration': exit_idx - entry_idx
            })
            
        return trade_results

    def _calculate_pattern_statistics(
        self,
        trade_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Calculate performance statistics for pattern trades
        """
        if not trade_results:
            return {}
            
        returns = [t['return'] for t in trade_results]
        
        stats = {
            'total_trades': len(trade_results),
            'winning_trades': sum(1 for r in returns if r > 0),
            'losing_trades': sum(1 for r in returns if r <= 0),
            'win_rate': sum(1 for r in returns if r > 0) / len(returns),
            'avg_return': np.mean(returns),
            'std_return': np.std(returns),
            'max_return': max(returns),
            'min_return': min(returns),
            'sharpe_ratio': np.mean(returns) / np.std(returns) if np.std(returns) > 0 else 0,
            'avg_holding_duration': np.mean([t['holding_duration'] for t in trade_results])
        }
        
        # Calculate drawdown
        cumulative_returns = np.cumprod(1 + np.array(returns))
        running_max = np.maximum.accumulate(cumulative_returns)
        drawdowns = (cumulative_returns - running_max) / running_max
        stats['max_drawdown'] = np.min(drawdowns)
        
        return stats

    def backtest_pattern(
        self,
        data: pd.DataFrame,
        pattern_occurrences: List[Dict[str, Any]],
        holding_period: int = 5,
        stop_loss: float = -0.02,
        take_profit: float = 0.04
    ) -> Dict[str, Any]:
        """
        Backtest pattern performance
        
        Args:
            data: OHLCV data
            pattern_occurrences: List of detected patterns
            holding_period: Number of candles to hold the position
            stop_loss: Stop loss percentage
            take_profit: Take profit percentage
            
        Returns:
            Dictionary with backtest results
        """
        try:
            # Calculate trade results
            trade_results = self._calculate_returns(
                data,
                pattern_occurrences,
                holding_period,
                stop_loss,
                take_profit
            )
            
            if len(trade_results) < self.min_trades:
                logger.warning(
                    f"Insufficient trades ({len(trade_results)}) "
                    f"for reliable statistics. Minimum required: {self.min_trades}"
                )
                
            # Calculate overall statistics
            overall_stats = self._calculate_pattern_statistics(trade_results)
            
            # Calculate statistics by pattern type
            pattern_stats = {}
            for pattern in set(t['pattern_name'] for t in trade_results):
                pattern_trades = [t for t in trade_results if t['pattern_name'] == pattern]
                pattern_stats[pattern] = self._calculate_pattern_statistics(pattern_trades)
                
            # Calculate statistics by confidence level
            confidence_brackets = [(0.6, 0.7), (0.7, 0.8), (0.8, 0.9), (0.9, 1.0)]
            confidence_stats = {}
            
            for low, high in confidence_brackets:
                bracket_trades = [
                    t for t in trade_results
                    if low <= t['confidence'] < high
                ]
                if bracket_trades:
                    confidence_stats[f"{low:.1f}-{high:.1f}"] = \
                        self._calculate_pattern_statistics(bracket_trades)
            
            return {
                'overall_stats': overall_stats,
                'pattern_stats': pattern_stats,
                'confidence_stats': confidence_stats,
                'trade_results': trade_results
            }
            
        except Exception as e:
            logger.error(f"Error in backtesting: {e}")
            return {}

    def generate_performance_report(
        self,
        backtest_results: Dict[str, Any]
    ) -> str:
        """
        Generate a human-readable performance report
        
        Args:
            backtest_results: Results from backtest_pattern
            
        Returns:
            Formatted performance report
        """
        if not backtest_results:
            return "No backtest results available."
            
        overall_stats = backtest_results['overall_stats']
        
        report = [
            "Pattern Performance Report",
            "========================\n",
            "Overall Performance:",
            f"Total Trades: {overall_stats['total_trades']}",
            f"Win Rate: {overall_stats['win_rate']:.2%}",
            f"Average Return: {overall_stats['avg_return']:.2%}",
            f"Sharpe Ratio: {overall_stats['sharpe_ratio']:.2f}",
            f"Maximum Drawdown: {overall_stats['max_drawdown']:.2%}\n",
            "Performance by Pattern:",
            "----------------------"
        ]
        
        for pattern, stats in backtest_results['pattern_stats'].items():
            if stats['total_trades'] >= self.min_trades:
                report.extend([
                    f"\n{pattern}:",
                    f"Trades: {stats['total_trades']}",
                    f"Win Rate: {stats['win_rate']:.2%}",
                    f"Average Return: {stats['avg_return']:.2%}"
                ])
                
        report.extend([
            "\nPerformance by Confidence Level:",
            "------------------------------"
        ])
        
        for bracket, stats in backtest_results['confidence_stats'].items():
            report.extend([
                f"\nConfidence {bracket}:",
                f"Trades: {stats['total_trades']}",
                f"Win Rate: {stats['win_rate']:.2%}",
                f"Average Return: {stats['avg_return']:.2%}"
            ])
            
        return "\n".join(report) 