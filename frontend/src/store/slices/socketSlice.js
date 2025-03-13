import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  instance: null,
  connected: false,
};

// Slice
const socketSlice = createSlice({
  name: 'socket',
  initialState,
  reducers: {
    setSocket: (state, action) => {
      state.instance = action.payload;
      state.connected = action.payload ? true : false;
    },
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
    disconnectSocket: (state) => {
      if (state.instance) {
        state.instance.disconnect();
      }
      state.instance = null;
      state.connected = false;
    },
  },
});

export const { setSocket, setConnected, disconnectSocket } = socketSlice.actions;
export default socketSlice.reducer; 