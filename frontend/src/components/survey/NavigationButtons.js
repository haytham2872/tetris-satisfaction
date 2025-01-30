// In NavigationButtons.js
import React from 'react';

const NavigationButtons = ({ 
  currentStep, 
  totalSteps, 
  onPrev, 
  onNext, 
  onSubmit 
}) => {
  // Check if we're on the last question by comparing with totalSteps
  const isLastQuestion = currentStep === totalSteps - 1;

  return (
    <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
      <button
        onClick={onPrev}
        disabled={currentStep === 0}
        className={`px-6 py-3 rounded-lg text-lg transition-all duration-300
          ${currentStep === 0
            ? 'bg-gray-300 cursor-not-allowed opacity-50'
            : 'bg-white border border-gray-300 hover:bg-gray-50 hover:shadow-md'
          }`}
      >
        Précédent
      </button>

      {isLastQuestion ? (
        <button
          onClick={onSubmit}
          className="px-6 py-3 bg-tetris-blue text-white rounded-lg
                     hover:bg-blue-700 transition-all duration-300 hover:shadow-lg
                     transform hover:-translate-y-1"
        >
          Terminer
        </button>
      ) : (
        <button
          onClick={onNext}
          className="px-6 py-3 bg-tetris-blue text-white rounded-lg
                     hover:bg-blue-700 transition-all duration-300 hover:shadow-lg
                     transform hover:-translate-y-1"
        >
          Suivant
        </button>
      )}
    </div>
  );
};

export default NavigationButtons;