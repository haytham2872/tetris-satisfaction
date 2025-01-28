import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';

const ContactButton = ({ onClick }) => {
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 animate-fadeIn">
      <button
        onClick={onClick}
        className="flex flex-col items-center gap-2 bg-white text-tetris-blue p-4 rounded-xl 
                   shadow-lg hover:bg-blue-50 transform hover:scale-105 
                   transition-all duration-300 group border border-tetris-blue/10"
      >
        <div className="relative">
          <Phone className="w-6 h-6 text-tetris-blue" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </div>
        <span className="text-sm font-medium whitespace-nowrap text-tetris-blue">
          Laissez-nous vos coordonnées
        </span>
        <MessageSquare className="w-4 h-4 text-tetris-blue opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
};

export default ContactButton;