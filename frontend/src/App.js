import React, { useEffect, useState } from 'react';
import './index.css';
import { useSurvey } from './components/hooks/useSurvey';
import { useChat } from './components/hooks/usechat';
import { useFormValidation } from './components/hooks/useFormValidation';
import EditFormPage from './components/EditFormPage';
import ContactDetailsView from './components/ContactDetailsView';
import Page from './components/Page';
import useDashboardState from './components/hooks/useDashboardState';
import { SURVEY_CONFIG } from './components/constants/config';

// Components
import Header from './components/Header';
import SurveyContainer from './components/survey/SurveyContainer';
import NavigationButtons from './components/survey/NavigationButtons';
import ThankYouScreen from './components/ThankYouScreen';
import ContactDetails from './components/ContactDetails';
import DynamicSurveyAnalytics from './components/DynamicSurveyAnalytics';
import FeedbackAnalysisPage from './components/FeedbackAnalysisPage';
import { ChatConversation } from './components/MessageBubble';
import CommentsAnalysis from './components/CommentsAnalysis';
import VercelAnalytics from './components/VercelAnalytics';

function App() {
  const [isNextClicked, setIsNextClicked] = useState(false);
  const [optionClicked, setOptionClicked] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
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
    setShowContacts
  } = useDashboardState();

  const handleBackToDashboard = () => {
    setShowAnalytics(false);
    setShowFeedbackAnalysis(false);
    setShowEditForm(false);
    setShowComments(false);
    setShowContacts(false);
    setAnalyticsView('main');
    setShowDashboard(true);
  };

  const handleViewAdditional = () => {
    setAnalyticsView('additional');
  };

  const handleShowFeedback = () => {
    setShowFeedbackAnalysis(true);
  };

  const handleShowComments = () => {
    setShowComments(true);
  };

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

  // New handler for the submit button
  const handleSurveySubmit = () => {
    if (contactVisibility && !contactFormSkipped) {
      setShowContactScreen(true);
    } else {
      handleSubmit();
    }
  };

  // New handler for contact form submission
  const handleContactDetailsSubmit = async (contactData) => {
    await handleContactSubmit(contactData);
    setShowContactScreen(false);
  };

  // New handler for contact form skip
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

  if (showDashboard) {
    return (
      <Page
        setShowAnalytics={setShowAnalytics}
        setShowFeedbackAnalysis={setShowFeedbackAnalysis}
        setShowEditForm={setShowEditForm}
        setAnalyticsView={setAnalyticsView}
        setShowComments={setShowComments}
        setShowContacts={setShowContacts}
        onBack={handleBackToDashboard}
        setShowDashboard={setShowDashboard}
      >
        {showAnalytics && analyticsView === 'main' && (
          <DynamicSurveyAnalytics
            onBack={handleBackToDashboard}
            onShowAdditional={handleViewAdditional}
            onShowComments={handleShowComments}
            onShowFeedback={handleShowFeedback}
            onShowEditForm={() => setShowEditForm(true)}
          />
        )}
        {showFeedbackAnalysis && <FeedbackAnalysisPage onBack={handleBackToDashboard} />}
        {showEditForm && <EditFormPage onBack={handleBackToDashboard} />}
        {showComments && (
          <CommentsAnalysis
            onBack={handleBackToDashboard}
            onShowAdditional={() => {
              setShowComments(false);
              setAnalyticsView('additional');
            }}
          />
        )}
        {showContacts && <ContactDetailsView onBack={handleBackToDashboard} />}
        {analyticsView === 'additional' && (
          <DynamicSurveyAnalytics
            onBack={() => setAnalyticsView('main')}
            onShowFeedback={() => setShowFeedbackAnalysis(true)}
            onShowContacts={() => setShowContacts(true)}
          />
        )}
      </Page>
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

        <button
          onClick={() => {
            setShowDashboard(true);
            setShowAnalytics(true);
          }}
          className="fixed bottom-6 right-6 bg-tetris-blue hover:bg-tetris-light text-white rounded-lg px-4 py-2 shadow-lg flex items-center gap-2 transition-colors"
        >
          Statistiques
        </button>
      </div>
    </>
  );
}

export default App;