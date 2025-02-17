import React, { useEffect, useState } from 'react';
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
  const [isNextClicked, setIsNextClicked] = useState(false);
  const [optionClicked, setOptionClicked] = useState(false);
  const [showContactScreen, setShowContactScreen] = useState(false);

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
  } = useSurvey();

  const { messageHistory } = useChat(
    currentStep,
    questions.length,
    responses,
    lastResponse,
    optionClicked
  );

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

  const {
    errors,
    validateContactForm,
    validateSurveyResponse,
    clearErrors,
    getError
  } = useFormValidation();

  if (showThankYou) {
    return <ThankYouScreen />;
  }

  if (showContactScreen) {
    return (
      <ContactDetails
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