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

  // New function to calculate negative weight for a response
  const getNegativeWeight = (question, response) => {
    if (question.question_type === 'rating' || question.question_type === 'stars') {
      const numericResponse = parseInt(response, 10);
      const threshold = Math.floor(question.max_value / 2);

      if (numericResponse > threshold) {
        console.log(
          `[getNegativeWeight] Question ${question.id}: ${numericResponse} > ${threshold} → Weight: 0`
        );
        return 0;
      } else {
        const weight = 1 - numericResponse / (threshold + 1);
        console.log(
          `[getNegativeWeight] Question ${question.id}: Response=${numericResponse}, Threshold=${threshold}, Weight=${weight}`
        );
        return weight;
      }
    } else if (question.question_type === 'choice') {
      if (!question.options) return 0;
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
          console.error(`[getNegativeWeight] Invalid options for question ${question.id}`);
          return 0;
        }
      }

      // Determine chosen index
      let chosenIndex;
      const responseAsNumber = parseInt(response, 10);
      if (!isNaN(responseAsNumber)) {
        chosenIndex = responseAsNumber;
      } else {
        chosenIndex = optionsArray.indexOf(response);
      }
      
      if (chosenIndex < 0) {
        console.log(`[getNegativeWeight] Question ${question.id}: Response not found in options`);
        return 0;
      }

      const threshold = Math.floor((optionsArray.length - 1) / 2);
      if (chosenIndex <= threshold) {
        console.log(
          `[getNegativeWeight] Question ${question.id}: Index ${chosenIndex} <= ${threshold} → Weight: 0`
        );
        return 0;
      } else {
        const denominator = optionsArray.length - threshold - 1;
        let weight = denominator <= 0 ? 1 : (chosenIndex - threshold) / denominator;
        console.log(
          `[getNegativeWeight] Question ${question.id}: Index=${chosenIndex}, Threshold=${threshold}, Weight=${weight}`
        );
        return weight;
      }
    }
    return 0;
  };

  // New function to calculate overall negative score
  const calculateNegativeScore = (responsesObject, questionsArray) => {
    let totalImportance = 0;
    let negativeImportance = 0;

    Object.keys(responsesObject).forEach(key => {
      const qId = parseInt(key, 10);
      const questionObj = questionsArray.find(q => q.id === qId);

      if (questionObj) {
        const importance = parseFloat(questionObj.importance) || 0;
        totalImportance += importance;

        const negativeWeight = getNegativeWeight(questionObj, responsesObject[qId].answer);
        negativeImportance += importance * negativeWeight;

        console.log(
          `[calculateNegativeScore] Q${qId}: importance=${importance}, weight=${negativeWeight}`
        );
      }
    });

    if (totalImportance === 0) {
      console.log('[calculateNegativeScore] Total importance is 0 → score = 0');
      return 0;
    }

    const score = negativeImportance / totalImportance;
    console.log(`[calculateNegativeScore] Final: negative=${negativeImportance}, total=${totalImportance}, score=${score}`);
    return score;
  };

  // Initialize survey
  useEffect(() => {
    const initializeSurvey = async () => {
      try {
        const response = await startSurvey();
        if (response && response.id) {
          setSurveyId(response.id);
          console.log('[initializeSurvey] Started new survey:', response.id);
        } else {
          console.error('[initializeSurvey] Failed to start survey');
        }
      } catch (error) {
        console.error('[initializeSurvey] Error:', error);
      }
    };
    initializeSurvey();
  }, []);

  // Updated handleResponse with negative score check
  const handleResponse = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        optionalAnswer: prev[questionId]?.optionalAnswer || '',
        answer: value
      }
    }));
    setLastResponse({ questionId, answer: value });

    // Check if contact form should be shown based on negative score
    const shouldShowContact = () => {
      const updatedResponses = {
        ...responses,
        [questionId]: { answer: value }
      };
      const negativeScore = calculateNegativeScore(updatedResponses, questions);
      const threshold = SURVEY_CONFIG.NEGATIVE_SCORE_THRESHOLD || 0.5;
      console.log(`[handleResponse] negativeScore=${negativeScore}, threshold=${threshold}`);
      return negativeScore >= threshold;
    };

    const showContact = shouldShowContact();
    console.log(`[handleResponse] Show contact form: ${showContact}`);
    setShowContactButton(showContact);
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

  // Updated handleSubmit with negative score
  const handleSubmit = async () => {
    if (!surveyId) {
      console.error('[handleSubmit] Missing Survey ID');
      return;
    }

    if (currentStep === questions.length - 1 && showContactButton && !contactFormSkipped && !contactDetailsSubmitted) {
      return;
    }

    try {
      // Calculate negative score before submission
      const negativeScore = calculateNegativeScore(responses, questions);
      console.log('[handleSubmit] Calculated negative score:', negativeScore);

      const success = await submitResponses(surveyId, responses, negativeScore);
      
      if (success) {
        if (responses[10]?.answer) {
          try {
            const analysis = await analyzeFeedback(responses[10].answer);
            const analysisResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/feedback/analyze`, {
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
              console.error('[handleSubmit] Failed to store analysis:', await analysisResponse.text());
            }
          } catch (error) {
            console.error('[handleSubmit] Feedback analysis error:', error);
          }
        }
        
        setShowThankYou(true);
      } else {
        console.error('[handleSubmit] Failed to save responses');
      }
    } catch (error) {
      console.error('[handleSubmit] Error:', error);
    }
  };

  // Rest of the existing functions remain the same
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/low-satisfaction`, {
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

      // Include negative score in final submission
      const negativeScore = calculateNegativeScore(responses, questions);
      const success = await submitResponses(surveyId, responses, negativeScore);
      
      if (success) {
        setContactDetailsSubmitted(true);
        setShowThankYou(true);
      } else {
        console.error('[handleContactSubmit] Failed to submit survey responses');
      }
    } catch (error) {
      console.error('[handleContactSubmit] Error:', error);
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