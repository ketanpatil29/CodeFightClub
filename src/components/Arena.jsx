import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useSocket } from "../context/MatchContext";
import { API_BASE } from "./Api";

const Arena = ({ user, opponentName, opponentId, question, roomId, onExit }) => {
  const { socket } = useSocket(); // ✅ Get socket from context
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("solving");
  const [opponentStatus, setOpponentStatus] = useState("solving");
  const [testResults, setTestResults] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [showOpponentLeftModal, setShowOpponentLeftModal] = useState(false);

  const funcTemplate = `function solve(...args) {
  // Write your solution here
  // Return the answer
}`;

  useEffect(() => {
    setCode(funcTemplate);
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) {
      console.warn("⚠️ Socket not available in Arena");
      return;
    }

    console.log("🎮 Arena mounted - Listening for socket events in room:", roomId);

    // Opponent status updates
    const handleOpponentStatus = (data) => {
      console.log("👤 Opponent status update:", data.status);
      setOpponentStatus(data.status);
    };

    // Game over - someone won
    const handleGameOver = (data) => {
      console.log("🏆 Game Over:", data);
      setGameOver(true);
      
      const message = data.youWon
        ? `🎉 Congratulations! You won!\n${data.loser} will try again next time.`
        : `😔 ${data.winner} completed first!\nBetter luck next time!`;
      
      setTimeout(() => {
        alert(message);
        onExit();
      }, 500);
    };

    // Opponent left the match
    const handleOpponentLeft = (data) => {
      console.log("🚪 Opponent left:", data);
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
  }, [socket, roomId, onExit]);

  const submitAnswer = async () => {
    if (isSubmitting || status === "completed" || gameOver) return;
    
    setIsSubmitting(true);
    console.log("🚀 Submitting answer...");
    console.log("Code:", code.substring(0, 100) + "...");
    console.log("Question:", question.title);
    console.log("API_BASE:", API_BASE);

    try {
      const payload = { code, question };
      console.log("📤 Sending to:", `${API_BASE}/ai/submit-answer`);
      
      const res = await fetch(`${API_BASE}/ai/submit-answer`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
      });
      
      console.log("📥 Response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("❌ Server error response:", errorText);
        throw new Error(`Server error: ${res.status} - ${errorText}`);
      }

      const contentType = res.headers.get("content-type");
      console.log("📋 Content-Type:", contentType);
      
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("❌ Expected JSON but got:", text);
        throw new Error("Server returned invalid response format");
      }
      
      const data = await res.json();
      console.log("📊 Test Results:", data);
      setTestResults(data);

      if (data.success) {
        setStatus("completed");
        
        // Get userId from localStorage or user object
        const userId = user?.id || localStorage.getItem("userId");
        
        console.log("✅ All tests passed! Emitting submitAnswer:", { userId, roomId, success: true });
        
        // Emit to backend that you've completed
        if (socket && socket.connected) {
          socket.emit("submitAnswer", { 
            userId, 
            roomId,
            success: true,
          });
        } else {
          console.error("❌ Socket not connected, cannot emit submitAnswer");
        }
        
        // Don't show alert here - wait for gameOver event
      } else {
        setStatus("solving");
        const message = `${data.passedCount}/${data.totalTests} tests passed. Keep trying!`;
        console.log("⚠️", message);
        alert(message);
      }
    } catch (err) {
      console.error("❌ Submission error:", err);
      setTestResults({
        success: false,
        error: err.message || "Network error. Please try again.",
        results: [],
        passedCount: 0,
        totalTests: question.tests?.length || 0,
      });
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
      console.log("✅ Submission complete");
    }
  };

  const handleExit = () => {
    if (gameOver) {
      onExit();
      return;
    }

    const confirmExit = window.confirm(
      "Are you sure you want to exit? You'll forfeit this match."
    );
    
    if (confirmExit) {
      const userId = user?.id || localStorage.getItem("userId");
      
      console.log("🚪 Exiting arena:", { userId, roomId });
      
      socket?.emit("exitArena", { userId, roomId });
      onExit();
    }
  };

  const handleOpponentLeftContinue = () => {
    setShowOpponentLeftModal(false);
    // User can continue practicing
  };

  const handleOpponentLeftExit = () => {
    setShowOpponentLeftModal(false);
    onExit();
  };

  // Get username safely
  const username = user?.name || user?.username || localStorage.getItem("userName") || "You";

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-900">
      {/* Opponent Left Modal */}
      {showOpponentLeftModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl max-w-md">
            <h2 className="text-2xl font-bold text-white mb-4">😕 Opponent Left</h2>
            <p className="text-gray-300 mb-6">
              {opponentName} has left the match. You can continue practicing with this question or exit.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleOpponentLeftContinue}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Continue Practicing
              </button>
              <button
                onClick={handleOpponentLeftExit}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Exit Arena
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-none p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-2xl font-bold text-white">⚔️ Coding Arena</h1>
          </div>
          <div className="flex gap-6">
            <div className="bg-blue-900 px-4 py-2 rounded-lg border-2 border-blue-500">
              <p className="text-sm text-gray-300">👤 You: <span className="font-semibold text-white">{username}</span></p>
              <p className="text-xs font-semibold text-blue-400">
                {status === "completed" ? "✅ Completed!" : "⏳ Solving..."}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-lg border-2 ${
              opponentStatus === "left" 
                ? "bg-gray-700 border-gray-500" 
                : "bg-red-900 border-red-500"
            }`}>
              <p className="text-sm text-gray-300">🎯 Opponent: <span className="font-semibold text-white">{opponentName}</span></p>
              <p className="text-xs font-semibold text-red-400">
                {opponentStatus === "completed" 
                  ? "✅ Completed!" 
                  : opponentStatus === "left"
                  ? "🚪 Left Match"
                  : "⏳ Solving..."}
              </p>
            </div>
          </div>
        </div>
        <button 
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
          onClick={handleExit}
        >
          Exit Arena
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Question */}
        <div className="w-1/2 p-6 overflow-auto bg-gray-800 border-r border-gray-700">
          <h2 className="text-3xl font-bold mb-4 text-white">{question.title}</h2>
          
          <div className="mb-6 text-gray-300">
            <h3 className="text-lg font-semibold mb-2 text-blue-400">Description:</h3>
            <p className="leading-relaxed">{question.description}</p>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-400">Input:</h3>
            <p className="text-sm font-mono bg-gray-900 p-3 rounded text-gray-300">
              {question.input}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 text-blue-400">Output:</h3>
            <p className="text-sm font-mono bg-gray-900 p-3 rounded text-gray-300">
              {typeof question.output === "object" 
                ? JSON.stringify(question.output) 
                : question.output}
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-400">Examples:</h3>
            <div className="bg-gray-900 p-4 rounded">
              {Array.isArray(question.examples) ? (
                question.examples.map((ex, idx) => (
                  <div key={idx} className="mb-2 text-sm font-mono text-gray-300">
                    {typeof ex === "string" ? (
                      <p>{ex}</p>
                    ) : (
                      <p>{JSON.stringify(ex)}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm font-mono text-gray-300">
                  {typeof question.examples === "object" 
                    ? JSON.stringify(question.examples) 
                    : question.examples}
                </p>
              )}
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">
                Test Results: {testResults.passedCount}/{testResults.totalTests} Passed
              </h3>
              <div className="space-y-2">
                {testResults.results?.map((result, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded ${
                      result.passed ? "bg-green-900" : "bg-red-900"
                    }`}
                  >
                    <p className="text-sm font-mono text-white">
                      <strong>Test {result.testNumber}:</strong> {result.passed ? "✅ Passed" : "❌ Failed"}
                    </p>
                    <p className="text-xs text-gray-300">
                      Input: {JSON.stringify(result.input)}
                    </p>
                    <p className="text-xs text-gray-300">
                      Expected: {JSON.stringify(result.expectedOutput)}
                    </p>
                    <p className="text-xs text-gray-300">
                      Your Output: {JSON.stringify(result.output)}
                    </p>
                    {result.error && (
                      <p className="text-xs text-red-400">Error: {result.error}</p>
                    )}
                  </div>
                ))}
              </div>
              {testResults.error && (
                <p className="text-red-400 mt-2">{testResults.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Code Editor */}
        <div className="w-1/2 p-6 flex flex-col bg-gray-900">
          <div className="flex-1 rounded-lg overflow-hidden border border-gray-700">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 16,
                fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                readOnly: gameOver || opponentStatus === "completed",
              }}
              theme="vs-dark"
            />
          </div>

          <button
            onClick={submitAnswer}
            disabled={isSubmitting || status === "completed" || gameOver || opponentStatus === "completed"}
            className={`mt-4 px-8 py-4 rounded-lg font-bold text-lg transition shadow-lg ${
              status === "completed" || opponentStatus === "completed"
                ? "bg-green-600 cursor-not-allowed"
                : isSubmitting
                ? "bg-gray-600 cursor-wait"
                : "bg-blue-600 hover:bg-blue-700 active:scale-95"
            } text-white`}
          >
            {status === "completed" 
              ? "✅ You Completed!" 
              : opponentStatus === "completed"
              ? "⏱️ Opponent Won!"
              : isSubmitting 
              ? "⏳ Testing..." 
              : "🚀 Run Tests & Submit"}
          </button>

          {testResults?.success && status === "completed" && !gameOver && (
            <p className="text-center text-green-400 font-semibold mt-3 text-lg animate-pulse">
              🎉 Waiting for final results...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Arena;