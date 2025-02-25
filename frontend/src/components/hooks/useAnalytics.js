// hooks/useAnalytics.js
import { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;
export const useAnalytics = (formId) => {
  // États existants
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [analyticsView, setAnalyticsView] = useState('main');
  const [showFeedbackAnalysis, setShowFeedbackAnalysis] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  // Nouveaux états pour les données d'analytics
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les données d'analytics pour le formulaire sélectionné
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!formId) return;

      setIsLoading(true);
      setError(null);

      try {
        // Récupérer les réponses pour ce formulaire
        const responseData = await fetch(`${API_URL}/api/analytics/responses?form_id=${formId}`);
        const responses = await responseData.json();

        // Récupérer les statistiques de sentiment pour ce formulaire
        const sentimentData = await fetch(`${API_URL}/api/feedback/sentiment-summary?form_id=${formId}`);
        const sentiment = await sentimentData.json();

        // Récupérer les commentaires pour ce formulaire
        const commentsData = await fetch(`${API_URL}/api/comments?form_id=${formId}`);
        const comments = await commentsData.json();

        setAnalyticsData({
          responses,
          sentiment,
          comments
        });
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Erreur lors du chargement des analyses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [formId]);

  // Handlers existants
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

  // Nouvelle fonction pour rafraîchir les données
  const refreshAnalytics = () => {
    setIsLoading(true);
    fetchAnalytics();
  };

  // Nouvelle fonction pour obtenir des données spécifiques
  const getAnalyticsForPeriod = async (startDate, endDate) => {
    if (!formId) return null;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${API_URL}/api/analytics/period?form_id=${formId}&start_date=${startDate}&end_date=${endDate}`
      );
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching period analytics:', err);
      setError('Erreur lors du chargement des analyses par période');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // États existants
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

    // Handlers existants
    handleBackToSurvey,
    handleViewAdditional,
    handleShowFeedback,
    handleShowComments,

    // Nouvelles données et fonctionnalités
    analyticsData,
    isLoading,
    error,
    refreshAnalytics,
    getAnalyticsForPeriod
  };
};