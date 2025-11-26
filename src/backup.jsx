import { useState } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router } from 'react-router-dom';

import HeaderTop from './components/HeaderTop';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CategoryModal from './components/CategoryModal';
import MatchFoundModal from './components/MatchFoundModal';
import Arena from './components/Arena';

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [showLogin, setShowLogin] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [matchFoundOpen, setMatchFoundOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [findingOpponent, setFindingOpponent] = useState(true);

  const openCategoryModal = () => setCategoryModalOpen(true);
  const closeCategoryModal = () => setCategoryModalOpen(false);

  const startMatch = () => {
    setCategoryModalOpen(false);
    setMatchFoundOpen(true);
    setFindingOpponent(true);

    // simulate searching and opponent found
    setTimeout(() => {
      setFindingOpponent(false);
    }, 3000); // after 3 sec → opponent found
  };

  const cancelMatch = () => {
    setMatchFoundOpen(false);
  };

  const enterBattle = () => {
    setMatchFoundOpen(false);
    // Here, navigate to Arena or render Arena directly
    alert("Match started! Redirecting to Arena...");
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
          isOpen={matchFoundOpen}
          findingOpponent={findingOpponent}
          onEnterBattle={enterBattle}
          onCancelMatch={cancelMatch}
          selectedCategory={selectedCategory}
        />
      </div>

      {showLogin && <Login onClose={() => setShowLogin(false)} setToken={setToken} />}
    </Router>
  );
}

export default App;