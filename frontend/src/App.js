import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { io } from 'socket.io-client';

// Layout components
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages
import Dashboard from './pages/Dashboard';
import PatternExplorer from './pages/PatternExplorer';
import PatternDetails from './pages/PatternDetails';
import Backtesting from './pages/Backtesting';
import BacktestDetails from './pages/BacktestDetails';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';

// Redux actions
import { setSocket } from './store/slices/socketSlice';
import { addNewPattern } from './store/slices/patternSlice';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { symbol } = useSelector((state) => state.market);
  
  // Initialize socket connection
  useEffect(() => {
    if (isAuthenticated) {
      const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        withCredentials: true,
      });
      
      // Store socket instance in Redux
      dispatch(setSocket(socket));
      
      // Connect to pattern updates for the selected symbol
      socket.on('connect', () => {
        console.log('Socket connected');
        if (symbol) {
          socket.emit('subscribe_pattern', symbol);
        }
      });
      
      // Listen for pattern updates
      socket.on('pattern_update', (patternData) => {
        console.log('New pattern detected:', patternData);
        dispatch(addNewPattern(patternData));
      });
      
      // Cleanup on unmount
      return () => {
        socket.disconnect();
      };
    }
  }, [dispatch, isAuthenticated, symbol]);
  
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      
      {/* Protected routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/patterns" element={
          <ProtectedRoute>
            <PatternExplorer />
          </ProtectedRoute>
        } />
        <Route path="/patterns/:id" element={
          <ProtectedRoute>
            <PatternDetails />
          </ProtectedRoute>
        } />
        <Route path="/backtest" element={
          <ProtectedRoute>
            <Backtesting />
          </ProtectedRoute>
        } />
        <Route path="/backtest/:id" element={
          <ProtectedRoute>
            <BacktestDetails />
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <Alerts />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* 404 route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App; 