import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const MatchContext = createContext(null);

export const MatchProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [arenaData, setArenaData] = useState(null);
  const [findingOpponent, setFindingOpponent] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | waiting | matched

  useEffect(() => {
    // Get socket URL from environment or default to production
    const SOCKET_URL = import.meta.env.VITE_API_BASE || 
                       import.meta.env.VITE_SOCKET_URL || 
                       "https://codefightclub.onrender.com";
    
    console.log("🔌 Connecting to socket server:", SOCKET_URL);
    
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      withCredentials: true,
    });

    newSocket.on("connect", () => {
      console.log("⚡ Socket connected:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    newSocket.on("waiting", (data) => {
      console.log("⏳ Waiting for opponent:", data);
      setStatus("waiting");
      setFindingOpponent(true);
    });

    newSocket.on("matchFound", (data) => {
      console.log("🎮 Match found:", data);
      setMatchData(data);
      setStatus("matched");
      setFindingOpponent(false);
    });

    newSocket.on("searchCancelled", () => {
      console.log("🚫 Search cancelled");
      setStatus("idle");
      setFindingOpponent(false);
    });

    newSocket.on("error", (error) => {
      console.error("⚠️ Socket error:", error);
      alert(error.message || "An error occurred");
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <MatchContext.Provider
      value={{
        socket,
        matchData,
        arenaData,
        setArenaData,
        status,
        findingOpponent,
        setFindingOpponent,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error("useSocket must be used within MatchProvider");
  }
  return context;
};