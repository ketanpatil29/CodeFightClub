// App.jsx
import { useState, useEffect } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from './context/MatchContext';
import axios from 'axios';

import HeaderTop from './components/HeaderTop';
import Dashboard from './components/Dashboard';
import HowItWokrs from './components/HowItWorks';
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
  const [username, setUsername] = useState(localStorage.getItem("username") || "User");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [matchFoundModalOpen, setMatchFoundModalOpen] = useState(false);
  const [findingOpponent, setFindingOpponent] = useState(true);
  const [opponent, setOpponent] = useState("");
  const [opponentId, setOpponentId] = useState("");

  const openCategoryModal = () => setCategoryModalOpen(true);
  const closeCategoryModal = () => setCategoryModalOpen(false);

  const startMatch = () => {
    setCategoryModalOpen(false);
    setMatchFoundModalOpen(true);
    setFindingOpponent(true);
    setOpponent("");

    // Emit findMatch - backend will generate question
    socket.emit("findMatch", { 
      userId: token, 
      username: username,
      category: selectedCategory || "DSA"
    });
  };

  const cancelMatch = () => {
    socket.emit("cancelSearch", { userId: token });
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);
  };

  const enterBattle = () => {
    const arenaData = JSON.parse(localStorage.getItem("arenaData") || "{}");
    if (!arenaData || !arenaData.question) return alert("No question found!");
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);
    navigate("/arena", { state: arenaData });
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      console.log("🎮 Match found:", data);
      setFindingOpponent(false);
      setOpponent(data.opponent);
      setOpponentId(data.opponentId);

      // Save complete arenaData with question from backend
      localStorage.setItem("arenaData", JSON.stringify({
        roomId: data.roomId,
        question: data.question, // Question comes from backend now!
        opponent: data.opponent,
        opponentId: data.opponentId,
        user: { 
          id: token, 
          username: username,
          token: token 
        }
      }));

      console.log("📝 Question received:", data.question.title);

      // Auto-enter battle after short delay
      setTimeout(() => enterBattle(), 1500);
    };

    const handleWaiting = (data) => {
      console.log("⏳ Waiting for opponent:", data.message);
      if (data.question) {
        console.log("📝 Your question ready:", data.question.title);
      }
    };

    socket.on("matchFound", handleMatchFound);
    socket.on("waiting", handleWaiting);

    return () => {
      socket.off("matchFound", handleMatchFound);
      socket.off("waiting", handleWaiting);
    };
  }, [socket, token, username]);

  return (
    <>
      <div className="[font-family:'Space_Grotesk',sans-serif]">
        {window.location.pathname !== "/arena" && (
          <HeaderTop 
            token={token} 
            setLoginOpen={setShowLogin} 
            setToken={setToken}
            setUsername={setUsername}
          />
        )}

        <Routes>
          <Route
            path="/"
            element={
              <>
                <Dashboard onEnterArena={openCategoryModal} />
                <HowItWokrs />
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

      {showLogin && (
        <Login 
          onClose={() => setShowLogin(false)} 
          setToken={setToken}
          setUsername={setUsername}
        />
      )}
    </>
  );
}

// ArenaWrapper: gets arena data from router state or localStorage
function ArenaWrapper({ onExit }) {
  const location = useLocation();
  const arenaData = location.state || JSON.parse(localStorage.getItem("arenaData") || "{}");
  const { opponent, opponentId, question, user, roomId } = arenaData;

  if (!question || !opponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-white text-xl mb-4">No opponent or question found.</p>
          <button
            onClick={onExit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <Arena 
      user={user} 
      opponentName={opponent}
      opponentId={opponentId}
      question={question} 
      onExit={onExit}
    />
  );
}

export default AppWrapper;