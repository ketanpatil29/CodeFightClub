import { useState } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useSocket } from './context/MatchContext';

import HeaderTop from './components/HeaderTop';
import HeaderNav from './components/HeaderNav';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CategoryModal from './components/CategoryModal';
import MatchFoundModal from './components/MatchFoundModal';
import Arena from './components/Arena'; // You need to create this

function App() {
  const socket = useSocket();

  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [matchFoundModalOpen, setMatchFoundModalOpen] = useState(false);
  const [findingOpponent, setFindingOpponent] = useState(true);
  const [opponent, setOpponent] = useState("");

  const openCategoryModal = () => {
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
  };

  const startMatch = () => {
    setCategoryModalOpen(false);
    setMatchFoundModalOpen(true);
    setFindingOpponent(true);
    setOpponent("");
  }

  const cancelMatch= ()=> {
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);
  };

  const enterBattle = () => {
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);

    console.log("Entering battle..");
  };

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

        <MatchFoundModal 
          isOpen={matchFoundModalOpen}
          onEnterBattle={enterBattle}
          findingOpponent={findingOpponent}
          onCancelMatch={cancelMatch}
          selectedCategory={selectedCategory}
          setFindingOpponent={setFindingOpponent}
          setOpponent={setOpponent}
          opponent={opponent}
        />
      </div>

      {showLogin && <Login onClose={() => setShowLogin(false)} setToken={setToken} />}
    </Router>
  );
}

export default App;