import React, { useEffect, useState } from 'react';
import { Trophy, Star, Clock, ThumbsUp, Gift, Coffee, Sun, Heart, AlertCircle } from 'lucide-react';
import pilotImage from '../assets/pilot.png';

const SpeechBubble = ({ message, icon: Icon }) => (
  <div className="absolute -top-28 left-1/2 -translate-x-1/2 transform">
    <div className="relative">
      <div className="bg-white rounded-2xl p-4 shadow-lg min-w-[250px] max-w-[300px]">
        <div className="flex items-start gap-2">
          {Icon && <Icon className="w-5 h-5 mt-1 text-tetris-blue/80 flex-shrink-0" />}
          <p className="text-sm text-tetris-blue leading-snug">{message}</p>
        </div>
      </div>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
        <div className="w-4 h-4 bg-white transform rotate-45 shadow-lg" />
      </div>
    </div>
  </div>
);

const ChatConversation = ({ messages }) => {
  const [currentMessage, setCurrentMessage] = useState(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setCurrentMessage(latestMessage);
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  return (
    <div className="fixed left-8 bottom-8 z-50">
      <div className="relative w-48">
        {currentMessage && isVisible && (
          <SpeechBubble
            message={currentMessage.message}
            icon={currentMessage.icon}
          />
        )}

        <img
          src={pilotImage}
          alt="Pilot Mascot"
          className={`w-full h-auto transition-transform duration-300 ${isVisible ? 'transform scale-105' : ''}`}
        />
      </div>
    </div>
  );
};

const getFeedbackMessage = (questionId, answer) => {
  const positiveMessages = [
    { message: "Excellent ! Votre satisfaction nous motive à faire encore mieux ! 🌟", icon: Trophy },
    { message: "Ravi de voir que notre service vous plaît ! On continue ainsi 💫", icon: Star },
    { message: "Super retour ! C'est encourageant pour toute l'équipe 💪", icon: Heart },
    { message: "Votre satisfaction est notre priorité ! Merci ! ✨", icon: ThumbsUp },
    { message: "On est ravis de vous offrir une bonne expérience ! 🎯", icon: Gift }
  ];

  const negativeMessages = [
    { message: "Merci de votre franchise. On va s'améliorer ! 🎯", icon: AlertCircle },
    { message: "On note vos remarques pour progresser. Merci ! 💪", icon: Clock },
    { message: "On comprend vos attentes et on va faire mieux 🔄", icon: AlertCircle },
    { message: "Votre avis nous aide à nous améliorer 📈", icon: Star },
    { message: "On va travailler pour mieux répondre à vos attentes 🎯", icon: AlertCircle }
  ];

  // Get random index for message selection
  const randomIndex = Math.floor(Math.random() * positiveMessages.length);

  if (typeof answer === 'number') {
    if (questionId === 2) {
      return answer >= 4 ? positiveMessages[randomIndex] : negativeMessages[randomIndex];
    }
  }

  // For text responses
  if (['Excellent', 'Toujours', 'Très clair', 'Oui, très simple', 'Très compétitive'].includes(answer)) {
    return positiveMessages[randomIndex];
  }
  if (['Insuffisant', 'Rarement', 'Pas clair du tout', 'Très compliqué', 'Pas du tout compétitive'].includes(answer)) {
    return negativeMessages[randomIndex];
  }

  return null;
};

const getEngagementMessage = (step, totalSteps, responses, currentResponse) => {
  // Initial welcome message
  if (step === 0) {
    const hour = new Date().getHours();
    if (hour < 15) {
      return { message: "Bonjour ! Partagez votre expérience ☀️", icon: Sun };
    } else if (hour < 17) {
      return { message: "Une pause pour votre avis ? ☕", icon: Coffee };
    } else {
      return { message: "Bonsoir ! Un moment pour nous ? 🌟", icon: Star };
    }
  }

  if (currentResponse && [2, 4, 6, 8].includes(currentResponse.questionId)) {
    return getFeedbackMessage(currentResponse.questionId, currentResponse.answer);
  }

  return null;
};

export { ChatConversation, getEngagementMessage };