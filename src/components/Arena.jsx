// src/pages/Arena.jsx
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

const Arena = () => {
  const { roomId } = useParams();
  const location = useLocation();
  const question = location.state?.question || "No question received";

  return (
    <div className="text-white p-10">
      <h1 className="text-3xl font-bold mb-4">Welcome to the Arena!</h1>
      <p>Room ID: {roomId}</p>
      <p>Question: {question}</p>
    </div>
  );
};

export default Arena;