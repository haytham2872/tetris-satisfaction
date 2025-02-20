import React, { useState, useEffect } from 'react';
import { 
    MessageSquare,
    ThumbsUp,
    AlertCircle,
    Filter,
    Flag,
    ThumbsDown,
    Minus,
    Heart,
    AlertTriangle
} from 'lucide-react';

const EmotionBadge = ({ emotion, score }) => {
    const configs = {
        SATISFACTION: { icon: ThumbsUp, color: 'bg-green-100 text-green-800' },
        FRUSTRATION: { icon: AlertCircle, color: 'bg-red-100 text-red-800' },
        ENTHUSIASM: { icon: Heart, color: 'bg-purple-100 text-purple-800' },
        CONCERN: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' }
    };

    const config = configs[emotion] || configs.SATISFACTION;
    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${config.color}`}>
            <Icon size={14} />
            {emotion.charAt(0) + emotion.slice(1).toLowerCase()}
        </span>
    );
};

const UrgencyBadge = ({ level }) => {
    const configs = {
        HIGH: { color: 'bg-red-100 text-red-800' },
        MEDIUM: { color: 'bg-yellow-100 text-yellow-800' },
        LOW: { color: 'bg-blue-100 text-blue-800' },
        NORMAL: { color: 'bg-gray-100 text-gray-800' }
    };

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${configs[level].color}`}>
            <Flag size={14} />
            Urgence {level.toLowerCase()}
        </span>
    );
};

