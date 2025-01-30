import React from 'react';
import { Clock, CheckCircle, PencilLine, ThumbsUp, Settings } from 'lucide-react';

const ProgressBar = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / (totalSteps - 1)) * 100;
  
  const getEstimatedTime = (remaining) => {
    if (remaining <= 2) return "environ 1 minute";
    if (remaining <= 5) return "2-3 minutes";
    return "3-4 minutes";
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-tetris-blue animate-pulse" />
          <span className="text-sm text-gray-600">
            Temps restant estimé : {getEstimatedTime(totalSteps - currentStep)}
          </span>
        </div>
        <span className="text-sm font-medium text-tetris-blue">
          {progress.toFixed(0)}% complété
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-tetris-blue transition-all duration-1000 ease-out transform origin-left"
          style={{ 
            width: `${progress}%`,
            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' 
          }}
        >
          <div className="h-full w-full animate-shimmer bg-gradient-to-r from-tetris-blue via-blue-400 to-tetris-blue bg-[length:200%_100%]" />
        </div>
      </div>
    </div>
  );
};

const MilestoneIndicator = ({ currentStep, totalSteps }) => {
  const milestones = [
    { step: 0, icon: CheckCircle, label: "Satisfaction Générale" },
    { step: 2, icon: Settings, label: "Qualité du Service" },
    { step: 5, icon: PencilLine, label: "Processus et Support" },
    { step: 9, icon: ThumbsUp, label: "Suggestions" }
  ];

  const getCurrentMilestone = () => {
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (currentStep >= milestones[i].step) {
        return milestones[i];
      }
    }
    return milestones[0];
  };

  const currentMilestone = getCurrentMilestone();
  const Icon = currentMilestone.icon;

  return (
    <div className="flex items-center gap-2 mb-2 text-tetris-blue transition-all duration-300 ease-in-out transform">
      <Icon className="w-6 h-6 animate-bounce" />
      <span className="font-medium animate-fadeIn">{currentMilestone.label}</span>
    </div>
  );
};

export { ProgressBar, MilestoneIndicator };