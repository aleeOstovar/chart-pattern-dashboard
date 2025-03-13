import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

// API endpoints
const API_URL = '/api/backtest';

// Async thunks
export const fetchBacktests = createAsyncThunk(
  'backtest/fetchBacktests',
  async (params, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params,
      };
      const response = await axios.get(API_URL, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch backtests');
    }
  }
);

export const fetchBacktestById = createAsyncThunk(
  'backtest/fetchBacktestById',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.get(`${API_URL}/${id}`, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch backtest details');
    }
  }
);

export const createBacktest = createAsyncThunk(
  'backtest/createBacktest',
  async (backtestData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(API_URL, backtestData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create backtest');
    }
  }
);

export const deleteBacktest = createAsyncThunk(
  'backtest/deleteBacktest',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      await axios.delete(`${API_URL}/${id}`, config);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete backtest');
    }
  }
);

// Initial state
const initialState = {
  backtests: [],
  currentBacktest: null,
  loading: false,
  error: null,
  paginationInfo: {
    totalBacktests: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  },
};

// Slice
const backtestSlice = createSlice({
  name: 'backtest',
  initialState,
  reducers: {
    clearBacktests: (state) => {
      state.backtests = [];
      state.currentBacktest = null;
    },
    setCurrentPage: (state, action) => {
      state.paginationInfo.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Backtests
      .addCase(fetchBacktests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBacktests.fulfilled, (state, action) => {
        state.loading = false;
        state.backtests = action.payload.backtests;
        state.paginationInfo = {
          totalBacktests: action.payload.totalBacktests,
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          pageSize: action.payload.pageSize,
        };
      })
      .addCase(fetchBacktests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Fetch Backtest By Id
      .addCase(fetchBacktestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBacktestById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBacktest = action.payload;
      })
      .addCase(fetchBacktestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Create Backtest
      .addCase(createBacktest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBacktest.fulfilled, (state, action) => {
        state.loading = false;
        state.backtests.unshift(action.payload);
        toast.success('Backtest created successfully');
      })
      .addCase(createBacktest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Delete Backtest
      .addCase(deleteBacktest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBacktest.fulfilled, (state, action) => {
        state.loading = false;
        state.backtests = state.backtests.filter((b) => b._id !== action.payload);
        
        if (state.currentBacktest && state.currentBacktest._id === action.payload) {
          state.currentBacktest = null;
        }
        
        toast.success('Backtest deleted successfully');
      })
      .addCase(deleteBacktest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { clearBacktests, setCurrentPage } = backtestSlice.actions;
export default backtestSlice.reducer; 