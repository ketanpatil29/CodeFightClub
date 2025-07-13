import React from 'react';

const HeaderNav = () => {
  return (
    <nav className="bg-transparent [font-family:'Space_Grotesk',sans-serif] px-6 py-3 flex justify-center gap-4 mx-auto mt-6 w-fit">
        <button className="text-[16px] text-black font-bold bg-lime-300 px-4 py-3 shadow-[4px_4px_0_0_#2d00a0] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide">HOME</button>
        <button className="text-[16px] text-black font-bold bg-lime-300 px-4 py-3 shadow-[4px_4px_0_0_#2d00a0] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide">MATCH</button>
        <button className="text-[16px] text-black font-bold bg-lime-300 px-4 py-3 shadow-[4px_4px_0_0_#2d00a0] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide">LEADERBOARD</button>
        <button className="text-[16px] text-black font-bold bg-lime-300 px-4 py-3 shadow-[4px_4px_0_0_#2d00a0] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide">PRACTICE</button>
        <button className="text-[16px] text-black font-bold bg-lime-300 px-4 py-3 shadow-[4px_4px_0_0_#2d00a0] active:shadow-[2px_2px_0_0_#2d00a0] active:translate-x-[2px] active:translate-y-[2px] tracking-wide">PROFILE</button>
    </nav>
  )
}

export default HeaderNav