// Topic Analysis Component - Place this before FeedbackCard
const TopicAnalysis = ({ topic, data }) => {
    if (!data?.subtopics) return null;

    const translations = {
        topics: {
            'SUPPORT': 'Support',
            'PLATFORM': 'Plateforme',
            'PROCESS': 'Processus'
        },
        subtopics: {
            'TECHNICAL': 'Technique',
            'CUSTOMER_SERVICE': 'Service client',
            'RESPONSE_TIME': 'Temps de réponse',
            'USABILITY': 'Utilisabilité',
            'FEATURES': 'Fonctionnalités',
            'PERFORMANCE': 'Performance'
        }
    };

    const getSentimentIcon = (sentiment) => {
        if (sentiment > 0.2) return <ThumbsUp className="w-4 h-4 text-green-600" />;
        if (sentiment < -0.2) return <ThumbsDown className="w-4 h-4 text-red-600" />;
        return <Minus className="w-4 h-4 text-gray-600" />;
    };

    return (
        <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
                {translations.topics[topic] || topic}
            </h4>
            <div className="space-y-2">
                {Object.entries(data.subtopics).map(([subtopic, details]) => {
                    if (!details || !details.mentions) return null;
                    
                    const translatedSubtopic = translations.subtopics[subtopic] || subtopic;
                    
                    return (
                        <div key={subtopic} className="flex items-center justify-between bg-white p-2 rounded-md">
                            <div className="flex items-center gap-2">
                                {getSentimentIcon(details.sentiment)}
                                <span className="text-sm">
                                    {translatedSubtopic}
                                </span>
                            </div>
                            <span className="text-sm text-gray-500">
                                {details.mentions} mention{details.mentions > 1 ? 's' : ''}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Main FeedbackCard Component
const FeedbackCard = ({ feedback, questions }) => {
    // Parse the nlp_analysis if it's a string
    let analysis = feedback.analysis;
    if (typeof analysis === 'string') {
        try {
            analysis = JSON.parse(analysis);
        } catch (e) {
            console.error('Error parsing analysis:', e);
            analysis = null;
        }
    }

    const { 
        overall = {},
        topics = {},
        metadata = {}
    } = feedback?.analysis || {};

    const sentimentScore = overall?.sentiment?.score || 0;
    const displayPercentage = Math.abs(overall?.sentiment?.displayPercentage || 50);
    const urgencyLevel = overall?.urgency?.level || 'NORMAL';
    const dominantEmotion = overall?.emotions?.dominant;
    const emotions = overall?.emotions?.emotions || {};
    const wordCount = metadata?.wordCount || 0;

    // Display the actual question text if available
    const questionHeader = feedback.questionText || `Question ${feedback.questionId}`;

    // Determine sentiment display
    const sentimentDisplay = sentimentScore >= 0 ? 'positif' : 'négatif';
    const sentimentClass = sentimentScore >= 0 ? 
        'bg-green-100 text-green-800' : 
        'bg-red-100 text-red-800';
    const SentimentIcon = sentimentScore >= 0 ? ThumbsUp : ThumbsDown;

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
                {/* Question Header */}
                <div className="mb-4 text-lg font-medium text-gray-700">
                    {questionHeader}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${sentimentClass}`}>
                        <SentimentIcon size={14} />
                        {displayPercentage}% {sentimentDisplay}
                    </span>

                    {dominantEmotion && (
                        <EmotionBadge 
                            emotion={dominantEmotion} 
                            score={emotions[dominantEmotion]?.score || 0}
                            isNegated={emotions[dominantEmotion]?.isNegated}
                        />
                    )}

                    <UrgencyBadge level={urgencyLevel} />

                    <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                        <MessageSquare size={14} />
                        {wordCount} mots
                    </div>
                </div>

                {/* Comment Content */}
                <div className="mb-6">
                    <blockquote className="text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-tetris-blue">
                        {feedback.originalText}
                    </blockquote>
                </div>

                {/* Sentiment général */}
                <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Sentiment général</h4>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Score</span>
                        <span className="font-medium text-sm">
                            {displayPercentage}% {sentimentScore >= 0 ? 'positif' : 'négatif'}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div
                            className="h-full rounded-full"
                            style={{
                                width: `${displayPercentage}%`,
                                backgroundColor: sentimentScore < 0 ? '#ef4444' : '#22c55e'
                            }}
                        />
                    </div>
                </div>

                {/* Sujets détectés */}
                {Object.keys(topics).length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-tetris-blue" />
                            Sujets détectés
                        </h4>
                        <div className="space-y-3">
                            {Object.entries(topics).map(([topic, data]) => (
                                <TopicAnalysis key={topic} topic={topic} data={data} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const FeedbackAnalysisPage = ({ formId, onBack }) => {
    const [feedbackData, setFeedbackData] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [formInfo, setFormInfo] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Construire les URLs avec le formId
                const feedbackUrl = formId 
                    ? `https://tetris-forms.azurewebsites.net/api/feedback/analysis?form_id=${formId}`
                    : 'https://tetris-forms.azurewebsites.net/api/feedback/analysis';
                
                const questionsUrl = formId
                    ? `https://tetris-forms.azurewebsites.net/api/forms/${formId}/questions`
                    : 'https://tetris-forms.azurewebsites.net/api/questions';

                // Fetch feedback, questions, et informations du formulaire
                const promises = [
                    fetch(feedbackUrl),
                    fetch(questionsUrl)
                ];

                // Ajouter la requête pour les informations du formulaire si formId est présent
                if (formId) {
                    promises.push(
                        fetch(`https://tetris-forms.azurewebsites.net/api/forms/${formId}`)
                    );
                }

                const responses = await Promise.all(promises);

                // Vérifier que toutes les réponses sont ok
                if (!responses.every(response => response.ok)) {
                    throw new Error('Failed to fetch data');
                }

                const [feedbackData, questionsData, formData] = await Promise.all(
                    responses.map(response => response.json())
                );

                setFeedbackData(feedbackData);
                setQuestions(questionsData);
                if (formData) {
                    setFormInfo(formData);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [formId]);

    const filteredFeedback = feedbackData.filter(feedback => {
        // Vérifier que feedback n'est pas null ou undefined
        if (!feedback) return false;
    
        // Filtrer par formId
        if (formId && parseInt(feedback.form_id) !== parseInt(formId)) return false;
        
        // Appliquer les autres filtres
        if (filter === 'all') return true;
    
        // S'assurer que l'analyse existe
        const analysis = feedback.analysis;
        if (!analysis || !analysis.overall || !analysis.overall.sentiment) return false;
    
        const score = analysis.overall.sentiment.score || 0;
        
        switch (filter) {
            case 'positive':
                return score > 0.1;
            case 'negative':
                return score < -0.1;
            case 'urgent':
                return analysis.overall.urgency?.level === 'HIGH';
            case 'neutral':
                return Math.abs(score) <= 0.1;
            default:
                return true;
        }
    });


    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header with form info */}
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Analyse des Commentaires
                                {formInfo && ` - ${formInfo.name}`}
                            </h1>
                            <p className="text-gray-600">
                                {filteredFeedback.length} commentaires analysés
                                {formInfo && ` pour ce formulaire`}
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
                            >
                                <option value="all">Tous</option>
                                <option value="positive">Positifs</option>
                                <option value="negative">Négatifs</option>
                                <option value="urgent">Urgents</option>
                                <option value="neutral">Neutres</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Feedback Cards */}
                <div className="space-y-6">
                    {filteredFeedback.map((feedback) => (
                        <FeedbackCard 
                            key={`${feedback.id}-${feedback.questionId}`}
                            feedback={feedback}
                            questions={questions}
                        />
                    ))}

                    {filteredFeedback.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">
                                Aucun commentaire trouvé
                            </h3>
                            <p className="text-gray-500 mt-2">
                                {filter === 'all' 
                                    ? formInfo
                                        ? "Aucun commentaire n'a encore été soumis pour ce formulaire."
                                        : "Les analyses apparaîtront ici une fois que les utilisateurs auront soumis leurs commentaires."
                                    : "Aucun commentaire ne correspond au filtre sélectionné."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackAnalysisPage;