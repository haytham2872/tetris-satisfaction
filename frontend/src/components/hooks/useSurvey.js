// hooks/useSurvey.js
import { useState, useEffect } from 'react';
import { startSurvey, submitResponses } from '../../API';
import { analyzeFeedback } from '../../services/nlpService';
import { SURVEY_CONFIG } from './../constants/config';
import { useQuestions } from './useQuestions';

export const useSurvey = () => {
  const [surveyId, setSurveyId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [showThankYou, setShowThankYou] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showContactButton, setShowContactButton] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [contactFormSkipped, setContactFormSkipped] = useState(false);
  const [contactDetailsSubmitted, setContactDetailsSubmitted] = useState(false);
  const { questions, loading: questionsLoading } = useQuestions();

  // Initialisation du questionnaire
  useEffect(() => {
    const initializeSurvey = async () => {
      try {
        const response = await startSurvey();
        if (response && response.id) {
          setSurveyId(response.id);
        } else {
          console.error('Unable to start new survey.');
        }
      } catch (error) {
        console.error('Error initializing survey:', error);
      }
    };
    initializeSurvey();
  }, []);

  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        optionalAnswer: prev[questionId]?.optionalAnswer || '',
        answer: value
      }
    }));
    setLastResponse({ questionId, answer: value });

    // Vérification des conditions pour afficher le formulaire de contact
    const shouldShowContact = () => {
      if (questionId === 1) {
        return parseInt(value) < 4;
      }

      const mostNegativeResponses = SURVEY_CONFIG.NEGATIVE_RESPONSES;
      const updatedResponses = {
        ...responses,
        [questionId]: { answer: value }
      };

      const firstResponse = updatedResponses[1]?.answer;
      if (firstResponse === undefined || parseInt(firstResponse) >= 4) {
        return false;
      }

      let answeredQuestions = 0;
      let negativeResponses = 0;

      for (let qId = 2; qId <= questionId; qId++) {
        const response = updatedResponses[qId]?.answer;
        if (response !== undefined) {
          answeredQuestions++;
          if (qId === 2) {
            if (parseInt(response) <= mostNegativeResponses[2]) {
              negativeResponses++;
            }
          } else if (response === mostNegativeResponses[qId]) {
            negativeResponses++;
          }
        }
      }

      return answeredQuestions > 0 && negativeResponses === answeredQuestions;
    };

    setShowContactButton(shouldShowContact());
  };

  const handleOptionalAnswer = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        answer: prev[questionId]?.answer || '',
        optionalAnswer: value
      }
    }));
  };

  const handleSubmit = async () => {
    if (!surveyId) {
      console.error('Missing Survey ID!');
      return;
    }

    // Si on est sur la dernière question et que le formulaire de contact
    // est requis (réponses négatives) mais que l'utilisateur n'a ni soumis ni ignoré ce formulaire,
    // on n'exécute pas encore la soumission finale
    if (currentStep === questions.length - 1 && showContactButton && !contactFormSkipped && !contactDetailsSubmitted) {
      return;
    }

    try {
      const success = await submitResponses(surveyId, responses);
      
      if (success) {
        if (responses[10]?.answer) {
          try {
            const analysis = await analyzeFeedback(responses[10].answer);
            const analysisResponse = await fetch('http://localhost:5000/api/feedback/analyze', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                survey_id: surveyId,
                analysis: analysis
              })
            });

            if (!analysisResponse.ok) {
              console.error('Failed to store analysis:', await analysisResponse.text());
            }
          } catch (error) {
            console.error('Error in feedback analysis:', error);
          }
        }
        
        setShowThankYou(true);
      } else {
        console.error('Failed to save responses.');
      }
    } catch (error) {
      console.error('Error submitting responses:', error);
    }
  };

  const handleNextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsAnimating(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  const handlePrevStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(0, prev - 1));
      setIsAnimating(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  const handleContactSubmit = async (contactData) => {
    try {
      const response = await fetch('http://localhost:5000/api/low-satisfaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: surveyId,
          ...contactData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit contact details');
      }

      const success = await submitResponses(surveyId, responses);
      
      if (success) {
        setContactDetailsSubmitted(true);
        setShowThankYou(true);
      } else {
        console.error('Failed to submit survey responses');
      }
    } catch (error) {
      console.error('Error submitting contact details:', error);
    }
  };

  return {
    surveyId,
    currentStep,
    responses,
    showThankYou,
    showContactForm,
    showContactButton,
    isAnimating,
    lastResponse,
    questionsLoading,
    questions,
    handleResponse,
    handleOptionalAnswer,
    handleSubmit,
    handleNextStep,
    handlePrevStep,
    handleContactSubmit,
    setShowContactForm,
    contactFormSkipped,
    setContactFormSkipped
  };
};
