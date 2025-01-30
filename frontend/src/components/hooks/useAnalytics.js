// hooks/useAnalytics.js
import { useState } from 'react';

export const useAnalytics = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsView, setAnalyticsView] = useState('main');
  const [showFeedbackAnalysis, setShowFeedbackAnalysis] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);


  const handleBackToSurvey = () => {
    setShowAnalytics(false);
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

  return {
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

  };
};