import React from 'react';

const HeaderTop = () => {
  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <img src="/src/assets/cfc.gif" alt="logo" className="h-9 w-auto" />
        
        <div className="hidden md:flex space-x-8">
          <a className="text-gray-700 hover:scale-110 hover:text-purple-600 transition-transform duration-200 font-medium">HOME</a>
          <a className="text-gray-700 hover:scale-110 hover:text-purple-600 transition-transform duration-200 font-medium">HOW IT WORKS?</a>
          <a className="text-gray-700 hover:scale-110 hover:text-purple-600 transition-transform duration-200 font-medium">CATEGORIES</a>
          <a className="text-gray-700 hover:scale-110 hover:text-purple-600 transition-transform duration-200 font-medium">LEADERBOARD</a>

          <button className="text-pink-700 hover:scale-110 hover:text-purple-700 transition-transform duration-200 font-medium">LOGIN</button>
        </div>
      </div>
    </nav>
  )
}

export default HeaderTop