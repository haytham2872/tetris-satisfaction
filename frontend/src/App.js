import React, { useEffect, useState } from 'react';
import { useChat } from './components/hooks/usechat';
import { useSurvey } from './components/hooks/useSurvey';
import { useFormValidation } from './components/hooks/useFormValidation';
import useDashboardState from './components/hooks/useDashboardState';
import { SURVEY_CONFIG } from './components/constants/config';

// Components
import Page from './components/Page';
import Header from './components/Header';
import ThankYouScreen from './components/ThankYouScreen';
import SurveyContainer from './components/survey/SurveyContainer';
import NavigationButtons from './components/survey/NavigationButtons';
import ContactDetails from './components/ContactDetails';
import DynamicSurveyAnalytics from './components/DynamicSurveyAnalytics';
import FeedbackAnalysisPage from './components/FeedbackAnalysisPage';
import { ChatConversation } from './components/MessageBubble';
import CommentsAnalysis from './components/CommentsAnalysis';
import ContactDetailsView from './components/ContactDetailsView';
import EditFormPage from './components/EditFormPage';
import VercelAnalytics from './components/VercelAnalytics';
import LoadingSpinner from './components/LoadingSpinner';

import './index.css';

function App() {
  // État de base
  const [isNextClicked, setIsNextClicked] = useState(false);
  const [optionClicked, setOptionClicked] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showContactScreen, setShowContactScreen] = useState(false);

  // État pour la gestion des formulaires multiples
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [availableForms, setAvailableForms] = useState([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);

  // Récupération de la liste des formulaires
  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/forms`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des formulaires');
        const data = await response.json();
        setAvailableForms(data);
        setIsLoadingForms(false);
      } catch (error) {
        console.error('Error fetching forms:', error);
        setIsLoadingForms(false);
      }
    };

    fetchForms();
  }, []);

  // Hooks personnalisés
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
  } = useSurvey(selectedFormId);

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

  const {
    errors,
    validateContactForm,
    validateSurveyResponse,
    clearErrors,
    getError
  } = useFormValidation();

  const { messageHistory } = useChat(
    currentStep,
    questions.length,
    responses,
    lastResponse,
    optionClicked
  );

  // Gestionnaires d'événements
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

  const handleFormChange = (formId) => {
    setSelectedFormId(formId);
    setCurrentStep(0);
    setShowDashboard(false);
  };

  // Conditions de rendu
  if (isLoadingForms) {
    return (
      <div className="min-h-screen bg-tetris-blue flex items-center justify-center">
        <LoadingSpinner message="Chargement des formulaires..." />
      </div>
    );
  }

  if (!selectedFormId && availableForms.length > 0) {
    return (
      <div className="min-h-screen bg-tetris-blue flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Sélectionnez un formulaire</h2>
          <div className="space-y-4">
            {availableForms.map(form => (
              <button
                key={form.id}
                onClick={() => handleFormChange(form.id)}
                className="w-full px-6 py-4 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <p className="font-medium text-gray-800">{form.name}</p>
                {form.description && (
                  <p className="text-sm text-gray-600 mt-1">{form.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (showThankYou) {
    return <ThankYouScreen onNewSurvey={() => setSelectedFormId(null)} />;
  }

  if (showContactScreen) {
    return (
      <ContactDetails
        formId={selectedFormId}
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
        formId={selectedFormId}
        setShowAnalytics={setShowAnalytics}
        setShowFeedbackAnalysis={setShowFeedbackAnalysis}
        setShowEditForm={setShowEditForm}
        setAnalyticsView={setAnalyticsView}
        setShowComments={setShowComments}
        setShowContacts={setShowContacts}
        onBack={handleBackToDashboard}
        setShowDashboard={setShowDashboard}
        availableForms={availableForms}
        onFormChange={handleFormChange}
      >
        {showAnalytics && analyticsView === 'main' && (
          <DynamicSurveyAnalytics
            formId={selectedFormId}
            onBack={handleBackToDashboard}
            onShowAdditional={handleViewAdditional}
            onShowComments={handleShowComments}
            onShowFeedback={handleShowFeedback}
            onShowEditForm={() => setShowEditForm(true)}
          />
        )}
        {showFeedbackAnalysis && (
          <FeedbackAnalysisPage 
            formId={selectedFormId}
            onBack={handleBackToDashboard} 
          />
        )}
        {showEditForm && (
          <EditFormPage 
            formId={selectedFormId}
            onBack={handleBackToDashboard} 
          />
        )}
        {showComments && (
          <CommentsAnalysis
            formId={selectedFormId}
            onBack={handleBackToDashboard}
            onShowAdditional={() => {
              setShowComments(false);
              setAnalyticsView('additional');
            }}
          />
        )}
        {showContacts && (
          <ContactDetailsView 
            formId={selectedFormId}
            onBack={handleBackToDashboard} 
          />
        )}
        {analyticsView === 'additional' && (
          <DynamicSurveyAnalytics
            formId={selectedFormId}
            onBack={() => setAnalyticsView('main')}
            onShowFeedback={() => setShowFeedbackAnalysis(true)}
            onShowContacts={() => setShowContacts(true)}
            isAdditionalView={true}
          />
        )}
      </Page>
    );
  }

  // Rendu principal de l'application
  return (
    <>
      <VercelAnalytics />
      <div className="min-h-screen bg-tetris-blue">
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setSelectedFormId(null)}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
          >
            Changer de formulaire
          </button>
        </div>

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
          formName={availableForms.find(f => f.id === selectedFormId)?.name}
        />

        <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <SurveyContainer
              formId={selectedFormId}
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