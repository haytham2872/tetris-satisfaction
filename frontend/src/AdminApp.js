import React, { useState, useEffect } from 'react';
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
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [availableForms, setAvailableForms] = useState([]);
  const [isLoadingForms, setIsLoadingForms] = useState(true);
  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [newFormName, setNewFormName] = useState('');
  const [newFormDescription, setNewFormDescription] = useState('');

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

  // Check if we're on the main dashboard
  const isMainDashboard = !showAnalytics && !showFeedbackAnalysis && 
    !showComments && !showEditForm && !showContacts && analyticsView === 'main';

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
  }, []);

  const createNewForm = async () => {
    try {
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

      if (!response.ok) throw new Error('Erreur lors de la création du formulaire');

      const newForm = await response.json();
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
      console.error('Erreur:', error);
      alert('Impossible de créer le formulaire. Veuillez réessayer.');
    }
  };

  const handleBackToDashboard = () => {
    setShowAnalytics(false);
    setShowFeedbackAnalysis(false);
    setShowEditForm(false);
    setShowComments(false);
    setShowContacts(false);
    setAnalyticsView('main');
  };

  const handleFormChange = (formId) => {
    setSelectedFormId(formId);
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
      <VercelAnalytics />
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
          setShowFeedbackAnalysis={setShowFeedbackAnalysis}
          setShowEditForm={setShowEditForm}
          setAnalyticsView={setAnalyticsView}
          setShowComments={setShowComments}
          setShowContacts={setShowContacts}
          onBack={handleBackToDashboard}
        >
          {showAnalytics && analyticsView === 'main' && (
            <DynamicSurveyAnalytics
              formId={selectedFormId}
              onBack={handleBackToDashboard}
              onShowAdditional={() => setAnalyticsView('additional')}
              onShowComments={() => setShowComments(true)}
              onShowFeedback={() => setShowFeedbackAnalysis(true)}
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
      </div>
    </>
  );
}

export default AdminApp;