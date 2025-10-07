import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { useSocket } from "../context/MatchContext";

const Arena = ({ user, opponentName, question, onExit }) => {
  const socket = useSocket();
  const [code, setCode] = useState(""); // User code
  const [status, setStatus] = useState("waiting");
  const [opponentStatus, setOpponentStatus] = useState("waiting");

  const funcTemplate = `function solve(...args) {
  // Write your code here
}`;

  useEffect(() => {
    setCode(funcTemplate);
  }, []);

  const submitAnswer = async () => {
    const roomId = localStorage.getItem("arenaData")?.roomId;

    try {
      const res = await fetch("http://localhost:5000/submit-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, question }),
      });
      const data = await res.json();
      console.log("Test Results:", data);
      alert(data.message || "Submitted!");
      setStatus("submitted");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Error submitting code");
    }

    // Optional: Emit socket event if you want real-time opponent updates
    socket.emit("submitAnswer", { userId: user.token, code, roomId });
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="flex-0 p-4 bg-gray-100 border-b flex justify-between">
        <div>
          <h1 className="text-xl font-bold">Arena</h1>
          <p>Opponent: {opponentName}</p>
          <p>Status: You - {status}, Opponent - {opponentStatus}</p>
        </div>
        <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={onExit}>
          Exit
        </button>
      </div>

      <div className="flex flex-1">
        {/* Left panel: question */}
        {/* Left panel: question */}
<div className="w-1/2 p-6 overflow-auto bg-gray-50 border-r">
  <h2 className="text-2xl font-semibold mb-4">{question.title}</h2>
  <p className="mb-2">{question.description}</p>
  <p className="text-sm font-mono mb-1">
    <strong>Expected Output:</strong>{" "}
    {typeof question.output === "object" ? JSON.stringify(question.output) : question.output}
  </p>

  {Array.isArray(question.examples) && question.examples.length > 0 ? (
    question.examples.map((ex, idx) => (
      <div key={idx} className="text-sm font-mono mb-2">
        {typeof ex === "string" && (
          <p>
            <strong>Example {idx + 1}:</strong> {ex}
          </p>
        )}
        {typeof ex === "object" && (
          <>
            {ex.name && <p><strong>Name:</strong> {ex.name}</p>}
            {ex.type && <p><strong>Type:</strong> {ex.type}</p>}
            {ex.example && (
              <p>
                <strong>Example:</strong>{" "}
                {typeof ex.example === "object" ? JSON.stringify(ex.example) : ex.example}
              </p>
            )}
          </>
        )}
      </div>
    ))
  ) : (
    <p className="text-sm font-mono">
      <strong>Example:</strong>{" "}
      {typeof question.examples === "object" ? JSON.stringify(question.examples) : question.examples}
    </p>
  )}
</div>


        {/* Right panel: editor */}
        <div className="w-1/2 p-4 flex flex-col">
          <div className="editor-container w-full h-[90%] p-4 bg-gray-800 rounded-lg shadow-lg">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              value={code}
              onChange={setCode}
              options={{
                fontSize: 16,
                fontFamily: "Fira Code, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                renderWhitespace: "all",
                automaticLayout: true,
              }}
              theme="vs-dark"
            />
          </div>

          <button
            onClick={submitAnswer}
            disabled={status === "submitted"}
            className={`mt-4 px-6 py-3 rounded-lg font-semibold text-white ${
              status === "submitted" ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {status === "submitted" ? "Submitted" : "Submit Answer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Arena;
