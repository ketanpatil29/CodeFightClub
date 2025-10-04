import { useState } from 'react';
import './App.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import HeaderTop from './components/HeaderTop';
import HeaderNav from './components/HeaderNav';
import Dashboard from './components/Dashboard';
import CategoryModal from './components/CategoryModal';
import Arena from './components/Arena'; // You need to create this

function App() {

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const openCategoryModal = () => {
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
  };

  const startMatch = () => {
    setSelectedCategory(true);
  }

  return (
    <Router>
      <div className="[font-family:'Space_Grotesk',sans-serif]">
        <HeaderTop />
        
        <Dashboard onEnterArena={openCategoryModal}/>

        <CategoryModal 
          isOpen={categoryModalOpen}
          onClose={closeCategoryModal}
          selectedCategory={selectedCategory}
          onStartMatch={startMatch}
          onSelectCategory={setSelectedCategory}
        />
      </div>
    </Router>
  );
}

export default App;
