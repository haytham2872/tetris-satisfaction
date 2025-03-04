import { useState, useEffect } from 'react';
import { getEngagementMessage, getFeedbackMessage, getQuestionCount } from '../MessageBubble';

export const useChat = (currentStep, totalSteps, responses, lastResponse, optionClicked, questions) => {
  const [messageHistory, setMessageHistory] = useState([]);
  const [questionsData, setQuestionsData] = useState({ count: 0, questions: [] });

  // Fetch questions data on mount
  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        // If we already have the questions array passed from ClientApp, use that
        if (questions && questions.length > 0) {
          setQuestionsData({ 
            count: questions.length, 
            questions: questions 
          });
        } else {
          // Otherwise fetch questions (fallback)
          const formId = window.location.pathname.split('/').pop();
          const data = await getQuestionCount(formId);
          setQuestionsData(data);
        }
      } catch (error) {
        console.error('Error fetching question data:', error);
      }
    };

    fetchQuestionData();
  }, [questions]);

  useEffect(() => {
    // Initial welcome message
    if (currentStep === 0) {
      const welcomeMessage = getEngagementMessage(0, totalSteps, responses, null);
      setMessageHistory(welcomeMessage ? [welcomeMessage] : [null]);
      return;
    }

    // Show feedback message when option is clicked
    if (optionClicked && lastResponse && questionsData.questions.length > 0) {
      const questionsRemaining = questionsData.count - currentStep;
      
      // Get the current question object
      const currentQuestion = questionsData.questions.find(q => q.id === lastResponse.questionId);
      
      const feedbackMessage = getFeedbackMessage(
        lastResponse.questionId,
        lastResponse.answer,
        currentStep,
        questionsData.count,
        questionsData.questions
      );
      
      if (feedbackMessage) {
        setMessageHistory([feedbackMessage]);
        return;
      }
    }

    // For non-feedback states, use null message instead of empty array
    // This keeps the ChatConversation component mounted
    if (!optionClicked) {
      setMessageHistory([null]);
    }
  }, [currentStep, totalSteps, responses, lastResponse, optionClicked, questionsData]);

  return { messageHistory };
};