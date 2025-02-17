import React from 'react';
import './index.css';
import useDashboardState from './components/hooks/useDashboardState';
import Page from './components/Page';
import DynamicSurveyAnalytics from './components/DynamicSurveyAnalytics';
import FeedbackAnalysisPage from './components/FeedbackAnalysisPage';
import EditFormPage from './components/EditFormPage';
import CommentsAnalysis from './components/CommentsAnalysis';
import ContactDetailsView from './components/ContactDetailsView';
import VercelAnalytics from './components/VercelAnalytics';

function AdminApp() {
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

  return (
    <>
      <VercelAnalytics />
      <div className="min-h-screen bg-tetris-blue">
        <Page
          setShowAnalytics={setShowAnalytics}
          setShowFeedbackAnalysis={setShowFeedbackAnalysis}
          setShowEditForm={setShowEditForm}
          setAnalyticsView={setAnalyticsView}
          setShowComments={setShowComments}
          setShowContacts={setShowContacts}
          onBack={handleBackToDashboard}
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
      </div>
    </>
  );
}

export default AdminApp;