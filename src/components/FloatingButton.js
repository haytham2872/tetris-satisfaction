import React from 'react';
import { BarChart2 } from 'lucide-react';

const FloatingButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-tetris-blue hover:bg-tetris-light text-white 
                 rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 transition-colors"
    >
      <BarChart2 className="w-5 h-5" />
      <span>Statistiques</span>
    </button>
  );
};

export default FloatingButton;