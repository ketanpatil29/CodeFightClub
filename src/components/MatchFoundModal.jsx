import React, { useEffect } from 'react';
import { useSocket } from '../context/MatchContext';

const MatchFoundModal = ({ isOpen, findingOpponent, onEnterBattle, onCancelMatch, selectedCategory, setFindingOpponent, setOpponent, opponent }) => {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
  console.log("Match found:", data);

  setFindingOpponent(false);
  setOpponent(data.opponent);

  // Save arena data for ArenaWrapper
  localStorage.setItem("arenaData", JSON.stringify({
    roomId: data.roomId,
    question: data.question,
    opponent: data.opponent,
    user: { token: localStorage.getItem("token") }
  }));

  // Auto-enter
  setTimeout(() => onEnterBattle(), 3000);
};


    socket.once("matchFound", handleMatchFound);

    return () => {
      socket.off("matchFound", handleMatchFound);
    };
  }, [socket, onEnterBattle, setFindingOpponent, setOpponent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl text-center">

        <h2 className="text-2xl font-bold mb-6">
          {findingOpponent ? (
            <span className="text-yellow-600 animate-pulse">Finding an opponent...</span>
          ) : (
            <span className="text-green-600 animate-bounce">Opponent Found!</span>
          )}
        </h2>

        <p className="text-gray-600 mb-8">
          {findingOpponent
            ? "Please wait while we find a worthy challenger..."
            : `Your opponent is ready in ${selectedCategory}!`}
        </p>

        {findingOpponent ? (
          <button 
            onClick={onCancelMatch}
            className="bg-red-500 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:scale-105 transition-all duration-300 w-full"
          >
            CANCEL MATCH
          </button>
        ) : (
          <button 
            onClick={onEnterBattle}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:scale-105 transition-all duration-300 w-full"
          >
            ENTER ARENA
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchFoundModal;
