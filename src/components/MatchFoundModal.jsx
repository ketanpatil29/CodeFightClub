import React, { useEffect, useState } from "react";
import { useSocket } from "../context/MatchContext";

const MatchFoundModal = ({
  isOpen,
  onEnterBattle,
  onCancelMatch,
  opponent,
  setOpponent,
  selectedCategory,
}) => {
  const { socket, findingOpponent, setFindingOpponent, setArenaData } = useSocket();
  const [questionTitle, setQuestionTitle] = useState("");

  useEffect(() => {
    if (!socket) {
      console.warn("⚠️ Socket not available in MatchFoundModal");
      return;
    }

    const handleWaiting = (data) => {
      console.log("⏳ Waiting event received:", data);
      setFindingOpponent(true);
      
      if (data?.question?.title) {
        setQuestionTitle(data.question.title);
        console.log("📝 Question ready while waiting:", data.question.title);
      } else {
        console.warn("⚠️ No question in waiting event");
        setQuestionTitle("Preparing your challenge...");
      }
    };

    const handleMatchFound = (data) => {
      console.log("🎮 Match found event received:", data);
      
      // Validate data
      if (!data.roomId || !data.question || !data.opponent) {
        console.error("❌ Invalid match data received:", data);
        alert("Match data incomplete. Please try again.");
        onCancelMatch();
        return;
      }

      setFindingOpponent(false);
      setOpponent(data.opponent);
      
      if (data?.question?.title) {
        setQuestionTitle(data.question.title);
        console.log("✅ Question received:", data.question.title);
      } else {
        console.error("❌ No question in match data!");
        alert("Question not received. Please try again.");
        onCancelMatch();
        return;
      }

      // Get user data with fallbacks
      const userId = localStorage.getItem("userId");
      const userName = localStorage.getItem("userName") || localStorage.getItem("userEmail");

      if (!userId || !userName) {
        console.error("❌ User data missing from localStorage");
        alert("Please login again.");
        return;
      }

      const arenaPayload = {
        roomId: data.roomId,
        question: data.question,
        opponent: data.opponent,
        opponentId: data.opponentId,
        user: {
          id: userId,
          name: userName,
        }
      };

      console.log("💾 Saving arena data:", arenaPayload);
      localStorage.setItem("arenaData", JSON.stringify(arenaPayload));
      setArenaData(arenaPayload);

      // Auto-enter after 1.5 seconds
      setTimeout(() => {
        onEnterBattle();
      }, 1500);
    };

    const handleSearchCancelled = () => {
      console.log("🚫 Search cancelled");
      setFindingOpponent(false);
      setQuestionTitle("");
      setOpponent("");
    };

    const handleError = (error) => {
      console.error("⚠️ Socket error in MatchFoundModal:", error);
      alert(error.message || "An error occurred");
      setFindingOpponent(false);
      onCancelMatch();
    };

    socket.on("waiting", handleWaiting);
    socket.on("matchFound", handleMatchFound);
    socket.on("searchCancelled", handleSearchCancelled);
    socket.on("error", handleError);

    return () => {
      socket.off("waiting", handleWaiting);
      socket.off("matchFound", handleMatchFound);
      socket.off("searchCancelled", handleSearchCancelled);
      socket.off("error", handleError);
    };
  }, [socket, setFindingOpponent, setOpponent, setArenaData, onEnterBattle, onCancelMatch]);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (socket) {
      const userId = localStorage.getItem("userId");
      socket.emit("cancelSearch", { userId });
    }
    setQuestionTitle("");
    setOpponent("");
    onCancelMatch();
  };

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
            <span className="text-green-600">
              Opponent Found! 🎉
            </span>
          )}
        </h2>

        {selectedCategory && (
          <div className="mb-4 p-3 bg-purple-100 rounded-lg">
            <p className="text-sm text-purple-600 font-semibold">
              Category: {selectedCategory}
            </p>
          </div>
        )}

        {questionTitle && (
          <div className="mb-4 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Challenge</p>
            <p className="font-semibold text-gray-800">{questionTitle}</p>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          {findingOpponent
            ? "Searching for another player..."
            : opponent
            ? `Ready to battle against "${opponent}"!`
            : "Preparing match..."}
        </p>

        {findingOpponent ? (
          <button
            onClick={handleCancel}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg w-full font-semibold transition-colors"
          >
            Cancel Match
          </button>
        ) : (
          <button
            onClick={onEnterBattle}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg w-full font-semibold transition-all hover:scale-105"
          >
            Enter Arena ⚔️
          </button>
        )}
      </div>
    </div>
  );
};

export default MatchFoundModal;