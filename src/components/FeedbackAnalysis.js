import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Minus,
  Tag,
  BarChart,
  Clock
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const SentimentBadge = ({ category }) => {
  const config = {
    POSITIVE: {
      icon: ThumbsUp,
      color: 'bg-green-100 text-green-800',
      text: 'Positif'
    },
    NEGATIVE: {
      icon: ThumbsDown,
      color: 'bg-red-100 text-red-800',
      text: 'Négatif'
    },
    NEUTRAL: {
      icon: Minus,
      color: 'bg-gray-100 text-gray-800',
      text: 'Neutre'
    }
  }[category] || config.NEUTRAL;

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-sm ${config.color}`}>
      <Icon size={14} />
      {config.text}
    </span>
  );
};

const FeedbackCard = ({ feedback }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        {/* Header with sentiment and date */}
        <div className="flex justify-between items-start mb-6">
          <SentimentBadge category={feedback.analysis.sentiment.category} />
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {feedback.timestamp && new Date(feedback.timestamp.seconds * 1000).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>

        {/* Original comment */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-tetris-blue" />
            Commentaire
          </h3>
          <blockquote className="text-gray-700 bg-gray-50 p-4 rounded-lg border-l-4 border-tetris-blue">
            {feedback.originalText || "Aucun commentaire"}
          </blockquote>
        </div>

        {/* Analysis results */}
        <div className="space-y-6">
          {/* Sentiment Score */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <BarChart className="w-4 h-4 text-tetris-blue" />
              Analyse du sentiment
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Score</span>
                <span className="font-medium">{(feedback.analysis.sentiment.score * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-tetris-blue h-2.5 rounded-full transition-all"
                  style={{ width: `${((feedback.analysis.sentiment.score + 1) / 2 * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Main Topics */}
          {feedback.analysis.mainTopics && feedback.analysis.mainTopics.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-tetris-blue" />
                Sujets principaux
              </h4>
              <div className="flex flex-wrap gap-2">
                {feedback.analysis.mainTopics.map((topic, index) => (
                  <span
                    key={index}
                    className="bg-tetris-light/10 text-tetris-blue px-3 py-1 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FeedbackAnalyticsPage = ({ onBack }) => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'feedbackAnalysis'));
        const feedback = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.timestamp - a.timestamp);
        
        setFeedbackData(feedback);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching feedback:', error);
        setLoading(false);
      }
    };
  
    fetchFeedback();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            Retour aux statistiques
          </button>

          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-tetris-blue" />
            <h1 className="text-3xl font-bold text-gray-900">
              Analyse des Commentaires
            </h1>
          </div>
          <p className="text-gray-600 ml-11">
            Analyse détaillée des retours et suggestions des utilisateurs
          </p>
        </div>

        {/* Feedback Cards */}
        <div className="space-y-6">
          {feedbackData.map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}

          {feedbackData.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Aucune analyse disponible
              </h3>
              <p className="text-gray-500 mt-2">
                Les analyses apparaîtront ici une fois que les utilisateurs auront soumis leurs commentaires.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalyticsPage;