// App.js
import React, { useEffect, useState } from 'react';
import './index.css';
import { useSurvey } from './components/hooks/useSurvey';
import { useAnalytics } from './components/hooks/useAnalytics';
import { useChat } from './components/hooks/usechat';
import { useFormValidation } from './components/hooks/useFormValidation';
import EditFormPage from './components/EditFormPage';
import ContactDetailsView from './components/ContactDetailsView';

// Components
import Header from './components/Header';
import SurveyContainer from './components/survey/SurveyContainer';
import NavigationButtons from './components/survey/NavigationButtons';
import ThankYouScreen from './components/ThankYouScreen';
import ContactDetails from './components/ContactDetails';
import SatisfactionAnalytics from './components/SatisfactionAnalytics';
import AdditionalAnalytics from './components/AdditionalAnalytics';
import FeedbackAnalysisPage from './components/FeedbackAnalysisPage';
import { ChatConversation } from './components/MessageBubble';
import CommentsAnalysis from './components/CommentsAnalysis';
import VercelAnalytics from './components/VercelAnalytics';

function App() {
  const {
    responses,
    showThankYou,
    showContactForm,
    showContactButton,
    isAnimating,
    lastResponse,
    questionsLoading,
    questions,
    handleResponse: surveyHandleResponse, // Rename to avoid conflict
    handleOptionalAnswer,
    handleSubmit,
    handlePrevStep,
    handleContactSubmit,
    setShowContactForm,
    contactFormSkipped,
    setContactFormSkipped
  } = useSurvey();

  const [isNextClicked, setIsNextClicked] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const SURVEY_CONFIG = {
    ANIMATION_DURATION: 300
  };
  const handleResponse = (questionId, answer) => {
    setOptionClicked(true);
    surveyHandleResponse(questionId, answer);
  };

  const {
    showAnalytics,
    analyticsView,
    showFeedbackAnalysis,
    showComments,
    showEditForm,
    showContacts,
    setShowAnalytics,
    setAnalyticsView,
    setShowFeedbackAnalysis,
    setShowComments,
    setShowEditForm,
    setShowContacts,
    handleBackToSurvey,
    handleViewAdditional,
    handleShowFeedback,
    handleShowComments
  } = useAnalytics();

  const [optionClicked, setOptionClicked] = useState(false);

  const { messageHistory } = useChat(
    currentStep,
    questions.length,
    responses,
    lastResponse,
    optionClicked // New parameter
  );

  const handleNextStep = () => {
    setIsNextClicked(true);
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsNextClicked(false);
    }, SURVEY_CONFIG.ANIMATION_DURATION);
  };

  const {
    errors,
    validateContactForm,
    validateSurveyResponse,
    clearErrors,
    getError
  } = useFormValidation();

  // Affichage automatique du formulaire de contact sur la dernière question
  // si des réponses négatives ont été détectées et que l'utilisateur ne l'a pas
  // déjà masqué via "skip"
  useEffect(() => {
    if (currentStep === questions.length - 1 && showContactButton && !contactFormSkipped) {
      setShowContactForm(true);
    } else {
      setShowContactForm(false);
    }
  }, [currentStep, questions.length, showContactButton, contactFormSkipped, setShowContactForm]);

  useEffect(() => {
    setOptionClicked(false);
  }, [currentStep]);

  if (showThankYou) {
    return <ThankYouScreen />;
  }

  if (showAnalytics) {
    if (showFeedbackAnalysis) {
      return (
        <FeedbackAnalysisPage
          onBack={() => setShowFeedbackAnalysis(false)}
        />
      );
    }

    if (showComments) {
      return (
        <CommentsAnalysis
          onBack={() => setShowComments(false)}
          onShowAdditional={() => {
            setShowComments(false);
            setAnalyticsView('additional');
          }}
        />
      );
    }
    if (showContacts) {  // Add this block
      return (
        <ContactDetailsView
          onBack={() => setShowContacts(false)}
        />
      );
    }

    if (analyticsView === 'additional') {
      return (
        <AdditionalAnalytics
          onBack={() => setAnalyticsView('main')}
          onShowFeedback={() => setShowFeedbackAnalysis(true)}
          onShowContacts={() => setShowContacts(true)}
        />
      );
    }
    if (showEditForm) {
      return (
        <EditFormPage
          onBack={() => setShowEditForm(false)}
        />
      );
    }

    return (
      <SatisfactionAnalytics
        onBack={handleBackToSurvey}
        onShowAdditional={handleViewAdditional}
        onShowComments={handleShowComments}
        onShowFeedback={handleShowFeedback}
        onShowEditForm={() => setShowEditForm(true)}
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
              onResponse={handleResponse}  // Use the new handler that sets optionClicked
              onOptionalAnswer={handleOptionalAnswer}
              validateResponse={validateSurveyResponse}
              getError={getError}
              questions={questions}
            />
            {/* Affichage inline du formulaire de contact sous la dernière question 
                si des réponses négatives sont détectées */}
            {currentStep === questions.length - 1 && showContactButton && showContactForm && (
              <ContactDetails
                responses={responses}
                onSubmit={handleContactSubmit}
                onSkip={() => {
                  setShowContactForm(false);
                  setContactFormSkipped(true);
                  handleSubmit(); // on soumet les réponses du questionnaire après "skip"
                }}
                validateForm={validateContactForm}
                errors={errors}
                clearErrors={clearErrors}
              />
            )}

            <NavigationButtons
              currentStep={currentStep}
              totalSteps={questions.length}
              onPrev={handlePrevStep}
              onNext={handleNextStep}
              onSubmit={handleSubmit}
            />
          </div>
        </main>

        <button
          onClick={() => setShowAnalytics(true)}
          className="fixed bottom-6 right-6 bg-tetris-blue hover:bg-tetris-light text-white 
                     rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 transition-colors"
        >
          Statistiques
        </button>
      </div>
    </>
  );
}

export default App;
