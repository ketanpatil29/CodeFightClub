import { useState } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HeaderTop from './components/HeaderTop';
import HeaderNav from './components/HeaderNav';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CategoryModal from './components/CategoryModal';
import Arena from './components/Arena'; // You need to create this

function App() {

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loginOpen, setLoginOpen] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const openCategoryModal = () => {
    setCategoryModalOpen(true);
  };

  const openLoginModal = () => 
  {
    setShowLogin(true);
  }

  const closeLoginModal = () => {
    setOpenLoginModal(false);
  }

  const closeCategoryModal = () => {
    setShowLogin(false);
  };

  const startMatch = () => {
    setSelectedCategory(true);
  }

  return (
    <Router>
      <div className="[font-family:'Space_Grotesk',sans-serif]">
        <HeaderTop token={token} setLoginOpen={setShowLogin} setToken={setToken}/>
        
        <Dashboard onEnterArena={openCategoryModal} />

        <CategoryModal 
          isOpen={categoryModalOpen}
          onClose={closeCategoryModal}
          selectedCategory={selectedCategory}
          onStartMatch={startMatch}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {showLogin && <Login onClose={() => setShowLogin(false)} setToken={setToken} />}
    </Router>
  );
}

export default App;
