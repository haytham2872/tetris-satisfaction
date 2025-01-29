import React from 'react';
import { ThumbsUp, Heart, Star, CheckCircle2 } from 'lucide-react';

const ThankYouScreen = () => {
  return (
    <div className="fixed inset-0 bg-tetris-blue bg-opacity-95 flex items-center justify-center z-50 animate-fadeIn">
      <div className="text-center">
        <div className="space-y-6">
          <div className="flex justify-center space-x-4 mb-8">
            <ThumbsUp className="w-12 h-12 text-white animate-bounce" />
            <Heart className="w-12 h-12 text-white animate-pulse" />
            <Star className="w-12 h-12 text-white animate-bounce delay-100" />
            <CheckCircle2 className="w-12 h-12 text-white animate-pulse delay-100" />
          </div>

          <h2 className="text-4xl font-bold text-white mb-4 animate-slideUp">
            Merci pour vos réponses !
          </h2>
          <p className="text-xl text-white opacity-90 animate-slideUp animation-delay-200">
            Votre avis est précieux pour nous aider à améliorer nos services.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYouScreen;