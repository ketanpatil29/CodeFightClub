// src/context/MatchContext.jsx
import React, { createContext, useContext } from 'react';
import { io } from 'socket.io-client';

// You can change the URL if your backend runs somewhere else
const socket = io('http://localhost:3000', {
  withCredentials: true
}); 

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use socket in any component
export const useSocket = () => useContext(SocketContext);