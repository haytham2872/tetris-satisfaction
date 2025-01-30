// App.js
import React from 'react';
import './index.css';
import { useSurvey } from './components/hooks/useSurvey';
import { useAnalytics } from './components/hooks/useAnalytics';
import { useChat } from './components/hooks/usechat';
import { useFormValidation } from './components/hooks/useFormValidation';
import EditFormPage from './components/EditFormPage';

// Components
import Header from './components/Header';
import SurveyContainer from './components/survey/SurveyContainer';
import NavigationButtons from './components/survey/NavigationButtons';
import ThankYouScreen from './components/ThankYouScreen';
import ContactDetails from './components/ContactDetails';
import ContactButton from './components/ContactButton';
import SatisfactionAnalytics from './components/SatisfactionAnalytics';
import AdditionalAnalytics from './components/AdditionalAnalytics';
import FeedbackAnalysisPage from './components/FeedbackAnalysisPage';
import { ChatConversation } from './components/MessageBubble';
import CommentsAnalysis from './components/CommentsAnalysis';
import VercelAnalytics from './components/VercelAnalytics';

function App() {
  // Initialize hooks
  const {
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
    setShowContactForm
  } = useSurvey();

  const {
    showAnalytics,
    analyticsView,
    showFeedbackAnalysis,
    showComments,
    showEditForm,
    setShowAnalytics,
    setAnalyticsView,
    setShowFeedbackAnalysis,
    setShowComments,
    setShowEditForm,
    handleBackToSurvey,
    handleViewAdditional,
    handleShowFeedback,
    handleShowComments
  } = useAnalytics();

  const { messageHistory } = useChat(
    currentStep, 
    questions.length, 
    responses, 
    lastResponse
  );

  const {
    errors,
    validateContactForm,
    validateSurveyResponse,
    clearErrors,
    getError
  } = useFormValidation();

  // Render conditions
  if (showThankYou) {
    return <ThankYouScreen />;
  }

  if (showContactForm) {
    return (
      <ContactDetails
        responses={responses}
        onSubmit={handleContactSubmit}
        onSkip={() => setShowContactForm(false)}
        validateForm={validateContactForm}
        errors={errors}
        clearErrors={clearErrors}
      />
    );
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
    
    if (analyticsView === 'additional') {
      return (
        <AdditionalAnalytics
          onBack={() => setAnalyticsView('main')}
          onShowFeedback={() => setShowFeedbackAnalysis(true)}
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

  // Main survey view
  return (
    <>
      <VercelAnalytics />
      <div className="min-h-screen bg-tetris-blue">
        {messageHistory.length > 0 && (
          <ChatConversation messages={messageHistory} />
        )}
        
        {showContactButton && !showContactForm && (
          <ContactButton 
            onClick={() => setShowContactForm(true)}
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