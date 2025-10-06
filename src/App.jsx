// App.jsx
import { useState } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useSocket } from './context/MatchContext';

import HeaderTop from './components/HeaderTop';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CategoryModal from './components/CategoryModal';
import MatchFoundModal from './components/MatchFoundModal';
import Arena from './components/Arena';
import axios from 'axios';

function AppWrapper() {
  // wrapper to use hooks like useNavigate
  return (
    <Router>
      <App />
    </Router>
  );
}

function App() {
  const socket = useSocket();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [matchFoundModalOpen, setMatchFoundModalOpen] = useState(false);
  const [findingOpponent, setFindingOpponent] = useState(true);
  const [opponent, setOpponent] = useState("");
  const [question, setQuestion] = useState(null); // AI question

  const openCategoryModal = () => setCategoryModalOpen(true);
  const closeCategoryModal = () => setCategoryModalOpen(false);

  const startMatch = () => {
    setCategoryModalOpen(false);
    setMatchFoundModalOpen(true);
    setFindingOpponent(true);
    setOpponent("");
  };

  const cancelMatch = () => {
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);
  };

  const fetchQuestion = async (category) => {
    try {
      const res = await axios.post("http://localhost:3000/ai/generate-question", { category });
      return res.data.question;
    } catch (err) {
      console.error("Failed to fetch AI question:", err);
      return { title: "Error", description: "Failed to fetch question.", input: "", output: "", examples: "" };
    }
  };

  const enterBattle = async () => {
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);

    // fetch AI question
    const aiQuestion = await fetchQuestion(selectedCategory);
    setQuestion(aiQuestion);

    // navigate to Arena page and pass opponent & question
    navigate("/arena", { state: { opponent, question: aiQuestion, user: { token } } });
  };

  return (
    <>
      <HeaderTop token={token} setLoginOpen={setShowLogin} setToken={setToken} />
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

      {showLogin && <Login onClose={() => setShowLogin(false)} setToken={setToken} />}

      <Routes>
        <Route
          path="/arena"
          element={<ArenaWrapper />}
        />
      </Routes>
    </>
  );
}

// Wrapper to pass location state to Arena component
import { useLocation } from 'react-router-dom';
function ArenaWrapper() {
  const location = useLocation();
  const { opponent, question, user } = location.state || {};

  if (!question || !opponent) {
    return <p className="p-6 text-center">No opponent or question found. Please start a match first.</p>;
  }

  return (
    <Arena
      roomId={user?.token} // or some room logic
      user={user}
      opponentName={opponent}
      question={question.description} // show description in Arena
      onExit={() => window.history.back()}
    />
  );
}

export default AppWrapper;
