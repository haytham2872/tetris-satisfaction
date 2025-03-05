import React, { useEffect, useState } from 'react';
import { Trophy, Star, Clock, ThumbsUp, Gift, Coffee, Sun, Heart, AlertCircle, CheckCircle, Sparkles, MessageCircle, Edit, FileText } from 'lucide-react';
import pilotImage from '../assets/pilot.png';
import { fetchQuestions } from './constants/questions'; // Import fetchQuestions function

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

const ChatConversation = ({
  messages,
  currentStep,
  isNextClicked
}) => {
  const [currentMessage, setCurrentMessage] = useState(null);

  useEffect(() => {
    if (messages && messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      setCurrentMessage(latestMessage);
    }
  }, [messages, currentStep, isNextClicked]);

  return (
    <div className="fixed left-8 bottom-8 z-50">
      <div className="relative w-48">
        {currentMessage && currentMessage.message && !isNextClicked && (
          <SpeechBubble
            message={currentMessage.message}
            icon={currentMessage.icon}
          />
        )}
        <img
          src={pilotImage}
          alt="Pilot Mascot"
          className="w-full h-auto transform scale-105"
        />
      </div>
    </div>
  );
};

// Helper function to determine if an answer is positive or negative based on question type and response
const isPositiveResponse = (question, answer) => {
  console.log("Checking response positivity:", { question, answer });
  
  if (!question) return true;

  // Make sure we're using the correct property names based on the actual question object structure
  const questionType = question.type || question.question_type;
  const maxValue = question.max || question.max_value;
  
  if (questionType === 'rating' || questionType === 'stars') {
    const numericResponse = parseInt(answer, 10);
    const threshold = Math.floor(maxValue / 2);
    console.log(`Rating/Stars: value=${numericResponse}, threshold=${threshold}, isPositive=${numericResponse > threshold}`);
    return numericResponse > threshold;
  } 
  else if (questionType === 'choice') {
    let optionsArray = question.options;

    // Convert options to array if needed
    if (!Array.isArray(optionsArray)) {
      if (typeof optionsArray === 'string') {
        try {
          optionsArray = JSON.parse(optionsArray);
        } catch (error) {
          optionsArray = optionsArray.split(',');
        }
      } else {
        console.log("Options format unknown, defaulting to positive");
        return true; // Default to positive if options format is unknown
      }
    }

    // Determine the chosen index
    let chosenIndex;
    const responseAsNumber = parseInt(answer, 10);
    if (!isNaN(responseAsNumber)) {
      chosenIndex = responseAsNumber;
    } else {
      chosenIndex = optionsArray.indexOf(answer);
    }
    
    // If index not found, return positive by default
    if (chosenIndex < 0) {
      console.log(`Choice: option not found in array, defaulting to positive`);
      return true;
    }

    const threshold = Math.floor((optionsArray.length - 1) / 2);
    // Lower indices are more negative (matching useSurvey.js logic)
    const isPositive = chosenIndex <= threshold;
    console.log(`Choice: index=${chosenIndex}, threshold=${threshold}, isPositive=${isPositive}`);
    return isPositive;
  }
  
  // Default to positive for other question types
  console.log(`Default case: returning positive`);
  return true;
};

const getFeedbackMessage = (questionId, answer, currentStep, totalQuestions, questions) => {
  console.log(`getFeedbackMessage called with questionId: ${questionId}, answer: ${answer}, step: ${currentStep}, total: ${totalQuestions}`);
  
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
  
  const neutralMessages = [
    { message: "Merci pour votre commentaire ! 📝", icon: MessageCircle },
    { message: "Nous apprécions vos retours détaillés 💭", icon: Edit },
    { message: "Votre avis est précieux pour nous 📋", icon: FileText },
    { message: "Merci de partager votre expérience avec nous 💬", icon: MessageCircle },
    { message: "Chaque commentaire nous aide à progresser 📊", icon: FileText }
  ];
  
  const randomIndex = Math.floor(Math.random() * positiveMessages.length);
  const randomNeutralIndex = Math.floor(Math.random() * neutralMessages.length);
  
  // Check if we're near the end of the survey (3 questions remaining)
  const questionsRemaining = totalQuestions - currentStep;
  if (questionsRemaining === 3) {
    return { message: "Plus que quelques questions ! Vous y êtes presque ! 🎉", icon: CheckCircle };
  }
  
  // For the last two questions
  if (questionsRemaining <= 2) {
    return { message: "Merci infiniment pour votre temps et vos précieux retours ! ✨", icon: Sparkles };
  }
  
  // Only show feedback messages on every other question to avoid message fatigue
  if (currentStep % 2 === 1) {
    // Find the question object that corresponds to the questionId
    const question = questions.find(q => q.id === questionId);
    
    if (!question) return null;
    
    // For text questions, return a neutral message
    if (question.type === 'text') {
      return neutralMessages[randomNeutralIndex];
    }
    
    // Determine if the response is positive or negative for other question types
    const positive = isPositiveResponse(question, answer);
    console.log(`getFeedbackMessage: question=${question?.id}, answer=${answer}, isPositive=${positive}`);
    
    if (positive) {
      return positiveMessages[randomIndex];
    } else {
      return negativeMessages[randomIndex];
    }
  }
  
  return null;
};

const getEngagementMessage = (step, totalSteps, responses, currentResponse) => {
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
  return null;
};

// New wrapper function to fetch questions and get total count
const getQuestionCount = async (formId) => {
  try {
    // Vérifier que formId est défini
    if (!formId) {
      console.error("Error: formId is required to fetch questions");
      return {
        count: 0,
        questions: []
      };
    }
    
    const questions = await fetchQuestions(formId);
    
    // Si questions est undefined, renvoyer un tableau vide
    return {
      count: questions?.length || 0,
      questions: questions || []
    };
  } catch (error) {
    console.error("Error fetching question count:", error);
    return {
      count: 0,
      questions: []
    };
  }
};

export { ChatConversation, getEngagementMessage, getFeedbackMessage, getQuestionCount, isPositiveResponse };