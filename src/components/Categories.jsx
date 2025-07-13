import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/MatchContext';

const categories = ["DSA", "Problem Solving", "Logic", "Algorithms"];

const Categories = ({ onClose }) => {
  const socket = useSocket();
  const navigate = useNavigate();
  
  const [isSearching, setIsSearching] = useState(false);
  const [selectCategory, setSelectCategory] = useState(null);

  useEffect(() => {
    // Listen for a successful match
    socket.on("matchFound", ({ roomId, question }) => {
      navigate(`/arena/${roomId}`, { state: { question } });
    });

    // Clean up the socket listener when component unmounts
    return () => {
      socket.off("matchFound");
    };
  }, [socket, navigate]);

  const handleCategoryClick = (category) => {
    setIsSearching(true);
    setSelectCategory(category);
    socket.emit("joinCategory", category);
  };

  const handleCancel = () => {
    socket.emit("leaveQueue", selectCategory);
    setIsSearching(false);
    setSelectCategory(null);
    onClose();
  }

  return (
    <div className="w-[400px] bg-white rounded-lg p-6 shadow-xl text-center">
      {!isSearching ? (
        <>
          <h1 className="text-3xl mb-6 font-bold text-[#693495]">Select a Category</h1>
          <div className="flex flex-col gap-4">
            {["DSA", "Problem Solving", "Logic", "Algorithms"].map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="bg-purple-700 hover:bg-purple-800 transition text-white py-3 px-6 rounded-lg text-lg font-medium"
              >
                {cat}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-6 text-gray-600 hover:text-red-600 underline text-sm"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Searching for opponent...</h2>
          <div className="loader mx-auto my-4" />
          <p className="text-gray-600 mb-6">Category: <strong>{selectCategory}</strong></p>
          <button
            onClick={handleCancel}
            className="text-red-600 hover:text-red-800 underline"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
};

export default Categories;
