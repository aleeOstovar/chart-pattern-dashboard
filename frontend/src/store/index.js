import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers
import authReducer from './slices/authSlice';
import patternReducer from './slices/patternSlice';
import marketReducer from './slices/marketSlice';
import backtestReducer from './slices/backtestSlice';
import alertReducer from './slices/alertSlice';
import socketReducer from './slices/socketSlice';
import uiReducer from './slices/uiSlice';

// Configure persist options
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'market', 'ui'], // Only persist specific slices
};

// Combine all reducers
const rootReducer = combineReducers({
  auth: authReducer,
  pattern: patternReducer,
  market: marketReducer,
  backtest: backtestReducer,
  alert: alertReducer,
  socket: socketReducer,
  ui: uiReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'socket/setSocket'],
        ignoredPaths: ['socket.instance'],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store); 