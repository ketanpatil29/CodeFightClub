
import React from 'react';
import { useSocket } from '../context/MatchContext';

const CategoryModal = ({ isOpen, onClose, onStartMatch, onSelectCategory, selectedCategory }) => {
  const socket = useSocket();

  if (!isOpen) return null;

  const handleFindMatch = () => {
  if (!socket) return alert("Socket not ready yet!");
  if (!selectedCategory) return alert("Please select a category!");

  if (!selectedCategory) return alert("Please select a category!");

  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("userName");

  socket.emit("findMatch", { userId, username, category: selectedCategory });
  onStartMatch();
};

  const categories = [
    { 
      title: 'DSA', 
      description: 'Data Structures & Algorithms', 
      icon: 'fas fa-sitemap',
      color: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    { 
      title: 'PROBLEM', 
      description: 'Real-world coding challenges', 
      icon: 'fas fa-lightbulb',
      color: 'bg-pink-100',
      textColor: 'text-pink-500'
    },
    { 
      title: 'LOGIC', 
      description: 'Think fast, code faster', 
      icon: 'fas fa-brain',
      color: 'bg-yellow-100',
      textColor: 'text-yellow-500'
    },
    { 
      title: 'ALGO', 
      description: 'Optimize your solutions', 
      icon: 'fas fa-project-diagram',
      color: 'bg-blue-100',
      textColor: 'text-blue-500'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-bold text-2xl">SELECT YOUR BATTLE MODE</h1>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl"><i className="fas fa-times"></i></button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {categories.map((category) => (
            <button key={category.title} 
            className={`bg-gray-50 rounded-xl text-center transition-all duration-300 hover:shadow-md hover:translate-y-1 border border-gray-200 p-6 ${selectedCategory === category.title ? 'ring-2 ring-purple-500' : ''}`}
            onClick={() => onSelectCategory(category.title)}
            >
              <div className={`${category.color} w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <i className={`${category.icon} ${category.textColor} text-2xl`}></i>
              </div>
              <h3 className="font-bold text-lg mb-2">{category.title}</h3>
              <p className="text-gray-600 text-sm">{category.description}</p>
            </button>
          ))}
        </div>

        {selectedCategory && 
          (
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">SELECTED CATEGORY: {" "}
                <span className="text-purple-600">
                  {selectedCategory}
                </span>
               </h2>
            </div>
          )
        }

        <div className="text-center">
          <button onClick={handleFindMatch} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold shadow-md hover:scale-105 hover:shadow-lg transition-all duration-300 w-full px-8 py-4">FIND MATCH</button>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;