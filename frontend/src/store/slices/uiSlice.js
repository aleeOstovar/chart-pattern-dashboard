import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  darkMode: false,
  sidebarOpen: true,
  chartType: 'candlestick', // candlestick, line, area, bar
  chartOverlays: {
    volume: true,
    movingAverages: {
      sma20: true,
      ema50: true,
      sma200: false,
    },
    indicators: {
      rsi: false,
      macd: false,
    },
    patterns: true,
  },
  activePage: 'dashboard', // dashboard, patterns, backtest, alerts, settings
  notifications: [],
  modal: {
    isOpen: false,
    type: null, // pattern-details, alert-create, settings, etc.
    data: null,
  },
};

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setChartType: (state, action) => {
      state.chartType = action.payload;
    },
    toggleChartOverlay: (state, action) => {
      const { overlay, value } = action.payload;
      
      if (overlay.includes('.')) {
        const [category, item] = overlay.split('.');
        state.chartOverlays[category][item] = value ?? !state.chartOverlays[category][item];
      } else {
        state.chartOverlays[overlay] = value ?? !state.chartOverlays[overlay];
      }
    },
    setActivePage: (state, action) => {
      state.activePage = action.payload;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      });
    },
    markNotificationAsRead: (state, action) => {
      const index = state.notifications.findIndex((n) => n.id === action.payload);
      if (index !== -1) {
        state.notifications[index].read = true;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null,
      };
    },
  },
});

export const {
  toggleDarkMode,
  toggleSidebar,
  setChartType,
  toggleChartOverlay,
  setActivePage,
  addNotification,
  markNotificationAsRead,
  clearNotifications,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer; 