import React, { useState, useEffect } from 'react';
import {
    BarChart2,
    MessageSquare,
    Edit,
    MessageCircle,
    Users,
    ArrowLeft,
    Loader,
    Trash2
} from 'lucide-react';
import logo from '../assets/logo.png'; // Import the logo

// Constante pour l'URL de l'API
const API_URL = process.env.REACT_APP_API_URL;

const MenuButton = ({ icon: Icon, title, description, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`bg-white p-8 rounded-2xl shadow-lg border hover:border-tetris-blue hover:scale-105 
        transition-all duration-300 w-full text-left transform 
        ${isActive ? 'border-tetris-blue ring-2 ring-tetris-blue/20' : 'border-gray-100'}`}
    >
        <div className="flex items-start gap-6">
            <div className={`p-4 rounded-xl ${isActive ? 'bg-tetris-blue' : 'bg-blue-50'}`}>
                <Icon className={`w-8 h-8 ${isActive ? 'text-white' : 'text-tetris-blue'}`} />
            </div>
            <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-base text-gray-600">{description}</p>
            </div>
        </div>
    </button>
);

const Page = ({
    selectedFormId, // Accept selectedFormId from AdminApp.js
    availableForms: propAvailableForms = [], // Accept availableForms from AdminApp.js
    setShowAnalytics,
    setShowFeedbackAnalysis,
    setShowEditForm,
    setAnalyticsView,
    setShowComments,
    setShowContacts,
    setShowComparatif,
    onBack,
    setShowDashboard,
    onFormDeleted, // Ajout de la prop onFormDeleted
    showEditModal, // Nouveau prop pour contrôler la visibilité de la modale depuis AdminApp
    setShowEditModal, // Nouveau prop pour modifier l'état de la modale
    children,
}) => {
    const [activeView, setActiveView] = useState(null);
    const [formInfo, setFormInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableForms] = useState(propAvailableForms || []);

    // État pour les modales - on garde showDeleteModal local mais pas showEditModal qui vient des props
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editFormName, setEditFormName] = useState('');
    const [editFormDescription, setEditFormDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Find the current form name from availableForms when possible
    const getCurrentFormName = () => {
        if (!selectedFormId || !availableForms || availableForms.length === 0) return null;

        const currentForm = availableForms.find(form => form.id.toString() === selectedFormId.toString());
        return currentForm ? currentForm.name : null;
    };

    // Fetch form information when selectedFormId changes
    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates after unmount

        const fetchFormInfo = async () => {
            if (!isMounted) return;

            // Try to get form info from availableForms first to reduce API calls
            const existingFormInfo = availableForms.find(form => form.id.toString() === selectedFormId?.toString());
            if (existingFormInfo) {
                console.log('Using cached form info:', existingFormInfo);
                setFormInfo(existingFormInfo);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                if (!selectedFormId) {
                    console.warn('selectedFormId is missing - skipping API call');
                    setError('Form ID not available');
                    setLoading(false);
                    return;
                }

                console.log('Fetching form with ID:', selectedFormId);

                const response = await fetch(`${API_URL || 'http://localhost:5000'}/api/forms/${selectedFormId}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch form information. Status: ${response.status}`);
                }

                const data = await response.json();
                console.log('Form Info received:', data);

                if (!isMounted) return;

                if (data && typeof data === 'object') {
                    // Using setTimeout to match behavior with ComparatifForms.js
                    setTimeout(() => {
                        if (isMounted) {
                            setFormInfo(data);
                            setLoading(false);
                        }
                    }, 300);
                } else {
                    setError('Invalid data format received');
                    console.error('Invalid data format:', data);
                    setLoading(false);
                }
            } catch (error) {
                if (!isMounted) return;
                console.error('Error fetching form information:', error);
                setError(error.message);
                setLoading(false);
            }
        };

        // Using the same pattern of timer as in ComparatifForms
        let timer;
        if (selectedFormId) {
            timer = setTimeout(() => {
                fetchFormInfo();
            }, 300);
        } else {
            setLoading(false);
        }

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [selectedFormId, availableForms]);

    // Debug formInfo state changes
    useEffect(() => {
        console.log('Current formInfo state:', formInfo);
    }, [formInfo]);

    // Initialiser les valeurs d'édition avec les données du formulaire actuel
    useEffect(() => {
        if (formInfo) {
            setEditFormName(formInfo.name || '');
            setEditFormDescription(formInfo.description || '');
        }
    }, [formInfo]);

    // Initialiser les champs lors de l'ouverture de la modale
    useEffect(() => {
        if (showEditModal && formInfo) {
            setEditFormName(formInfo.name || '');
            setEditFormDescription(formInfo.description || '');
        }
    }, [showEditModal, formInfo]);

    // Improved form name display - checks multiple sources
    const getFormName = () => {
        // First try to get from formInfo
        if (formInfo?.name) {
            return formInfo.name;
        }

        // Then try from availableForms
        const formName = getCurrentFormName();
        if (formName) {
            return formName;
        }

        // Fallback
        return 'Formulaire sans nom';
    };

    // Fonction pour supprimer un formulaire
    const handleDeleteForm = async () => {
        if (!selectedFormId) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL || 'http://localhost:5000'}/api/forms/${selectedFormId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Échec de la suppression. Statut: ${response.status}`);
            }

            // Fermer la modale et rediriger vers la liste des formulaires
            setShowDeleteModal(false);

            // Informer l'application parente qu'un formulaire a été supprimé
            if (typeof onFormDeleted === 'function') {
                onFormDeleted(selectedFormId);
            } else {
                // Si la fonction n'est pas disponible, recharger la page
                window.location.reload();
            }
        } catch (error) {
            console.error('Erreur lors de la suppression du formulaire:', error);
            alert(`Erreur lors de la suppression: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fonction pour mettre à jour un formulaire
    const handleUpdateForm = async () => {
        if (!selectedFormId) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`${API_URL || 'http://localhost:5000'}/api/forms/${selectedFormId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: editFormName,
                    description: editFormDescription,
                    is_active: formInfo?.is_active ?? true
                })
            });

            if (!response.ok) {
                throw new Error(`Échec de la mise à jour. Statut: ${response.status}`);
            }

            // Mettre à jour les informations locales
            setFormInfo({
                ...formInfo,
                name: editFormName,
                description: editFormDescription
            });

            // Fermer la modale
            setShowEditModal(false);


        } catch (error) {
            console.error('Erreur lors de la mise à jour du formulaire:', error);
            alert(`Erreur lors de la mise à jour: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const menuItems = [
        {
            id: 'satisfaction',
            icon: BarChart2,
            title: "Analyse de satisfaction",
            description: "Visualisez les statistiques de satisfaction client",
            onClick: () => {
                setActiveView('satisfaction');
                setShowAnalytics(true);
                setAnalyticsView('main');
                setShowFeedbackAnalysis(false);
                setShowEditForm(false);
                setShowComments(false);
                setShowContacts(false);
                setShowComparatif(false);
            }
        },
        {
            id: 'edit',
            icon: Edit,
            title: "Modifier le formulaire",
            description: "Modifiez le formulaire de satisfaction",
            onClick: () => {
                setActiveView('edit');
                setShowEditForm(true);
                setShowAnalytics(false);
                setShowFeedbackAnalysis(false);
                setShowComments(false);
                setShowContacts(false);
                setShowComparatif(false);
            }
        },
        {
            id: 'contacts',
            icon: Users,
            title: "Détails des contacts",
            description: "Gérez les contacts à suivre",
            onClick: () => {
                setActiveView('contacts');
                setShowContacts(true);
                setShowAnalytics(false);
                setShowFeedbackAnalysis(false);
                setShowEditForm(false);
                setShowComments(false);
                setShowComparatif(false);
            }
        },
        {
            id: 'comments',
            icon: MessageCircle,
            title: "Commentaires optionnels",
            description: "Consultez les commentaires",
            onClick: () => {
                setActiveView('comments');
                setShowComments(true);
                setShowAnalytics(false);
                setShowFeedbackAnalysis(false);
                setShowEditForm(false);
                setShowContacts(false);
                setShowComparatif(false);
            }
        },
        {
            id: 'feedback',
            icon: MessageSquare,
            title: "Analyse des retours",
            description: "Analysez les retours détaillés des utilisateurs",
            onClick: () => {
                setActiveView('feedback');
                setShowFeedbackAnalysis(true);
                setShowAnalytics(false);
                setShowEditForm(false);
                setShowComments(false);
                setShowContacts(false);
                setShowComparatif(false);
            }
        },
        {
            id: 'comparatif',
            icon: BarChart2,
            title: "Comparatif des formulaires",
            description: "Comparez les statistiques entre tous les formulaires",
            onClick: () => {
                setActiveView('comparatif');
                setShowComparatif(true);
                setShowAnalytics(false);
                setShowFeedbackAnalysis(false);
                setShowEditForm(false);
                setShowComments(false);
                setShowContacts(false);
            }
        },
    ];

    const handleBack = () => {
        setActiveView(null);
        setShowAnalytics(false);
        setShowFeedbackAnalysis(false);
        setShowEditForm(false);
        setShowComments(false);
        setShowContacts(false);
        setShowComparatif(false);
        setAnalyticsView('main');
        onBack && onBack();
    };

    if (activeView) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="px-6 py-8">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 
                        hover:bg-gray-100 rounded-xl transition-colors text-lg"
                    >
                        <ArrowLeft className="w-6 h-6" />
                        <span>Retour</span>
                    </button>

                    {/* Display form name in the header when viewing a specific section */}
                    {loading ? (
                        <div className="mt-4 flex items-center text-gray-500">
                            <Loader className="animate-spin h-5 w-5 mr-2" />
                            <span>Chargement du formulaire...</span>
                        </div>

                    ) : null}
                </div>
                <div className="animate-fadeIn">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 px-6 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    {/* Display the logo above the title */}
                    <div className="flex justify-left">
                        <img src={logo} alt="Tetris Assurance" className="h-12 w-auto mb-4" />
                    </div>

                    {/* Display the title "Tableau de bord" */}
                    <h1 className="text-5xl font-bold text-tetris-blue text-center mb-4">
                        Tableau de bord
                    </h1>

                    {/* Display the form name below the title */}
                    {selectedFormId && (
                        <div className="text-center relative">
                            {loading ? (
                                <div className="flex items-center justify-center text-gray-500">
                                    <Loader className="animate-spin h-5 w-5 mr-2" />
                                    <span>Chargement...</span>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-3xl font-bold text-black text-center mb-4">
                                        {getFormName()}
                                    </h2>

                                    {/* Afficher la description si disponible */}
                                    {formInfo?.description && (
                                        <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
                                            {formInfo.description}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {error && selectedFormId && <p className="text-red-500 text-center">{error}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn max-w-6xl mx-auto">
                    {menuItems.map((item) => (
                        <MenuButton
                            key={item.id}
                            icon={item.icon}
                            title={item.title}
                            description={item.description}
                            onClick={selectedFormId ? item.onClick : () => alert('Veuillez sélectionner un formulaire d\'abord')}
                            isActive={activeView === item.id}
                        />
                    ))}
                </div>
            </div>

            {/* Modal de confirmation de suppression */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-[500px] p-6 animate-slideUp">
                        <h2 className="text-xl font-semibold text-red-600 mb-4">Confirmer la suppression</h2>

                        <p className="mb-6 text-gray-700">
                            Êtes-vous sûr de vouloir supprimer le formulaire "{getFormName()}" ?
                            Cette action est irréversible et supprimera toutes les données associées.
                        </p>

                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                disabled={isSubmitting}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteForm}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader className="animate-spin w-4 h-4 mr-2" />}
                                Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal d'édition des détails du formulaire */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
                    <div className="bg-white rounded-lg shadow-xl w-[600px] p-6 animate-slideUp">
                        <h2 className="text-xl font-semibold text-blue-900 mb-4">Modifier les détails du formulaire</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nom du formulaire</label>
                            <input
                                type="text"
                                placeholder="Saisissez le nom du formulaire"
                                value={editFormName}
                                onChange={(e) => setEditFormName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                            <textarea
                                placeholder="Saisissez une description"
                                value={editFormDescription}
                                onChange={(e) => setEditFormDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex justify-between items-center mt-8">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setShowDeleteModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                disabled={isSubmitting}
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Supprimer</span>
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleUpdateForm}
                                    disabled={!editFormName || isSubmitting}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors flex items-center"
                                >
                                    {isSubmitting && <Loader className="animate-spin w-4 h-4 mr-2" />}
                                    Mettre à jour
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Page;