import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeaderTop = ({ token, user, setToken, setUser, setLoginOpen }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // On mount, check if user is logged in
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
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
              whileHover={{ scale: 1.1, y: -2 }}
              transition={{ type: "spring", stiffness: 120 }}
              className="text-gray-300 font-medium cursor-pointer hover:text-fuchsia-500 transition-colors"
            >
              {item}
            </motion.a>
          ))}
          {user ? (
            <div className="flex items-center gap-3 ml-4">
              <img
                src={user.avatar}
                alt="profile"
                className="w-8 h-8 rounded-full border border-gray-500"
              />
              <span className="text-gray-300 text-sm">{user.email}</span>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleLogout}
                className="text-red-600 ml-3 hover:text-red-800"
              >
                LOGOUT
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={handleLoginClick}
              className="text-pink-700 hover:text-fuchsia-500"
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