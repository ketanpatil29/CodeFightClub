// src/context/MatchContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [findingOpponent, setFindingOpponent] = useState(false);
  const [arenaData, setArenaData] = useState(null);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_API_BASE;

    const s = io(socketUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    s.on("connect", () => {
      console.log("⚡ Socket connected:", s.id);
    });

    s.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        findingOpponent,
        setFindingOpponent,
        arenaData,
        setArenaData,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
