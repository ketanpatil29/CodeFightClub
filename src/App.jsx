// src/App.jsx
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HeaderTop from './components/HeaderTop';
import HeaderNav from './components/HeaderNav';
import Dashboard from './components/Dashboard';
import Arena from './components/Arena'; // You need to create this

function App() {
  return (
    <Router>
      <div className="[font-family:'Space_Grotesk',sans-serif]">
        <HeaderTop />
        <HeaderNav />
        <div className="w-[1400px] h-[1px] bg-gray-400 opacity-50 rounded mx-auto mt-6"></div>

        {/* Routes go here */}
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/arena/:roomId" element={<Arena />} />
        </Routes>

        <div className="w-[1400px] h-[1px] bg-gray-400 opacity-50 rounded mx-auto mt-6"></div>
      </div>
    </Router>
  );
}

export default App;
