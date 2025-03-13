const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    index: true
  },
  timeframe: {
    type: String,
    required: true,
    enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d']
  },
  alertType: {
    type: String,
    required: true,
    enum: ['pattern', 'price', 'indicator', 'volume']
  },
  conditions: {
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
    price: {
      above: Number,
      below: Number,
      crossover: Number,
      percentageChange: Number
    },
    indicators: {
      rsi: {
        above: Number,
        below: Number
      },
      macd: {
        crossover: Boolean,
        crossunder: Boolean
      },
      movingAverages: {
        crossover: {
          fast: Number,
          slow: Number
        }
      }
    },
    volume: {
      threshold: Number,
      percentageIncrease: Number
    }
  },
  notification: {
    channels: {
      email: {
        type: Boolean,
        default: true
      },
      telegram: {
        type: Boolean,
        default: false
      },
      whatsapp: {
        type: Boolean,
        default: false
      }
    },
    message: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      enum: ['once', 'always'],
      default: 'once'
    }
  },
  status: {
    type: String,
    enum: ['active', 'triggered', 'disabled'],
    default: 'active'
  },
  triggerCount: {
    type: Number,
    default: 0
  },
  lastTriggered: {
    type: Date
  },
  expiresAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
alertSchema.index({ user: 1, status: 1, symbol: 1 });
alertSchema.index({ status: 1, expiresAt: 1 });

// Method to check if alert should be triggered
alertSchema.methods.shouldTrigger = function(pattern, price, indicators) {
  if (this.status !== 'active') return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;

  switch (this.alertType) {
    case 'pattern':
      return this.checkPatternConditions(pattern);
    case 'price':
      return this.checkPriceConditions(price);
    case 'indicator':
      return this.checkIndicatorConditions(indicators);
    case 'volume':
      return this.checkVolumeConditions(price.volume);
    default:
      return false;
  }
};

// Method to trigger alert
alertSchema.methods.trigger = async function() {
  this.triggerCount += 1;
  this.lastTriggered = new Date();
  
  if (this.notification.frequency === 'once') {
    this.status = 'triggered';
  }
  
  await this.save();
  return this;
};

// Static method to find active alerts for a symbol
alertSchema.statics.findActiveAlerts = function(symbol) {
  return this.find({
    symbol,
    status: 'active',
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  }).populate('user', 'email preferences.alertNotifications contactInfo');
};

module.exports = mongoose.model('Alert', alertSchema); 