
import React from 'react';

const CategoryModal = ({ isOpen, onClose, onStartMatch, onSelectCategory, selectedCategory }) => {
  if (!isOpen) return null;

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
      </div>
    </div>
  );
};

export default CategoryModal;