import React, { useEffect, useState } from "react";
import { useSocket } from "../context/MatchContext";

const MatchFoundModal = ({
  isOpen,
  onEnterBattle,
  onCancelMatch,
  opponent,
  setOpponent,
}) => {
  const {
    socket,
    findingOpponent,
    setFindingOpponent,
    setArenaData,
  } = useSocket();

  const [questionTitle, setQuestionTitle] = useState("");

  useEffect(() => {
    if (!socket) return;

    const handleWaiting = (data) => {
      if (data?.question?.title) {
        setQuestionTitle(data.question.title);
        console.log("📝 Question ready:", data.question.title);
      }
    };

    const handleMatchFound = (data) => {
      console.log("🎮 Match found:", data);

      setFindingOpponent(false);
      setOpponent(data.opponent);
      setQuestionTitle(data.question.title);

      const arenaPayload = {
        roomId: data.roomId,
        question: data.question,
        opponent: data.opponent,
        opponentId: data.opponentId,
      };

      localStorage.setItem("arenaData", JSON.stringify(arenaPayload));
      setArenaData(arenaPayload);

      setTimeout(() => {
        onEnterBattle();
      }, 1500);
    };

    socket.on("waiting", handleWaiting);
    socket.on("matchFound", handleMatchFound);

    return () => {
      socket.off("waiting", handleWaiting);
      socket.off("matchFound", handleMatchFound);
    };
  }, [socket]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-8 w-full max-w-md text-center shadow-2xl">

        <h2 className="text-2xl font-bold mb-6">
          {!questionTitle ? (
            <span className="text-blue-600 animate-pulse">
              Preparing Question...
            </span>
          ) : findingOpponent ? (
            <span className="text-yellow-600 animate-pulse">
              Finding opponent...
            </span>
          ) : (
            <span className="text-green-600 animate-bounce">
              Opponent Found 🎉
            </span>
          )}
        </h2>

        {questionTitle && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Challenge</p>
            <p className="font-semibold">{questionTitle}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          {findingOpponent
            ? "Waiting for another player..."
            : `Opponent "${opponent}" is ready`}
        </p>

        {findingOpponent ? (
          <button
            onClick={onCancelMatch}
            className="bg-red-500 text-white px-6 py-3 rounded-lg w-full font-semibold"
          >
            Cancel Match
          </button>
        ) : (
          <button
            onClick={onEnterBattle}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg w-full font-semibold"
          >
            Enter Arena ⚔️
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchFoundModal;
