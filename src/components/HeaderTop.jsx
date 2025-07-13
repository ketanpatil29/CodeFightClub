import React from 'react';

const HeaderTop = () => {
  return (
    <div className="bg-gray-200 w-full flex flex-col items-center text-center p-3">
        <h4 className="[font-family:'Space_Grotesk',sans-serif] text-lg">Welcome to,</h4>
        <img src="/src/assets/cfc.gif" alt="CodeFightClub" className="h-24 object-contain" />
        <h4 className="[font-family:'Space_Grotesk',sans-serif] text-lg">Engage in a head-to-head coding battle. Select your language, showcase your logic, and rise to the challenge.</h4>
    </div>
  )
}

export default HeaderTop