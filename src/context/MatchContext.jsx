import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE;

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

  // ✅ Safe function to find match
  const findMatch = (userId, username, category) => {
    if (!socket) return;
    if (!userId || !username || !category) {
      console.warn("⚠️ Missing data for findMatch", { userId, username, category });
      return;
    }
    socket.emit("findMatch", { userId, username, category });
  };

  return (
    <SocketContext.Provider value={{ socket, findMatch }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
