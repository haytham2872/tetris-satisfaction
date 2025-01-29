// hooks/useChat.js
import { useState, useEffect } from 'react';
import { getEngagementMessage } from '../MessageBubble';

export const useChat = (currentStep, totalSteps, responses, lastResponse) => {
  const [messageHistory, setMessageHistory] = useState([]);

  useEffect(() => {
    const messageData = getEngagementMessage(
      currentStep, 
      totalSteps, 
      responses,
      lastResponse
    );
    
    if (messageData) {
      setMessageHistory(prev => [...prev, messageData]);
      
      setTimeout(() => {
        const chatContainer = document.querySelector('.chat-container');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    }
  }, [currentStep, responses, lastResponse, totalSteps]);

  return {
    messageHistory
  };
};