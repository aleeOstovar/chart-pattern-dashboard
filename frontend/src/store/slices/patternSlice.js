import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

// API endpoints
const API_URL = '/api/patterns';

// Async thunks
export const fetchPatterns = createAsyncThunk(
  'pattern/fetchPatterns',
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
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch patterns');
    }
  }
);

export const fetchPatternById = createAsyncThunk(
  'pattern/fetchPatternById',
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
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pattern details');
    }
  }
);

export const requestPatternDetection = createAsyncThunk(
  'pattern/requestDetection',
  async (params, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(`${API_URL}/detect`, params, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Pattern detection failed');
    }
  }
);

export const updatePatternStatus = createAsyncThunk(
  'pattern/updateStatus',
  async ({ id, status }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.patch(`${API_URL}/${id}/status`, { status }, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update pattern status');
    }
  }
);

// Initial state
const initialState = {
  patterns: [],
  currentPattern: null,
  recentPatterns: [],
  loading: false,
  detectionLoading: false,
  error: null,
  paginationInfo: {
    totalPatterns: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  },
  patternStats: {
    totalDetected: 0,
    bullishCount: 0,
    bearishCount: 0,
    neutralCount: 0,
    highConfidenceCount: 0,
  },
};

// Slice
const patternSlice = createSlice({
  name: 'pattern',
  initialState,
  reducers: {
    addNewPattern: (state, action) => {
      state.patterns.unshift(action.payload);
      state.recentPatterns.unshift(action.payload);
      
      // Keep recentPatterns limited to 10 items
      if (state.recentPatterns.length > 10) {
        state.recentPatterns.pop();
      }
      
      // Update stats
      state.patternStats.totalDetected += 1;
      if (action.payload.patternType === 'bullish') {
        state.patternStats.bullishCount += 1;
      } else if (action.payload.patternType === 'bearish') {
        state.patternStats.bearishCount += 1;
      } else {
        state.patternStats.neutralCount += 1;
      }
      
      if (action.payload.confidence >= 0.8) {
        state.patternStats.highConfidenceCount += 1;
      }
      
      toast.info(`New pattern detected: ${action.payload.patternName}`, {
        autoClose: 3000,
      });
    },
    clearPatterns: (state) => {
      state.patterns = [];
      state.currentPattern = null;
    },
    setCurrentPage: (state, action) => {
      state.paginationInfo.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Patterns
      .addCase(fetchPatterns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatterns.fulfilled, (state, action) => {
        state.loading = false;
        state.patterns = action.payload.patterns;
        state.paginationInfo = {
          totalPatterns: action.payload.totalPatterns,
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          pageSize: action.payload.pageSize,
        };
        state.patternStats = action.payload.stats;
      })
      .addCase(fetchPatterns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Fetch Pattern By Id
      .addCase(fetchPatternById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPatternById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPattern = action.payload;
      })
      .addCase(fetchPatternById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Request Pattern Detection
      .addCase(requestPatternDetection.pending, (state) => {
        state.detectionLoading = true;
        state.error = null;
      })
      .addCase(requestPatternDetection.fulfilled, (state, action) => {
        state.detectionLoading = false;
        if (action.payload.patterns && action.payload.patterns.length > 0) {
          state.patterns.unshift(...action.payload.patterns);
          state.recentPatterns = [
            ...action.payload.patterns.slice(0, 10 - state.recentPatterns.length),
            ...state.recentPatterns,
          ].slice(0, 10);
          
          toast.success(`Detected ${action.payload.patterns.length} patterns`);
        } else {
          toast.info('No patterns detected in the provided data');
        }
      })
      .addCase(requestPatternDetection.rejected, (state, action) => {
        state.detectionLoading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Update Pattern Status
      .addCase(updatePatternStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePatternStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in patterns list
        const index = state.patterns.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.patterns[index] = action.payload;
        }
        
        // Update current pattern if it's the same
        if (state.currentPattern && state.currentPattern._id === action.payload._id) {
          state.currentPattern = action.payload;
        }
        
        toast.success(`Pattern status updated to ${action.payload.status}`);
      })
      .addCase(updatePatternStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { addNewPattern, clearPatterns, setCurrentPage } = patternSlice.actions;
export default patternSlice.reducer; 