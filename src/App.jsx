// App.jsx
import { useState } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from './context/MatchContext';

import HeaderTop from './components/HeaderTop';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import CategoryModal from './components/CategoryModal';
import MatchFoundModal from './components/MatchFoundModal';
import Arena from './components/Arena';

function AppWrapper() {
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

  // Use a hardcoded question for testing
  const testQuestion = {
  title: "Two Sum",
  description: "Return indices of two numbers adding to target",
  input: "[nums, target]",
  output: "[index1, index2]",
  examples: "Example: nums = [2,7,11,15], target = 9 -> [0,1]",
  testCases: [
    { input: [[2,7,11,15], 9], expectedOutput: [0,1] },
    { input: [[3,2,4], 6], expectedOutput: [1,2] }
  ]
  };

  const enterBattle = async () => {
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);

    const arenaData = {
      opponent: opponent || "Test Opponent",
      question: testQuestion,
      user: { token },
    };

    // Save arena data for refresh
    localStorage.setItem("arenaData", JSON.stringify(arenaData));

    navigate("/arena", { state: arenaData });
  };

  return (
    <><div className="[font-family:'Space_Grotesk',sans-serif]">
      {window.location.pathname !== "/arena" && (
        <HeaderTop token={token} setLoginOpen={setShowLogin} setToken={setToken} />
      )}

      <Routes>
        <Route
          path="/"
          element={
            <>
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
            </>
          }
        />
        <Route
          path="/arena"
            element={
              <ArenaWrapper
                onExit={() => {
                  localStorage.removeItem("arenaData");
                  navigate("/");
                }}
              />
            }
        />

      </Routes>
      </div>

      {showLogin && <Login onClose={() => setShowLogin(false)} setToken={setToken} />}
    </>
  );
}

// ArenaWrapper: gets state from router or localStorage
function ArenaWrapper({ onExit }) {
  const location = useLocation();
  const stateData = location.state || JSON.parse(localStorage.getItem("arenaData") || "{}");
  const { opponent, question, user } = stateData;

  if (!question || !opponent) {
    return <p className="p-6 text-center">No opponent or question found. Please start a match first.</p>;
  }

  return <Arena user={user} opponentName={opponent} question={question} onExit={onExit} />;
}

export default AppWrapper;
