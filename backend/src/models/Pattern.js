const mongoose = require('mongoose');

const patternSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  timeframe: {
    type: String,
    required: true,
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
    index: true
  },
  patternName: {
    type: String,
    required: true,
    index: true
  },
  patternType: {
    type: String,
    enum: ['bullish', 'bearish', 'neutral'],
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  startIndex: {
    type: Number,
    required: true
  },
  endIndex: {
    type: Number,
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  endTime: {
    type: Date,
    required: true,
    index: true
  },
  priceData: {
    open: [Number],
    high: [Number],
    low: [Number],
    close: [Number],
    volume: [Number]
  },
  technicalIndicators: {
    rsi: Number,
    macd: {
      macdLine: Number,
      signalLine: Number,
      histogram: Number
    },
    movingAverages: {
      sma20: Number,
      ema50: Number,
      sma200: Number
    },
    volumeProfile: {
      averageVolume: Number,
      volumeChange: Number
    }
  },
  marketContext: {
    trendDirection: {
      type: String,
      enum: ['uptrend', 'downtrend', 'sideways'],
      required: true
    },
    volatility: Number,
    support: Number,
    resistance: Number
  },
  backtestResults: {
    winRate: Number,
    averageReturn: Number,
    sharpeRatio: Number,
    maxDrawdown: Number,
    totalTrades: Number
  },
  detectionMethod: {
    type: String,
    enum: ['talib', 'transformer', 'hybrid'],
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'invalidated'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Index for efficient querying of recent patterns
patternSchema.index({ createdAt: -1, symbol: 1, timeframe: 1 });

// Index for confidence-based queries
patternSchema.index({ confidence: -1, patternType: 1 });

// Method to get pattern summary
patternSchema.methods.getSummary = function() {
  return {
    symbol: this.symbol,
    timeframe: this.timeframe,
    patternName: this.patternName,
    patternType: this.patternType,
    confidence: this.confidence,
    startTime: this.startTime,
    endTime: this.endTime,
    status: this.status
  };
};

// Static method to find recent patterns
patternSchema.statics.findRecentPatterns = function(options = {}) {
  const { 
    symbol, 
    timeframe, 
    minConfidence = 0.6,
    limit = 50,
    patternTypes = ['bullish', 'bearish', 'neutral']
  } = options;

  return this.find({
    symbol,
    timeframe,
    confidence: { $gte: minConfidence },
    patternType: { $in: patternTypes },
    status: 'active'
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Pattern', patternSchema); 