import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './index.css';
import { useSurvey } from './components/hooks/useSurvey';
import { useChat } from './components/hooks/usechat';
import { useFormValidation } from './components/hooks/useFormValidation';
import { SURVEY_CONFIG } from './components/constants/config';

// Components
import Header from './components/Header';
import SurveyContainer from './components/survey/SurveyContainer';
import NavigationButtons from './components/survey/NavigationButtons';
import ThankYouScreen from './components/ThankYouScreen';
import ContactDetails from './components/ContactDetails';
import { ChatConversation } from './components/MessageBubble';
import VercelAnalytics from './components/VercelAnalytics';

function ClientApp() {
  const { formId } = useParams(); // Récupération de l'ID du formulaire depuis l'URL
  const [isNextClicked, setIsNextClicked] = useState(false);
  const [optionClicked, setOptionClicked] = useState(false);
  const [showContactScreen, setShowContactScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState(null);

  const {
    currentStep,
    setCurrentStep,
    responses,
    showThankYou,
    isAnimating,
    setIsAnimating,
    lastResponse,
    questionsLoading,
    contactVisibility,
    questions,
    handleResponse: surveyHandleResponse,
    handleOptionalAnswer,
    handleSubmit,
    handleContactSubmit,
    contactFormSkipped,
    setContactFormSkipped
  } = useSurvey(formId); // Passage du formId au hook useSurvey

  const { messageHistory } = useChat(
    currentStep,
    questions.length,
    responses,
    lastResponse,
    optionClicked
  );

  const {
    errors,
    validateContactForm,
    validateSurveyResponse,
    clearErrors,
    getError
  } = useFormValidation();

  // Vérification de l'existence du formulaire
  useEffect(() => {
    const validateForm = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/forms/${formId}`);
        if (!response.ok) {
          throw new Error('Formulaire non trouvé');
        }
        setIsLoading(false);
      } catch (error) {
        setFormError(error.message);
        setIsLoading(false);
      }
    };

    if (formId) {
      validateForm();
    }
  }, [formId]);

  useEffect(() => {
    setOptionClicked(false);
  }, [currentStep]);

  const handleResponse = (questionId, answer) => {
    setOptionClicked(true);
    surveyHandleResponse(questionId, answer);
  };

  const handleNextStep = () => {
    setIsNextClicked(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsNextClicked(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  const handlePreviousStep = () => {
    setIsNextClicked(false);
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, SURVEY_CONFIG.ANIMATION_DURATION);
    }
  };

  const handleSurveySubmit = () => {
    if (contactVisibility && !contactFormSkipped) {
      setShowContactScreen(true);
    } else {
      handleSubmit();
    }
  };

  const handleContactDetailsSubmit = async (contactData) => {
    await handleContactSubmit(contactData);
    setShowContactScreen(false);
  };

  const handleContactSkip = () => {
    setContactFormSkipped(true);
    setShowContactScreen(false);
    handleSubmit();
  };

  // Affichage des états de chargement et d'erreur
  if (isLoading) {
    return (
      <div className="min-h-screen bg-tetris-blue flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl">
          <p className="text-lg">Chargement du formulaire...</p>
        </div>
      </div>
    );
  }

  if (formError) {
    return (
      <div className="min-h-screen bg-tetris-blue flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl">
          <p className="text-lg text-red-600">{formError}</p>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    return <ThankYouScreen />;
  }

  if (showContactScreen) {
    return (
      <ContactDetails
        formId={formId}
        responses={responses}
        onSubmit={handleContactDetailsSubmit}
        onSkip={handleContactSkip}
        validateForm={validateContactForm}
        errors={errors}
        clearErrors={clearErrors}
      />
    );
  }

  return (
    <>
      <VercelAnalytics />
      <div className="min-h-screen bg-tetris-blue">
        {messageHistory.length > 0 && (
          <ChatConversation
            messages={messageHistory}
            currentStep={currentStep}
            isNextClicked={isNextClicked}
          />
        )}

        <Header
          currentStep={currentStep}
          totalSteps={questions.length}
        />

        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <SurveyContainer
              formId={formId}
              currentStep={currentStep}
              responses={responses}
              isAnimating={isAnimating || questionsLoading}
              onResponse={handleResponse}
              onOptionalAnswer={handleOptionalAnswer}
              validateResponse={validateSurveyResponse}
              getError={getError}
              questions={questions}
            />

            <NavigationButtons
              currentStep={currentStep}
              totalSteps={questions.length}
              onPrev={handlePreviousStep}
              onNext={handleNextStep}
              onSubmit={handleSurveySubmit}
            />
          </div>
        </main>
      </div>
    </>
  );
}

export default ClientApp;