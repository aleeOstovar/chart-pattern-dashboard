import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

// API endpoints
const API_URL = '/api/market';

// Async thunks
export const fetchMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async ({ symbol, timeframe, limit }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          symbol,
          timeframe,
          limit: limit || 500,
        },
      };
      const response = await axios.get(`${API_URL}/data`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch market data');
    }
  }
);

export const fetchAvailableSymbols = createAsyncThunk(
  'market/fetchAvailableSymbols',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/symbols`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch available symbols');
    }
  }
);

export const fetchMarketSentiment = createAsyncThunk(
  'market/fetchMarketSentiment',
  async (symbol, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          symbol,
        },
      };
      const response = await axios.get(`${API_URL}/sentiment`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch market sentiment');
    }
  }
);

// Initial state
const initialState = {
  marketData: [],
  symbol: 'BTCUSDT',
  timeframe: '1h',
  availableSymbols: [],
  availableTimeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d'],
  loading: false,
  error: null,
  lastUpdated: null,
  marketSentiment: {
    bullishPatterns: 0,
    bearishPatterns: 0,
    totalPatterns: 0,
    sentiment: 'neutral', // bullish, bearish, neutral
    sentimentScore: 0, // -1 to 1
    volume24h: 0,
    priceChange24h: 0,
  },
};

// Slice
const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {
    setSymbol: (state, action) => {
      state.symbol = action.payload;
    },
    setTimeframe: (state, action) => {
      state.timeframe = action.payload;
    },
    clearMarketData: (state) => {
      state.marketData = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Market Data
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading = false;
        state.marketData = action.payload.data;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Fetch Available Symbols
      .addCase(fetchAvailableSymbols.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSymbols.fulfilled, (state, action) => {
        state.loading = false;
        state.availableSymbols = action.payload.symbols;
      })
      .addCase(fetchAvailableSymbols.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Fetch Market Sentiment
      .addCase(fetchMarketSentiment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketSentiment.fulfilled, (state, action) => {
        state.loading = false;
        state.marketSentiment = action.payload;
      })
      .addCase(fetchMarketSentiment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { setSymbol, setTimeframe, clearMarketData } = marketSlice.actions;
export default marketSlice.reducer; 