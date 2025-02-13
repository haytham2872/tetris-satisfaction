import React, { useState } from 'react';
import {
    BarChart2,
    MessageSquare,
    Edit,
    MessageCircle,
    Users,
    ArrowLeft
} from 'lucide-react';

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
    setShowAnalytics,
    setShowFeedbackAnalysis,
    setShowEditForm,
    setAnalyticsView,
    setShowComments,
    setShowContacts,
    onBack,
    setShowDashboard,
    children
}) => {
    const [activeView, setActiveView] = useState(null);

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
            }
        },
        //{
          //  id: 'additional',
            //icon: PieChart,
            //title: "Analyses complémentaires",
            //description: "Accédez aux analyses complémentaires",
            //onClick: () => {
            //    setActiveView('additional');
            //    setShowAnalytics(true);
            //    setAnalyticsView('additional');
            //    setShowFeedbackAnalysis(false);
            //    setShowEditForm(false);
            //    setShowComments(false);
            //    setShowContacts(false);
            //}
        //},
        
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
            }
        },
        {
            id: 'comments',
            icon: MessageCircle,
            title: "Commentaires optionels",
            description: "Consultez les commentaires",
            onClick: () => {
                setActiveView('comments');
                setShowComments(true);
                setShowAnalytics(false);
                setShowFeedbackAnalysis(false);
                setShowEditForm(false);
                setShowContacts(false);
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
        setAnalyticsView('main');
        onBack && onBack();
    };

    
    // If we have an active view, return the child component directly
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
                </div>
                <div className="animate-fadeIn">
                    {children}
                </div>
            </div>
        );
    }

    // Dashboard view (menu)
    return (
        <div className="min-h-screen bg-gray-50 px-6 py-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12">
                    <div className="mb-8">
                        <button
                            onClick={() => setShowDashboard(false)}
                            className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:text-gray-900 
                            hover:bg-gray-100 rounded-xl transition-colors text-lg"
                        >
                            <ArrowLeft className="w-6 h-6" />
                            <span>Retour au questionnaire</span>
                        </button>
                    </div>
                    <h1 className="text-5xl font-bold text-tetris-blue text-center mb-16">
                        Tableau de bord
                    </h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn max-w-6xl mx-auto">
                    {menuItems.map((item) => (
                        <MenuButton
                            key={item.id}
                            icon={item.icon}
                            title={item.title}
                            description={item.description}
                            onClick={item.onClick}
                            isActive={activeView === item.id}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Page;