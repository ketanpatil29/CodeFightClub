// App.jsx
import { useState, useEffect } from "react";
import "./App.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "./context/MatchContext";

import HeaderTop from "./components/HeaderTop";
import Dashboard from "./components/Dashboard";
import HowItWokrs from "./components/HowItWorks";
import Login from "./components/Login";
import OAuthCallback from "./components/OAuthCallback";
import CategoryModal from "./components/CategoryModal";
import MatchFoundModal from "./components/MatchFoundModal";
import Arena from "./components/Arena";

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

  // USER — always use same format: {_id, username, email}
  const [user, setUser] = useState(() => ({
    _id: localStorage.getItem("userId") || null,
    username: localStorage.getItem("username") || "User",
    email: localStorage.getItem("email") || null,
  }));

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [matchFoundModalOpen, setMatchFoundModalOpen] = useState(false);
  const [findingOpponent, setFindingOpponent] = useState(true);

  const [opponent, setOpponent] = useState("");
  const [opponentId, setOpponentId] = useState("");

  const openCategoryModal = () => setCategoryModalOpen(true);
  const closeCategoryModal = () => setCategoryModalOpen(false);

  // ⭐ Start matchmaking
  const startMatch = () => {
    if (!user._id) {
      setShowLogin(true);
      return;
    }

    setCategoryModalOpen(false);
    setMatchFoundModalOpen(true);
    setFindingOpponent(true);
    setOpponent("");

    socket.emit("findMatch", {
      userId: user._id,
      username: user.username,
      category: selectedCategory || "DSA",
    });
  };

  // Cancel matchmaking
  const cancelMatch = () => {
    if (user?._id) socket.emit("cancelSearch", { userId: user._id });
    setFindingOpponent(false);
    setMatchFoundModalOpen(false);
  };

  // Enter arena
  const enterBattle = () => {
    const arenaData = JSON.parse(localStorage.getItem("arenaData") || "{}");
    if (!arenaData || !arenaData.question) return alert("No question found!");

    setMatchFoundModalOpen(false);
    setFindingOpponent(false);
    navigate("/arena", { state: arenaData });
  };

  // ⭐ SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      console.log("🎮 Match Found:", data);

      setFindingOpponent(false);
      setOpponent(data.opponent);
      setOpponentId(data.opponentId);

      // save arena data
      localStorage.setItem(
        "arenaData",
        JSON.stringify({
          roomId: data.roomId,
          question: data.question,
          opponent: data.opponent,
          opponentId: data.opponentId,
          user: user,
        })
      );

      setTimeout(() => enterBattle(), 1200);
    };

    const handleWaiting = (data) => {
      console.log("⏳ Waiting for opponent...");
    };

    socket.on("matchFound", handleMatchFound);
    socket.on("waiting", handleWaiting);

    return () => {
      socket.off("matchFound", handleMatchFound);
      socket.off("waiting", handleWaiting);
    };
  }, [socket, user]);

  return (
    <>
      <div className="[font-family:'Space_Grotesk',sans-serif]">
        {window.location.pathname !== "/arena" && (
          <HeaderTop
            user={user}
            setLoginOpen={setShowLogin}
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
                  opponent={opponent}
                />
              </>
            }
          />

          <Route path="/oauth-callback" element={<OAuthCallback />} />

          <Route
            path="/arena"
            element={<ArenaWrapper onExit={() => navigate("/")} />}
          />
        </Routes>
      </div>

      {showLogin && (
        <Login
          onClose={() => setShowLogin(false)}
          setUser={setUser}
        />
      )}
    </>
  );
}

// ⭐ Arena wrapper
function ArenaWrapper({ onExit }) {
  const location = useLocation();
  const arenaData = location.state || JSON.parse(localStorage.getItem("arenaData") || "{}");

  if (!arenaData.question || !arenaData.opponent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No opponent or question found.</p>
          <button
            onClick={onExit}
            className="bg-blue-600 px-6 py-3 rounded-lg text-white font-semibold"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <Arena
      user={arenaData.user}
      opponentName={arenaData.opponent}
      opponentId={arenaData.opponentId}
      question={arenaData.question}
      roomId={arenaData.roomId}
      onExit={onExit}
    />
  );
}

export default AppWrapper;
