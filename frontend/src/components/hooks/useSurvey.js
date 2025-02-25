// hooks/useSurvey.js
import { useState, useEffect } from 'react';
import { startSurvey, submitResponses } from '../../API';
import { analyzeFeedback } from '../../services/nlpService';
import { SURVEY_CONFIG } from './../constants/config';
import { useQuestions } from './useQuestions';

const API_URL = process.env.REACT_APP_API_URL;
export const useSurvey = (formId) => {
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
  const [contactVisibility, setContactVisibility] = useState(false);


  const { questions, loading: questionsLoading } = useQuestions(formId);

  const getNegativeWeight = (question, response) => {
    if (question.question_type === 'rating' || question.question_type === 'stars') {
      const numericResponse = parseInt(response, 10);
      const threshold = Math.floor(question.max_value / 2);

      if (numericResponse > threshold) {
        console.log(
          `[getNegativeWeight] [Question ${question.id} - ${question.question_type}] Réponse: ${numericResponse} > seuil (${threshold}) → Poids négatif: 0`
        );
        return 0;
      } else {
        const weight = 1 - numericResponse / (threshold + 1);
        console.log(
          `[getNegativeWeight] [Question ${question.id} - ${question.question_type}] Réponse: ${numericResponse}, Seuil: ${threshold}, Poids négatif=${weight}`
        );
        return weight;
      }
    } else if (question.question_type === 'choice') {
      if (!question.options) return 0;
      let optionsArray = question.options;

      // Conversion éventuelle du champ options en tableau
      if (!Array.isArray(optionsArray)) {
        if (typeof optionsArray === 'string') {
          try {
            optionsArray = JSON.parse(optionsArray);
          } catch (error) {
            optionsArray = optionsArray.split(',');
          }
        } else {
          console.error(`[getNegativeWeight] Les options pour la question ${question.id} ne sont ni un tableau ni une chaîne.`);
          return 0;
        }
      }

      // On détermine l'indice choisi
      let chosenIndex;
      const responseAsNumber = parseInt(response, 10);
      if (!isNaN(responseAsNumber)) {
        chosenIndex = responseAsNumber;
      } else {
        chosenIndex = optionsArray.indexOf(response);
      }
      if (chosenIndex < 0) {
        console.log(`[getNegativeWeight] [Question ${question.id} - choice] Réponse non trouvée dans les options.`);
        return 0;
      }

      const threshold = Math.floor((optionsArray.length - 1) / 2);
      if (chosenIndex <= threshold) {
        console.log(
          `[getNegativeWeight] [Question ${question.id} - choice] Réponse: ${response} (Index: ${chosenIndex}) <= seuil (${threshold}) → Poids négatif: 0`
        );
        return 0;
      } else {
        const denominator = optionsArray.length - threshold - 1;
        let weight = denominator <= 0 ? 1 : (chosenIndex - threshold) / denominator;
        console.log(
          `[getNegativeWeight] [Question ${question.id} - choice] Réponse: ${response} (Index: ${chosenIndex}), Seuil: ${threshold}, Poids négatif=${weight}`
        );
        return weight;
      }
    }
    return 0;
  };

  // Calcule le score négatif global
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
          `[calculateNegativeScore] QID=${qId}, importance=${importance}, weight=${negativeWeight}`
        );
      }
    });

    if (totalImportance === 0) {
      console.log('[calculateNegativeScore] totalImportance = 0 → score négatif = 0');
      return 0;
    }

    const score = negativeImportance / totalImportance;
    console.log(`[calculateNegativeScore] negativeImportance=${negativeImportance}, totalImportance=${totalImportance}, scoreFinal=${score}`);
    return score;
  };

  // Lance un nouveau survey
  useEffect(() => {
    // Add flag to prevent double initialization
    let isSubscribed = true;

    const initializeSurvey = async () => {
      if (surveyId || !formId) return;
    
      try {
        console.log('[useEffect] startSurvey with formId:', formId);
        const response = await startSurvey(formId);
        if (response && response.id && isSubscribed) {
          setSurveyId(response.id);
          console.log('[useEffect] Nouveau survey démarré. ID:', response.id);
        } else if (isSubscribed) {
          console.error('[useEffect] Unable to start new survey: pas de response.id');
        }
      } catch (error) {
        if (isSubscribed) {
          console.error('[useEffect] Error initializing survey:', error);
        }
      }
    };

    initializeSurvey();
    return () => {
      isSubscribed = false;
    };
  }, [formId]); 

  // handleResponse : l'utilisateur répond à une question
  const handleResponse = (questionId, value) => {
    console.log(`[handleResponse] QID=${questionId}, value="${value}"`);

    // On stocke la réponse
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        optionalAnswer: prev[questionId]?.optionalAnswer || '',
        answer: value
      }
    }));
    setLastResponse({ questionId, answer: value });

    // Vérification si on affiche le bouton de contact
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

    const contactVisibility = shouldShowContact();
    console.log(`[handleResponse] Le formulaire de contact doit être affiché=${contactVisibility}`);
    setShowContactButton(contactVisibility);
    setContactVisibility(contactVisibility);
  };

  const handleOptionalAnswer = (questionId, value) => {
    console.log(`[handleOptionalAnswer] QID=${questionId}, optionalValue="${value}"`);

    setResponses(prev => ({
      ...prev,
      [questionId]: {
        answer: prev[questionId]?.answer || '',
        optionalAnswer: value
      }
    }));
  };

  // Soumission finale
  const handleSubmit = async () => {
    console.log('[handleSubmit] Début de la soumission...');
    if (!surveyId) {
      console.error('[handleSubmit] Impossible de soumettre: surveyId manquant');
      return;
    }
  
    if (currentStep === questions.length - 1 && showContactButton && !contactFormSkipped) {
      console.log('[handleSubmit] Le formulaire de contact n\'est pas rempli, mais la soumission est autorisée.');
    }
  
    try {
      const negativeScore = calculateNegativeScore(responses, questions);
      console.log('[handleSubmit] negativeScore calculé:', negativeScore);
  
      const success = await submitResponses(surveyId, responses, negativeScore, formId);
  
      console.log('[handleSubmit] submitResponses success=', success);
      if (success) {
        // Find all text-type questions and their responses
        const textResponses = questions
          .filter(q => q.question_type === 'text')  // Changed from q.type to q.question_type
          .map(q => ({
            questionId: q.id,
            answer: responses[q.id]?.answer
          }))
          .filter(r => r.answer && r.answer.trim() !== '');
        // Analyze each text response
  
      if (textResponses.length > 0) {
        console.log('[handleSubmit] Found text responses to analyze:', textResponses);
        
        try {
          const analyses = await Promise.all(
            textResponses.map(async (response) => {
              console.log(`[handleSubmit] Analyzing response for question ${response.questionId}:`, response.answer);
              const analysis = await analyzeFeedback(response.answer);
              return {
                questionId: response.questionId,
                analysis: analysis
              };
            })
          );

          console.log('[handleSubmit] All analyses completed:', analyses);
          
          // Update the request body structure to match your backend expectation
          const analysisResponse = await fetch(`${API_URL}/api/feedback/analyze`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              form_id: formId,
              survey_id: surveyId,
              analyses: analyses.map(item => ({
                questionId: item.questionId,
                analysis: item.analysis
              }))
            })
          });

          if (!analysisResponse.ok) {
            const errMsg = await analysisResponse.text();
            console.error('[handleSubmit] Failed to store analyses. Status:', analysisResponse.status, 'Error:', errMsg);
            throw new Error(`Failed to store analyses: ${errMsg}`);
          }

          const responseData = await analysisResponse.json();
          console.log('[handleSubmit] NLP analyses stored successfully:', responseData);

        } catch (error) {
          console.error('[handleSubmit] Error in feedback analysis:', error);
          // Continue with submission even if analysis fails
        }
      } else {
        console.log('[handleSubmit] No text responses found to analyze');
      }

      // Also check for optional answers that need analysis
      Object.entries(responses).forEach(async ([questionId, response]) => {
        if (response.optionalAnswer && response.optionalAnswer.trim() !== '') {
          try {
            console.log(`[handleSubmit] Analyzing optional answer for question ${questionId}`);
            const analysis = await analyzeFeedback(response.optionalAnswer);
            
            const analysisResponse = await fetch(`${API_URL}/api/feedback/analyze`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                form_id: formId,
                survey_id: surveyId,
                analyses: [{
                  questionId: parseInt(questionId),
                  analysis: analysis
                }]
              })
            });

            if (!analysisResponse.ok) {
              throw new Error('Failed to store optional answer analysis');
            }
            
            console.log(`[handleSubmit] Optional answer analysis stored for question ${questionId}`);
          } catch (error) {
            console.error(`[handleSubmit] Error analyzing optional answer for question ${questionId}:`, error);
          }
        }
      });
        
        setShowThankYou(true);
        console.log('[handleSubmit] -> On affiche le Thank You');
      } else {
        console.error('[handleSubmit] Erreur de soumission (returned false).');
      }
    } catch (error) {
      console.error('[handleSubmit] Exception:', error);
    }
  };
  

  const handleNextStep = () => {
    console.log('[handleNextStep] Passage au step suivant...');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsAnimating(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  const handlePrevStep = () => {
    console.log('[handlePrevStep] Retour au step précédent...');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentStep(prev => Math.max(0, prev - 1));
      setIsAnimating(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  // Soumission du formulaire de contact
  const handleContactSubmit = async (contactData) => {
    console.log('[handleContactSubmit] contactData=', contactData);
    try {
        const response = await fetch(`${API_URL}/api/low-satisfaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: surveyId,
                form_id: formId,
                survey_id: surveyId,
                name: contactData.name,
                phone: contactData.phone,
                email: contactData.email,
                commentaire: contactData.commentaire || null
            })
        });

        if (!response.ok) {
            throw new Error('[handleContactSubmit] Echec POST /api/low-satisfaction');
        }
        console.log('[handleContactSubmit] Contact enregistré. On re-soumet le questionnaire...');

        const success = await submitResponses(surveyId, responses, null, formId);
        console.log('[handleContactSubmit] Contact + responses success?', success);

        if (success) {
            setContactDetailsSubmitted(true);
            setShowThankYou(true);
        } else {
            console.error('[handleContactSubmit] Echec de la soumission des réponses.');
        }
    } catch (error) {
        console.error('[handleContactSubmit] Erreur de soumission contact:', error);
    }
};

  return {
    surveyId,
    currentStep,
    setCurrentStep,
    responses,
    showThankYou,
    showContactForm,
    showContactButton,
    isAnimating,
    setIsAnimating,  // Add this
    lastResponse,
    contactVisibility,
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
