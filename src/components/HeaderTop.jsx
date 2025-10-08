import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    setToken(null);
  };

  const navItems = ["HOME", "HOW IT WORKS?", "CATEGORIES", "LEADERBOARD"];

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80, damping: 12 }}
      className="fixed w-full z-50 bg-black/70 backdrop-blur-sm border-b border-gray-100 py-4 px-6 shadow-md"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 120 }}
          className="font-sans font-bold italic text-2xl md:text-2xl cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">
            CODEFIGHTCLUB
          </span>
        </motion.h1>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-8">
          {navItems.map((item, index) => (
            <motion.a
              key={index}
              whileHover={{ scale: 1.1, y: -2, color: "#D946EF" }}
              transition={{ type: "spring", stiffness: 120 }}
              className="text-gray-300 font-medium cursor-pointer"
            >
              {item}
            </motion.a>
          ))}

          {token ? (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ type: "spring", stiffness: 120 }}
              onClick={handleLogout}
              className="ml-4 text-red-600 hover:text-red-800 font-medium"
            >
              LOGOUT
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, y: -2, color: "#D946EF" }}
              transition={{ type: "spring", stiffness: 120 }}
              onClick={handleLoginClick}
              className="text-pink-700 font-medium"
            >
              LOGIN
            </motion.button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default HeaderTop;
