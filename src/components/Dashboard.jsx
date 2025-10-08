import React from 'react';
import { motion } from 'framer-motion';

const cards = [
  {
    icon: "fas fa-robot",
    title: "AI Powered Questions",
    bg: "from-purple-100 to-pink-300/80",
    iconBg: "bg-white/50",
    iconColor: "text-purple-600"
  },
  {
    icon: "fas fa-users",
    title: "Compete with the developers worldwide",
    bg: "from-purple-100 to-pink-300/80",
    iconBg: "bg-white/50",
    iconColor: "text-purple-600"
  },
  {
    icon: "fas fa-coffee",
    title: "And don't buy me a coffee— just ****ing code here",
    bg: "from-purple-100 to-pink-300/80",
    iconBg: "bg-white/50",
    iconColor: "text-purple-600"
  }
];

const cardVariants = {
  offscreen: { y: 50, opacity: 0, scale: 0.8, rotate: -5 },
  onscreen: { 
    y: 0, 
    opacity: 1, 
    scale: 1, 
    rotate: 0, 
    transition: { type: "spring", bounce: 0.4, duration: 1 } 
  }
};

const Dashboard = ({ onEnterArena }) => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-black to-gray-900 flex justify-center items-center relative pt-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, type: "spring", stiffness: 80 }}
          className="text-center mb-16"
        >
          <h1 className="font-sans font-bold text-5xl md:text-7xl mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">
              CODE. COMPETE. CONQUER.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-10">
            Test your coding skills in real-time battles against developers worldwide
          </p>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95, rotate: -2 }}
            onClick={onEnterArena}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 flex items-center justify-center mx-auto"
          >
            <i className="fas fa-gamepad mr-2"></i>
            ENTER ARENA
          </motion.button>
        </motion.div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {cards.map((card, index) => (
            <motion.div
              key={index}
              className={`bg-gradient-to-br ${card.bg} flex flex-col items-center text-center rounded-xl p-6 shadow-md hover:shadow-gray-200 hover:shadow-sm transition-shadow`}
              initial="offscreen"
              whileInView="onscreen"
              viewport={{ once: true, amount: 0.5 }}
              variants={cardVariants}
              transition={{ delay: index * 0.2 }}
            >
              <motion.div
                className={`w-16 h-16 ${card.iconBg} rounded-xl flex items-center justify-center mb-4`}
                whileHover={{ rotate: 360, scale: 1.2 }}
                transition={{ type: "spring", stiffness: 120 }}
              >
                <i className={`${card.icon} ${card.iconColor} text-2xl`}></i>
              </motion.div>
              <motion.h3
                className="font-bold text-xl mb-2"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.2, type: "spring", stiffness: 100 }}
              >
                {card.title}
              </motion.h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
