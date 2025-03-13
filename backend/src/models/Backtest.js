const mongoose = require('mongoose');

const backtestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  configuration: {
    symbol: {
      type: String,
      required: true
    },
    timeframe: {
      type: String,
      required: true,
      enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d']
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    patterns: [{
      name: String,
      type: {
        type: String,
        enum: ['bullish', 'bearish', 'neutral']
      },
      minConfidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.6
      }
    }],
    tradingParams: {
      initialCapital: {
        type: Number,
        required: true
      },
      positionSize: {
        type: Number,
        required: true,
        min: 0,
        max: 1
      },
      stopLoss: {
        type: Number,
        min: 0
      },
      takeProfit: {
        type: Number,
        min: 0
      },
      maxOpenPositions: {
        type: Number,
        default: 1
      },
      trailingStop: {
        enabled: Boolean,
        percentage: Number
      }
    },
    fees: {
      maker: {
        type: Number,
        default: 0.001
      },
      taker: {
        type: Number,
        default: 0.001
      },
      slippage: {
        type: Number,
        default: 0.001
      }
    }
  },
  results: {
    summary: {
      totalTrades: Number,
      winningTrades: Number,
      losingTrades: Number,
      winRate: Number,
      profitFactor: Number,
      totalReturn: Number,
      annualizedReturn: Number,
      maxDrawdown: Number,
      sharpeRatio: Number,
      sortinoRatio: Number,
      calmarRatio: Number
    },
    equity: [{
      timestamp: Date,
      value: Number,
      drawdown: Number
    }],
    trades: [{
      pattern: {
        name: String,
        type: String,
        confidence: Number
      },
      entry: {
        price: Number,
        time: Date,
        type: {
          type: String,
          enum: ['market', 'limit']
        }
      },
      exit: {
        price: Number,
        time: Date,
        type: {
          type: String,
          enum: ['market', 'limit', 'sl', 'tp']
        }
      },
      size: Number,
      pnl: Number,
      pnlPercentage: Number,
      fees: Number
    }],
    patternPerformance: [{
      name: String,
      type: String,
      trades: Number,
      winRate: Number,
      averageReturn: Number,
      profitFactor: Number
    }],
    timeAnalysis: {
      bestMonth: {
        month: String,
        return: Number
      },
      worstMonth: {
        month: String,
        return: Number
      },
      monthlyReturns: [{
        month: String,
        return: Number
      }]
    }
  },
  status: {
    type: String,
    enum: ['running', 'completed', 'failed'],
    default: 'running'
  },
  error: {
    message: String,
    stack: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

// Indexes for efficient querying
backtestSchema.index({ user: 1, createdAt: -1 });
backtestSchema.index({ 'configuration.symbol': 1, status: 1 });

// Method to get backtest summary
backtestSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    symbol: this.configuration.symbol,
    timeframe: this.configuration.timeframe,
    startDate: this.configuration.startDate,
    endDate: this.configuration.endDate,
    status: this.status,
    results: this.results?.summary,
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

// Static method to find user's recent backtests
backtestSchema.statics.findRecentBacktests = function(userId, limit = 10) {
  return this.find({ user: userId })
    .select('name configuration.symbol configuration.timeframe status results.summary createdAt completedAt')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Backtest', backtestSchema); 