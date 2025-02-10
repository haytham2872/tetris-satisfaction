import { useState } from 'react';

const useDashboardState = () => {
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showFeedbackAnalysis, setShowFeedbackAnalysis] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [analyticsView, setAnalyticsView] = useState('main');
    const [showComments, setShowComments] = useState(false);
    const [showContacts, setShowContacts] = useState(false);

    return {
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
        setShowContacts
    };
};

export default useDashboardState;