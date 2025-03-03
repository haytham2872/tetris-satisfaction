import React, { useState, useEffect } from 'react';
import './index.css';
import useDashboardState from './components/hooks/useDashboardState';
import Page from './components/Page';
import DynamicSurveyAnalytics from './components/DynamicSurveyAnalytics';
import FeedbackAnalysisPage from './components/FeedbackAnalysisPage';
import EditFormPage from './components/EditFormPage';
import CommentsAnalysis from './components/CommentsAnalysis';
import ContactDetailsView from './components/ContactDetailsView';
import ComparatifForms from './components/ComparatifForms';
import { Settings } from 'lucide-react';

function AdminApp() {
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [availableForms, setAvailableForms] = useState([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');
  // État pour stocker les données de feedback
  const [feedbackData, setFeedbackData] = useState([]);
  // Nouvel état pour la modale d'édition
  const [showEditModal, setShowEditModal] = useState(false);

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
    showComparatif,
    setShowComparatif,
    setShowContacts
  } = useDashboardState();

  // Check if we're on the main dashboard
  const isMainDashboard = !showAnalytics && !showFeedbackAnalysis && 
    !showComments && !showEditForm && !showContacts && !showComparatif && analyticsView === 'main';

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/forms`);
        if (!response.ok) throw new Error('Erreur lors de la récupération des formulaires');
        const data = await response.json();
        setAvailableForms(data);
        if (data.length > 0 && !selectedFormId) {
          setSelectedFormId(data[0].id);
        }
        setIsLoadingForms(false);
      } catch (error) {
        console.error('Error fetching forms:', error);
        setIsLoadingForms(false);
      }
    };

    fetchForms();
  }, [selectedFormId]);

  // Effet pour récupérer les données de feedback quand le formulaire change
  useEffect(() => {
    if (selectedFormId) {
      fetchFeedbackData(selectedFormId);
    }
  }, [selectedFormId]);

  // Fonction pour récupérer les données de feedback
  const fetchFeedbackData = async (formId) => {
    try {
      const feedbackUrl = `${process.env.REACT_APP_API_URL}/api/feedback/analysis?form_id=${formId}`;
      const response = await fetch(feedbackUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch feedback data');
      }
      
      const data = await response.json();
      
      // Traiter les données de feedback pour s'assurer que l'analyse est correctement parsée
      const processedData = data.map(feedback => {
        if (typeof feedback.analysis === 'string') {
          try {
            feedback.analysis = JSON.parse(feedback.analysis);
          } catch (e) {
            console.error('Error parsing analysis:', e);
          }
        }
        return feedback;
      });
      
      setFeedbackData(processedData);
    } catch (error) {
      console.error('Error fetching feedback data:', error);
      setFeedbackData([]);
    }
  };

  // Gestion des données de feedback depuis FeedbackAnalysisPage
  const handleFeedbackDataLoaded = (data) => {
    setFeedbackData(data);
  };

  const createNewForm = async () => {
    try {
      console.log('Creating form with:', { name: newFormName, description: newFormDescription });
      console.log('API URL:', process.env.REACT_APP_API_URL);
      
      // Vérifier d'abord si le backend répond
      const healthCheck = await fetch(`${process.env.REACT_APP_API_URL}/health`);
      if (!healthCheck.ok) {
        throw new Error(`Health check failed with status: ${healthCheck.status}`);
      }
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/forms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFormName,
          description: newFormDescription
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(e => null);
        throw new Error(`Status: ${response.status}, Details: ${JSON.stringify(errorData)}`);
      }
  
      const newForm = await response.json();
      
      console.log('Form created successfully:', newForm);
      
      setAvailableForms(prevForms => [...prevForms, { 
        id: newForm.id, 
        name: newFormName, 
        description: newFormDescription 
      }]);
      setSelectedFormId(newForm.id);
      setIsCreatingForm(false);
      setNewFormName('');
      setNewFormDescription('');
    } catch (error) {
      console.error('Error creating form:', error);
      alert(`Impossible de créer le formulaire: ${error.message}`);
    }
  };

  const handleBackToDashboard = () => {
    setShowAnalytics(false);
    setShowFeedbackAnalysis(false);
    setShowComparatif(false);
    setShowEditForm(false);
    setShowComments(false);
    setShowContacts(false);
    setAnalyticsView('main');
  };

  const handleFormChange = (formId) => {
    setSelectedFormId(formId);
    handleBackToDashboard();
  };

  // Nouvelle fonction pour gérer la suppression d'un formulaire
  const handleFormDeleted = (deletedFormId) => {
    // Filtrer le formulaire supprimé de la liste
    const updatedForms = availableForms.filter(form => form.id !== deletedFormId);
    setAvailableForms(updatedForms);
    
    // Si le formulaire supprimé était sélectionné, sélectionner le premier formulaire disponible
    if (selectedFormId === deletedFormId) {
      if (updatedForms.length > 0) {
        setSelectedFormId(updatedForms[0].id);
      } else {
        setSelectedFormId(null);
      }
    }
    
    // Revenir au tableau de bord principal
    handleBackToDashboard();
  };

  if (isLoadingForms) {
    return (
      <div className="min-h-screen bg-tetris-blue flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-xl">
          <p className="text-lg">Chargement des formulaires...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-tetris-blue">
        {/* Only show form controls on main dashboard */}
        {isMainDashboard && (
          <div className="fixed top-4 right-4 z-50">
            <div className="flex items-center space-x-2">
              <select
                value={selectedFormId || ''}
                onChange={(e) => handleFormChange(Number(e.target.value))}
                className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg"
              >
                {availableForms.map(form => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
              
              {/* Bouton d'édition à côté du dropdown */}
              {selectedFormId && (
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg text-blue-600 hover:text-blue-800"
                  title="Modifier les détails"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              
              <button 
                onClick={() => setIsCreatingForm(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                + Nouveau
              </button>
            </div>
          </div>
        )}

        {/* Create form modal */}
        {isCreatingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
            <div className="bg-white rounded-lg shadow-xl w-[500px] p-6 animate-slideUp">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">Créer un nouveau formulaire</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom du formulaire</label>
                <input 
                  type="text"
                  placeholder="Saisissez le nom du formulaire"
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                <textarea 
                  placeholder="Saisissez une description"
                  value={newFormDescription}
                  onChange={(e) => setNewFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setIsCreatingForm(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={createNewForm}
                  disabled={!newFormName}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        <Page
          selectedFormId={selectedFormId}
          availableForms={availableForms}
          setShowAnalytics={setShowAnalytics}
          setShowComparatif={setShowComparatif}
          setShowFeedbackAnalysis={setShowFeedbackAnalysis}
          setShowEditForm={setShowEditForm}
          setAnalyticsView={setAnalyticsView}
          setShowComments={setShowComments}
          setShowContacts={setShowContacts}
          onBack={handleBackToDashboard}
          onFormDeleted={handleFormDeleted}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
        >
          {showAnalytics && analyticsView === 'main' && (
            <DynamicSurveyAnalytics
              formId={selectedFormId}
              onBack={handleBackToDashboard}
              onShowAdditional={() => setAnalyticsView('additional')}
              onShowComments={() => setShowComments(true)}
              onShowFeedback={() => setShowFeedbackAnalysis(true)}
              onShowEditForm={() => setShowEditForm(true)}
              externalFeedbackData={feedbackData}
            />
          )}
          {showFeedbackAnalysis && (
            <FeedbackAnalysisPage 
              formId={selectedFormId}
              onBack={handleBackToDashboard} 
              onFeedbackDataLoaded={handleFeedbackDataLoaded}
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
              externalFeedbackData={feedbackData}
            />
          )}
          {showComparatif && (
            <ComparatifForms 
              availableForms={availableForms}
              onBack={handleBackToDashboard}
            />
          )}
        </Page>
      </div>
    </>
  );
}
export default AdminApp;