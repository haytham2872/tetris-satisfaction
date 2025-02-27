import React, { useState, useEffect } from 'react';
import {
    BarChart2,
    MessageSquare,
    Edit,
    MessageCircle,
    Users,
    ArrowLeft,
    Loader
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
    children,
}) => {
    const [activeView, setActiveView] = useState(null);
    const [formInfo, setFormInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [availableForms, setAvailableForms] = useState(propAvailableForms || []);

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
                        <div className="text-center">
                            {loading ? (
                                <div className="flex items-center justify-center text-gray-500">
                                    <Loader className="animate-spin h-5 w-5 mr-2" />
                                    <span>Chargement...</span>
                                </div>
                            ) : (
                                <h2 className="text-3xl font-bold text-black text-center mb-4">
                                    {getFormName()}
                                </h2>
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
        </div>
    );
};

export default Page;