// src/context/MatchContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE;
    const userId = localStorage.getItem("userId");

    const newSocket = io(socketUrl, {
      withCredentials: true,

      // ✅ IMPORTANT FOR RENDER + FIREFOX
      transports: ["polling", "websocket"],

      // ✅ Stability
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,

      // ✅ Pass user identity
      auth: {
        userId: localStorage.getItem("userId") || "guest_" + Date.now(),
      },

    });

    newSocket.on("connect", () => {
      console.log("⚡ Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
