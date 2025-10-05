import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Dashboard = ({ onEnterArena }) => {
  return (
    <section className="min-h-screen bg flex justify-center items-center relative bg-gradient-to-br from-gray-100 to-white pt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="font-sans font-bold text-5xl md:text-7xl mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">
              CODE. COMPETE. CONQUER.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">Test your coding skills in real-time battles against developers worldwide</p>
          
          <button onClick={onEnterArena} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:translate-y-[-2px] px-8 py-3">
            <i className="fas fa-gamepad mr-2"></i>
            ENTER ARENA
          </button>
        </div>
        
      </div>
    </section>
  )
}

export default Dashboard;
