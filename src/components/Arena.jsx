import React, { useState, useEffect } from "react";
import { useSocket } from "../context/MatchContext";
import axios from "axios";

const Arena = ({ roomId, user, opponentName, category, onExit }) => {
  const socket = useSocket();
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("waiting"); // waiting, submitted
  const [opponentStatus, setOpponentStatus] = useState("waiting");
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [error, setError] = useState("");

  // Fetch AI-generated question on load
  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        setLoadingQuestion(true);
        const res = await axios.post("http://localhost:3000/ai/generate-question", {
          category,
          difficulty: "medium",
        });
        setQuestion(res.data.question);
        setLoadingQuestion(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load question. Try again.");
        setLoadingQuestion(false);
      }
    };

    fetchQuestion();
  }, [category]);

  // Listen for opponent submissions
  useEffect(() => {
    if (!socket || !roomId) return;

    const handleOpponentSubmit = (data) => {
      console.log("Opponent submitted:", data);
      setOpponentStatus("submitted");
    };

    socket.on("opponentSubmit", handleOpponentSubmit);

    return () => {
      socket.off("opponentSubmit", handleOpponentSubmit);
    };
  }, [socket, roomId]);

  const submitAnswer = () => {
    if (!answer.trim()) return;

    socket.emit("submitAnswer", { roomId, userId: user._id, answer });
    setStatus("submitted");
  };

  if (loadingQuestion) {
    return <p className="p-6 text-center text-lg">Loading AI-generated question...</p>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <button onClick={onExit} className="mt-4 text-blue-600 underline">
          Exit Arena
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Arena</h1>
      <p className="mb-2">Opponent: {opponentName}</p>

      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h2 className="font-semibold text-lg mb-2">{question.title}</h2>
        <p className="mb-2">{question.description}</p>
        <p className="text-sm font-mono mb-1"><strong>Input:</strong> {question.input}</p>
        <p className="text-sm font-mono mb-2"><strong>Output:</strong> {question.output}</p>
        <p className="text-sm font-mono"><strong>Example:</strong> {question.examples}</p>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your solution here..."
        className="w-full p-4 border rounded-lg mb-4"
        rows={8}
      />

      <button
        onClick={submitAnswer}
        disabled={status === "submitted"}
        className={`px-6 py-3 rounded-lg text-white font-semibold ${
          status === "submitted" ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {status === "submitted" ? "Submitted" : "Submit Answer"}
      </button>

      <p className="mt-4">Opponent Status: {opponentStatus}</p>

      <button onClick={onExit} className="mt-6 text-red-500 underline">
        Exit Arena
      </button>
    </div>
  );
};

export default Arena;
