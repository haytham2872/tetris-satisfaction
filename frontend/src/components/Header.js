// src/components/Header.js
import React from 'react';
import { ProgressBar, MilestoneIndicator } from './ProgressComponents';
import logo from '../assets/logo.png';

const Header = ({ currentStep, totalSteps }) => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
        <img src={logo} alt="Tetris Assurance" className="h-12 w-auto" />
          <div className="text-tetris-blue font-medium text-lg">
            Question {currentStep + 1} sur {totalSteps}
          </div>
        </div>
        
        <div className="mt-2">
          <ProgressBar 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
          />
          <MilestoneIndicator 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
