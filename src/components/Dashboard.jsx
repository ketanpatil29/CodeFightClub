import React, { useState } from 'react';
import Categories from './Categories';

const characterImages = [
  "/src/assets/characterImage2.jpg",
  "/src/assets/characterImage1.jpg",
  "/src/assets/characterImage3.jpg"
];

const Dashboard = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + characterImages.length) % characterImages.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % characterImages.length);
  };

  return (
    <>
      <div className={`flex h-[500px] w-[1800px] rounded-lg mx-auto my-6 ${showCategoryModal ? 'blur-sm brightness-50' : ''}`}>
        <div className="flex flex-col h-fit w-auto rounded-lg m-6 p-4">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="text-[30px] text-black font-bold bg-lime-300 px-4 py-3 shadow-[4px_4px_0_0_#2d00a0] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide m-4"
          >
            ENTER ARENA
          </button>
          <button className="text-[30px] text-black font-bold bg-[#0091d9] px-4 py-3 shadow-[4px_4px_0_0_#f2eae6] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide m-4">SOLO PRACTICE</button>
          <button className="text-[30px] text-black font-bold bg-[#0091d9] px-4 py-3 shadow-[4px_4px_0_0_#f2eae6] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide m-4">RANKED MATCH</button>
          <button className="text-[30px] text-black font-bold bg-[#0091d9] px-4 py-3 shadow-[4px_4px_0_0_#f2eae6] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide m-4">CHALLENGE A FRIEND</button>
        </div>

        <div className="bg-transparent flex-1 m-6">
          {/* Middle progress chart section (add later) */}
        </div>

        <div className="flex justify-end h-auto w-[500px] md:w-[500px] rounded-lg m-6">

          <div className="flex flex-col items-center h-fit w-fit ">
            <div className="relative bg-gray-200 border border-b-black rounded-lg h-[200px] w-[200px] m-4 overflow-hidden">
              <button onClick={handlePrev} className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-transparent border-2 rounded shadow hover:bg-[#4a3359]">
                <img src="/src/assets/leftArrow.png" alt="left" className="h-6 w-6" />
              </button>
              <img src={characterImages[currentIndex]} alt="pfp" className="object-cover h-full w-full rounded" />
              <button onClick={handleNext} className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-transparent border-2 rounded shadow hover:bg-[#4a3359]">
                <img src="/src/assets/rightArrow.png" alt="right" className="h-6 w-6" />
              </button>
            </div>
            <button className="text-[16px] text-black font-bold bg-lime-300 px-4 py-3 shadow-[4px_4px_0_0_#2d00a0] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide">Upload your image</button>
          </div>
        </div>
      </div>

      {showCategoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <Categories onClose={() => setShowCategoryModal(false)} />
        </div>
      )}
    </>
  );
};

export default Dashboard;
