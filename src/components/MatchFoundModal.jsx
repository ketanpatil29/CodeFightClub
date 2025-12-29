import React, { useEffect, useState } from "react";
import { useSocket } from "../context/MatchContext";

const MatchFoundModal = ({
  isOpen,
  findingOpponent,
  onEnterBattle,
  onCancelMatch,
  selectedCategory,
  setFindingOpponent,
  setOpponent,
  opponent,
}) => {
  const { socket } = useSocket(); // ✅ FIX
  const [questionTitle, setQuestionTitle] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handleWaiting = (data) => {
      if (data?.question?.title) {
        setQuestionTitle(data.question.title);
        console.log("📝 Question prepared:", data.question.title);
      }
    };

    const handleMatchFound = (data) => {
      console.log("🎮 Match found in modal:", data);

      setFindingOpponent(false);
      setOpponent(data.opponent);

      if (data?.question?.title) {
        setQuestionTitle(data.question.title);
      }

      localStorage.setItem(
        "arenaData",
        JSON.stringify({
          roomId: data.roomId,
          question: data.question,
          opponent: data.opponent,
          opponentId: data.opponentId,
          user: {
            username:
              data.yourUsername ||
              localStorage.getItem("username") ||
              "User",
            token: localStorage.getItem("token"),
          },
        })
      );

      setTimeout(() => onEnterBattle(), 2000);
    };

    socket.on("waiting", handleWaiting);
    socket.on("matchFound", handleMatchFound);

    return () => {
      socket.off("waiting", handleWaiting);
      socket.off("matchFound", handleMatchFound);
    };
  }, [socket, onEnterBattle, setFindingOpponent, setOpponent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
        <h2 className="text-2xl font-bold mb-6">
          {!questionTitle ? (
            <span className="text-blue-600 animate-pulse">
              Preparing Question...
            </span>
          ) : findingOpponent ? (
            <span className="text-yellow-600 animate-pulse">
              Finding an opponent...
            </span>
          ) : (
            <span className="text-green-600 animate-bounce">
              Opponent Found! 🎉
            </span>
          )}
        </h2>

        {questionTitle && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Today's Challenge:</p>
            <p className="text-lg font-semibold text-gray-800">
              {questionTitle}
            </p>
          </div>
        )}

        <p className="text-gray-600 mb-8">
          {!questionTitle
            ? "Creating a unique coding challenge..."
            : findingOpponent
            ? "Please wait while we find a worthy challenger..."
            : `Your opponent "${opponent}" is ready! Entering arena...`}
        </p>

        {findingOpponent ? (
          <button
            onClick={onCancelMatch}
            className="bg-red-500 hover:scale-105 text-white px-8 py-3 rounded-lg font-semibold shadow-md transition-all duration-300 w-full"
          >
            CANCEL MATCH
          </button>
        ) : (
          <button
            onClick={onEnterBattle}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:scale-105 transition-all duration-300 w-full"
          >
            ENTER ARENA ⚔️
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchFoundModal;
