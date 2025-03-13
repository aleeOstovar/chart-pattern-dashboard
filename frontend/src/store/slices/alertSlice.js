import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

// API endpoints
const API_URL = '/api/alerts';

// Async thunks
export const fetchAlerts = createAsyncThunk(
  'alert/fetchAlerts',
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
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch alerts');
    }
  }
);

export const createAlert = createAsyncThunk(
  'alert/createAlert',
  async (alertData, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(API_URL, alertData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create alert');
    }
  }
);

export const updateAlert = createAsyncThunk(
  'alert/updateAlert',
  async ({ id, alertData }, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.put(`${API_URL}/${id}`, alertData, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update alert');
    }
  }
);

export const deleteAlert = createAsyncThunk(
  'alert/deleteAlert',
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
      return rejectWithValue(error.response?.data?.message || 'Failed to delete alert');
    }
  }
);

export const testAlert = createAsyncThunk(
  'alert/testAlert',
  async (id, { rejectWithValue, getState }) => {
    try {
      const { token } = getState().auth;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(`${API_URL}/${id}/test`, {}, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to test alert');
    }
  }
);

// Initial state
const initialState = {
  alerts: [],
  loading: false,
  error: null,
  triggerHistory: [],
  selectedAlert: null,
  selectedAlertStats: null,
  paginationInfo: {
    totalAlerts: 0,
    totalPages: 0,
    currentPage: 1,
    pageSize: 10,
  },
};

// Slice
const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    clearAlerts: (state) => {
      state.alerts = [];
      state.selectedAlert = null;
      state.selectedAlertStats = null;
    },
    setSelectedAlert: (state, action) => {
      state.selectedAlert = action.payload;
    },
    addTriggerHistory: (state, action) => {
      state.triggerHistory.unshift(action.payload);
    },
    setCurrentPage: (state, action) => {
      state.paginationInfo.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = action.payload.alerts;
        state.triggerHistory = action.payload.triggerHistory || [];
        state.paginationInfo = {
          totalAlerts: action.payload.totalAlerts,
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          pageSize: action.payload.pageSize,
        };
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Create Alert
      .addCase(createAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAlert.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts.unshift(action.payload);
        toast.success('Alert created successfully');
      })
      .addCase(createAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Update Alert
      .addCase(updateAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAlert.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in alerts list
        const index = state.alerts.findIndex(a => a._id === action.payload._id);
        if (index !== -1) {
          state.alerts[index] = action.payload;
        }
        
        // Update selected alert if it's the same
        if (state.selectedAlert && state.selectedAlert._id === action.payload._id) {
          state.selectedAlert = action.payload;
        }
        
        toast.success('Alert updated successfully');
      })
      .addCase(updateAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Delete Alert
      .addCase(deleteAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAlert.fulfilled, (state, action) => {
        state.loading = false;
        state.alerts = state.alerts.filter(a => a._id !== action.payload);
        
        if (state.selectedAlert && state.selectedAlert._id === action.payload) {
          state.selectedAlert = null;
        }
        
        toast.success('Alert deleted successfully');
      })
      .addCase(deleteAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      })
      
      // Test Alert
      .addCase(testAlert.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(testAlert.fulfilled, (state, action) => {
        state.loading = false;
        toast.success('Test notification sent successfully');
      })
      .addCase(testAlert.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(action.payload);
      });
  },
});

export const { clearAlerts, setSelectedAlert, addTriggerHistory, setCurrentPage } = alertSlice.actions;
export default alertSlice.reducer; 