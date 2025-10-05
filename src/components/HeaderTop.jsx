import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const HeaderTop = ({ token, setToken, setLoginOpen }) => {
  const navigate = useNavigate(); 

  // On mount, check if user is logged in
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) setToken(savedToken);
  }, []);

  const handleLoginClick = () => {
    setLoginOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);  // update state so UI reflects logout
  };

  return (
    <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="font-sans font-bold italic text-2xl md:text-2xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">
              CODEFIGHTCLUB
            </span>
        </h1>
        
        <div className="hidden md:flex space-x-8">
          <a className="text-gray-700 hover:scale-110 hover:text-purple-600 transition-transform duration-200 font-medium">HOME</a>
          <a className="text-gray-700 hover:scale-110 hover:text-purple-600 transition-transform duration-200 font-medium">HOW IT WORKS?</a>
          <a className="text-gray-700 hover:scale-110 hover:text-purple-600 transition-transform duration-200 font-medium">CATEGORIES</a>
          <a className="text-gray-700 hover:scale-110 hover:text-purple-600 transition-transform duration-200 font-medium">LEADERBOARD</a>

          {token ? ( <> <button onClick={handleLogout} className="ml-4 text-red-600 hover:text-red-800 font-medium">LOGOUT</button>  
          </> ) : (
          <button onClick={handleLoginClick} className="text-pink-700 hover:scale-110 hover:text-purple-700 transition-transform duration-200 font-medium">LOGIN</button>
          )}
          </div>
      </div>
    </nav>
  )
}

export default HeaderTop