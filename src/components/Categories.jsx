// components/Categories.js
import React from 'react';

const Categories = ({ onSelectCategory }) => {
  const categories = [
    { 
      id: 'dsa', 
      title: 'DSA', 
      description: 'Data Structures & Algorithms', 
      icon: 'fas fa-sitemap',
      color: 'bg-purple-100',
      textColor: 'text-purple-600',
      badges: ['EASY', 'MEDIUM', 'HARD']
    },
    { 
      id: 'problem-solving', 
      title: 'PROBLEM', 
      description: 'Real-world coding challenges', 
      icon: 'fas fa-lightbulb',
      color: 'bg-pink-100',
      textColor: 'text-pink-500',
      badges: ['CREATE', 'SOLVE']
    },
    { 
      id: 'logic', 
      title: 'LOGIC', 
      description: 'Think fast, code faster', 
      icon: 'fas fa-brain',
      color: 'bg-yellow-100',
      textColor: 'text-yellow-500',
      badges: ['PUZZLE', 'RIDDLE']
    },
    { 
      id: 'algorithms', 
      title: 'ALGO', 
      description: 'Optimize your solutions', 
      icon: 'fas fa-project-diagram',
      color: 'bg-blue-100',
      textColor: 'text-blue-500',
      badges: ['SPEED', 'POWER']
    }
  ];

  return (
    <section id="categories" className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-bold text-4xl mb-4">CHOOSE YOUR BATTLE MODE</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Select a category that matches your coding expertise</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id}
              className="bg-white rounded-xl p-6 text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100 relative overflow-hidden group"
              onClick={() => onSelectCategory(category.title)}
            >
              <div className={`absolute top-0 left-0 w-full h-1 ${category.color.replace('bg-', 'bg-')}`}></div>
              <div className={`${category.color} w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <i className={`${category.icon} ${category.textColor} text-2xl`}></i>
              </div>
              <h3 className="font-bold text-xl mb-2">{category.title}</h3>
              <p className="text-gray-600 mb-4">{category.description}</p>
              <div className="flex justify-center space-x-2">
                {category.badges.map((badge, index) => (
                  <span 
                    key={index} 
                    className={`px-3 py-1 rounded-full text-xs font-medium ${category.textColor.replace('text-', 'bg-').replace('600', '100')} ${category.textColor}`}
                  >
                    {badge}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;