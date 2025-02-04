import { useState, useEffect } from 'react';
import { getEngagementMessage, getFeedbackMessage } from '../MessageBubble';

export const useChat = (currentStep, totalSteps, responses, lastResponse, optionClicked) => {
  const [messageHistory, setMessageHistory] = useState([null]);

  useEffect(() => {
    // Initial welcome message
    if (currentStep === 0) {
      const welcomeMessage = getEngagementMessage(0, totalSteps, responses, null);
      setMessageHistory(welcomeMessage ? [welcomeMessage] : [null]);
      return;
    }

    // Show feedback message when option is clicked
    if (optionClicked && lastResponse) {
      // Check for feedback questions
      if ([2, 4, 6, 8].includes(lastResponse.questionId)) {
        const feedbackMessage = getFeedbackMessage(
          lastResponse.questionId,
          lastResponse.answer
        );
        if (feedbackMessage) {
          setMessageHistory([feedbackMessage]);
          return;
        }
      }
    }

    // Clear message for non-feedback states
    if (!optionClicked) {
      setMessageHistory([null]);
    }
  }, [currentStep, totalSteps, responses, lastResponse, optionClicked]);

  return { messageHistory };
};