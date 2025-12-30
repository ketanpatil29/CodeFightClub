// src/context/MatchContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");

    if (!userId || !username) {
      console.warn("⛔ Socket not initialized: user not logged in yet");
      return;
    }

    const socketUrl = import.meta.env.VITE_API_BASE;

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
      auth: {
        userId,
        username,
      },
    });

    newSocket.on("connect", () => {
      console.log("⚡ Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []); // ❗ DO NOT add userId here (avoids reconnect loop)

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
