// src/context/MatchContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL;

    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
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
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

// ✅ THIS EXPORT IS WHAT YOU WERE MISSING
export const useSocket = () => {
  return useContext(SocketContext);
};
