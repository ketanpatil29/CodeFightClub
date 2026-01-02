import { useState, useEffect } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from './context/MatchContext';

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
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [matchFoundModalOpen, setMatchFoundModalOpen] = useState(false);
  const [findingOpponent, setFindingOpponent] = useState(true);
  const [opponent, setOpponent] = useState("");
  const [opponentId, setOpponentId] = useState("");

  const openCategoryModal = () => {
    if (!user || !user.id) {
      alert("Please login first!");
      setShowLogin(true);
      return;
    }
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setSelectedCategory("");
  };

  const startMatch = () => {
    if (!socket || !socket.connected) {
      alert("Connection error! Please refresh the page.");
      return;
    }

    if (!selectedCategory) {
      alert("Please select a category!");
      return;
    }

    // Get userId and username from multiple sources
    const userId = user?.id || localStorage.getItem("userId");
    const username = user?.name || localStorage.getItem("userName") || user?.email || localStorage.getItem("userEmail");

    if (!userId || !username) {
      alert("User data not found. Please login again.");
      setShowLogin(true);
      return;
    }

    console.log("🎯 Starting match search...");
    
    setCategoryModalOpen(false);
    setMatchFoundModalOpen(true);
    setFindingOpponent(true);
    setOpponent("");

    // Emit findMatch to backend
    socket.emit("findMatch", {
      userId,
      username,
      category: selectedCategory,
    });

    console.log("📤 Emitted findMatch:", { userId, username, category: selectedCategory });
  };

  const cancelMatch = () => {
    if (socket) {
      socket.emit("cancelSearch", { userId: user?.id });
    }
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);
    setSelectedCategory("");
    setOpponent("");
  };

  const enterBattle = () => {
    const arenaData = JSON.parse(localStorage.getItem("arenaData") || "{}");
    
    if (!arenaData || !arenaData.question) {
      alert("No question found! Please try again.");
      setMatchFoundModalOpen(false);
      return;
    }

    console.log("⚔️ Entering arena with data:", arenaData);
    
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);
    navigate("/arena", { state: arenaData });
  };

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      console.log("🎮 Match found event in App:", data);
      setFindingOpponent(false);
      setOpponent(data.opponent);
      setOpponentId(data.opponentId);

      // Save complete arenaData
      const arenaPayload = {
        roomId: data.roomId,
        question: data.question,
        opponent: data.opponent,
        opponentId: data.opponentId,
        user: {
          id: user?.id,
          name: user?.name,
          token
        }
      };

      localStorage.setItem("arenaData", JSON.stringify(arenaPayload));
      console.log("✅ Arena data saved:", arenaPayload);

      // Auto-enter battle after short delay
      setTimeout(() => {
        enterBattle();
      }, 1500);
    };

    const handleWaiting = (data) => {
      console.log("⏳ Waiting for opponent:", data);
      setFindingOpponent(true);
    };

    socket.on("matchFound", handleMatchFound);
    socket.on("waiting", handleWaiting);

    return () => {
      socket.off("matchFound", handleMatchFound);
      socket.off("waiting", handleWaiting);
    };
  }, [socket, token, user]);

  return (
    <>
      <div className="[font-family:'Space_Grotesk',sans-serif]">
        {window.location.pathname !== "/arena" && (
          <HeaderTop
            user={user}
            setLoginOpen={setShowLogin}
            setToken={setToken}
            setUser={setUser}
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
          setUser={setUser}
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

  if (!question || !opponent || !roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-white text-xl mb-4">No match data found.</p>
          <button
            onClick={onExit}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
      roomId={roomId}
      onExit={onExit}
    />
  );
}

export default AppWrapper;