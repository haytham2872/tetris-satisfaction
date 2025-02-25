import { useState, useEffect } from 'react';
import { getForms } from '../../API';

const useDashboardState = () => {
    // États existants
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showFeedbackAnalysis, setShowFeedbackAnalysis] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [analyticsView, setAnalyticsView] = useState('main');
    const [showComments, setShowComments] = useState(false);
    const [showContacts, setShowContacts] = useState(false);

    // Nouveaux états pour la gestion des formulaires
    const [selectedFormId, setSelectedFormId] = useState(null);
    const [availableForms, setAvailableForms] = useState([]);
    const [isLoadingForms, setIsLoadingForms] = useState(true);
    const [formError, setFormError] = useState(null);
    const [showComparatif, setShowComparatif] = useState(false);

    // Charger la liste des formulaires au montage
    useEffect(() => {
        const loadForms = async () => {
            try {
                setIsLoadingForms(true);
                setFormError(null);
                const forms = await getForms();
                setAvailableForms(forms);
                
                // Sélectionner automatiquement le premier formulaire si aucun n'est sélectionné
                if (!selectedFormId && forms.length > 0) {
                    setSelectedFormId(forms[0].id);
                }
            } catch (error) {
                console.error('Error loading forms:', error);
                setFormError('Erreur lors du chargement des formulaires');
            } finally {
                setIsLoadingForms(false);
            }
        };

        loadForms();
    }, []);

    // Fonction pour changer de formulaire
    const handleFormChange = (formId) => {
        setSelectedFormId(formId);
        // Réinitialiser les vues lors du changement de formulaire
        setAnalyticsView('main');
        setShowFeedbackAnalysis(false);
        setShowComments(false);
        setShowContacts(false);
        setShowEditForm(false);
    };

    // Fonction pour rafraîchir la liste des formulaires
    const refreshForms = async () => {
        try {
            setIsLoadingForms(true);
            setFormError(null);
            const forms = await getForms();
            setAvailableForms(forms);
        } catch (error) {
            console.error('Error refreshing forms:', error);
            setFormError('Erreur lors du rafraîchissement des formulaires');
        } finally {
            setIsLoadingForms(false);
        }
    };

    return {
        // États existants
        showAnalytics,
        showFeedbackAnalysis,
        showEditForm,
        analyticsView,
        showComments,
        showContacts,
        setShowAnalytics,
        setShowFeedbackAnalysis,
        setShowEditForm,
        setAnalyticsView,
        setShowComments,
        setShowContacts,

        // Nouveaux états et fonctions pour la gestion des formulaires
        selectedFormId,
        setSelectedFormId,
        availableForms,
        isLoadingForms,
        formError,
        handleFormChange,
        showComparatif,
        setShowComparatif,
        refreshForms
    };
};

export default useDashboardState;