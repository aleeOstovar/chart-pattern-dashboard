const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  preferences: {
    defaultTimeframe: {
      type: String,
      enum: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
      default: '1h'
    },
    defaultSymbol: {
      type: String,
      default: 'BTCUSDT'
    },
    alertNotifications: {
      email: { type: Boolean, default: true },
      telegram: { type: Boolean, default: false },
      whatsapp: { type: Boolean, default: false }
    },
    patternPreferences: {
      minConfidence: { type: Number, default: 0.6 },
      patterns: [String]
    },
    tradingPreferences: {
      autoTrading: { type: Boolean, default: false },
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      maxPositionSize: { type: Number, default: 0.1 }, // 10% of account
      stopLossPercentage: { type: Number, default: 0.02 },
      takeProfitPercentage: { type: Number, default: 0.04 }
    }
  },
  apiKeys: {
    binance: {
      apiKey: String,
      secretKey: String
    },
    telegram: String
  },
  contactInfo: {
    telegram: String,
    whatsapp: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.apiKeys;
  return userObject;
};

module.exports = mongoose.model('User', userSchema); 