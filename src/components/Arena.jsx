import React, { useState, useEffect, useMemo } from "react";
import Editor from "@monaco-editor/react";
import { useSocket } from "../context/MatchContext";
import { API_BASE } from "./Api";

const Arena = ({ user, opponentName, opponentId, question, onExit }) => {
  const socket = useSocket();

  const userId = useMemo(
    () => user?.id || user?.userId || user?.token,
    [user]
  );

  const [code, setCode] = useState("");
  const [status, setStatus] = useState("solving");
  const [opponentStatus, setOpponentStatus] = useState("solving");
  const [testResults, setTestResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showOpponentLeftModal, setShowOpponentLeftModal] = useState(false);
  const [editorReady, setEditorReady] = useState(false);

  const funcTemplate = `function solve(...args) {
  // Write your solution here
  // Return the answer
}`;

  /* ----------------------------------
     INIT CODE TEMPLATE
  ---------------------------------- */
  useEffect(() => {
    setCode(funcTemplate);
  }, []);

  useEffect(() => {
    setEditorReady(true);
  }, []);


  /* ----------------------------------
     SOCKET ROOM SAFETY (REFRESH SAFE)
  ---------------------------------- */
  useEffect(() => {
    if (!socket) return;

    const arenaData = JSON.parse(localStorage.getItem("arenaData") || "{}");
    if (arenaData.roomId && userId) {
      socket.emit("joinRoom", {
        roomId: arenaData.roomId,
        userId,
      });
    }
  }, [socket, userId]);

  /* ----------------------------------
     SOCKET LISTENERS
  ---------------------------------- */
  useEffect(() => {
    if (!socket) return;

    const handleOpponentStatus = ({ status }) => {
      setOpponentStatus(status);
    };

    const handleGameOver = (data) => {
      setGameOver(true);

      const message = data.youWon
        ? `🎉 You WON!\n${data.loser} lost the battle.`
        : `😔 ${data.winner} finished first.`;

      setTimeout(() => {
        alert(message);
        onExit();
      }, 600);
    };

    const handleOpponentLeft = () => {
      setOpponentStatus("left");
      setShowOpponentLeftModal(true);
    };

    socket.on("opponentStatusUpdate", handleOpponentStatus);
    socket.on("gameOver", handleGameOver);
    socket.on("opponentLeft", handleOpponentLeft);

    return () => {
      socket.off("opponentStatusUpdate", handleOpponentStatus);
      socket.off("gameOver", handleGameOver);
      socket.off("opponentLeft", handleOpponentLeft);
    };
  }, [socket, onExit]);

  /* ----------------------------------
     SUBMIT ANSWER
  ---------------------------------- */
  const submitAnswer = async () => {
    if (isSubmitting || status === "completed" || gameOver) return;

    setIsSubmitting(true);

    const arenaData = JSON.parse(localStorage.getItem("arenaData") || "{}");
    const roomId = arenaData.roomId;

    try {
      const res = await fetch(`${API_BASE}/ai/submit-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, question }),
      });

      const data = await res.json();
      setTestResults(data);

      if (data.success) {
        setStatus("completed");

        socket.emit("submitAnswer", {
          roomId,
          userId,
          success: true,
        });
      } else {
        alert(`${data.passedCount}/${data.totalTests} tests passed.`);
      }
    } catch (err) {
      setTestResults({
        success: false,
        error: "Network error. Try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ----------------------------------
     EXIT / FORFEIT
  ---------------------------------- */
  const handleExit = () => {
    if (gameOver) return onExit();

    const arenaData = JSON.parse(localStorage.getItem("arenaData") || "{}");

    if (window.confirm("Exit arena? This will forfeit the match.")) {
      socket.emit("exitArena", {
        roomId: arenaData.roomId,
        userId,
      });
      onExit();
    }
  };

  /* ----------------------------------
     OPPONENT LEFT OPTIONS
  ---------------------------------- */
  const handleOpponentLeftContinue = () => {
    setShowOpponentLeftModal(false);
  };

  const handleOpponentLeftExit = () => {
    setShowOpponentLeftModal(false);
    onExit();
  };

  /* ----------------------------------
     RENDER
  ---------------------------------- */
  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900">
      {/* Opponent Left Modal */}
      {showOpponentLeftModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">
              😕 Opponent Left
            </h2>
            <p className="text-gray-300 mb-6">
              {opponentName} left the match.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleOpponentLeftContinue}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
              >
                Continue
              </button>
              <button
                onClick={handleOpponentLeftExit}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="p-4 bg-gray-800 flex justify-between">
        <h1 className="text-white text-2xl font-bold">⚔️ Coding Arena</h1>
        <button
          onClick={handleExit}
          className="bg-red-600 px-6 py-2 rounded-lg text-white"
        >
          Exit Arena
        </button>
      </div>

      {/* BODY */}
      <div className="flex flex-1">
        {/* QUESTION */}
        <div className="w-1/2 p-6 bg-gray-800 overflow-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            {question.title}
          </h2>
          <p className="text-gray-300">{question.description}</p>
        </div>

        {/* EDITOR */}
        <div className="w-1/2 p-6 flex flex-col">
          {editorReady && (
            <Editor
              height="100%"
              language="javascript"
              value={code}
              onChange={(v) => setCode(v || "")}
              theme="vs-dark"
              options={{
                fontSize: 16,
                minimap: { enabled: false },
                readOnly: gameOver || opponentStatus === "completed",
              }}
            />
          )}


          <button
            onClick={submitAnswer}
            disabled={
              isSubmitting ||
              status === "completed" ||
              opponentStatus === "completed"
            }
            className="mt-4 bg-blue-600 text-white py-4 rounded-lg font-bold"
          >
            {isSubmitting ? "⏳ Testing..." : "🚀 Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Arena;
