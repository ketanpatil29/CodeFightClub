import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const HeaderTop = ({ user, setToken, setUser, setLoginOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
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
          className="font-bold italic text-2xl cursor-pointer"
          onClick={() => navigate("/")}
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-pink-600">
            CODEFIGHTCLUB
          </span>
        </motion.h1>

        <div className="hidden md:flex space-x-8 items-center">
          {navItems.map((item) => (
            <span
              key={item}
              className="text-gray-300 hover:text-fuchsia-500 cursor-pointer"
            >
              {item}
            </span>
          ))}

          {user ? (
            <div className="flex items-center gap-3 ml-4">
              <img
                src={user.avatar}
                alt="profile"
                className="w-8 h-8 rounded-full border border-gray-500"
              />
              <span className="text-gray-300 text-sm">{user.email}</span>

              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 ml-3"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="text-pink-700 hover:text-fuchsia-500"
            >
              LOGIN
            </button>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default HeaderTop;
