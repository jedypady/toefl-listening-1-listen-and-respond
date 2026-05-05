
import React from 'react';

interface StartScreenProps {
  onStart: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-semibold text-slate-100 mb-4">Instructions</h2>
      <p className="text-slate-300 max-w-md mx-auto mb-6">
        You will hear a short question or statement. This will not be written on the screen.
        After listening, choose the most appropriate response from the four options provided.
      </p>
      <button
        onClick={onStart}
        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg"
      >
        Start Test
      </button>
    </div>
  );
};

export default StartScreen;
