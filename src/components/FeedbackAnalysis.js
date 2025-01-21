import React, { useState, useEffect } from 'react';
import { 
  Settings,
  HeartHandshake,
  Star,
  Users,
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

const SentimentBadge = ({ feedback }) => {
  let category = 'NEUTRAL';
  
  if (feedback?.analysis?.sentiment?.score > 0.1) {
    category = 'POSITIVE';
  } else if (feedback?.analysis?.sentiment?.score < -0.1) {
    category = 'NEGATIVE';
  }

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
  }[category];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium text-sm ${config.color}`}>
      <Icon size={14} />
      {config.text}
    </span>
  );
};

const FeedbackCard = ({ feedback }) => {
  if (!feedback?.analysis) return null;

  const sentimentToScore = (value) => ((value + 1) / 2 * 100).toFixed(0);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        {/* Header with sentiment and date */}
        <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
  <SentimentBadge feedback={feedback} />
  {feedback.analysis.sentiment.magnitude > 0.8 && (
    <span className="text-sm bg-tetris-blue/10 text-tetris-blue px-2 py-1 rounded-full">
      Opinion marquée
    </span>
  )}
</div>
          <time className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            {feedback.timestamp?.toDate().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </time>
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

        {/* Sentiment Analysis */}
        <div className="mb-8">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-tetris-blue" />
            Analyse globale
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Sentiment</span>
                <div className="flex items-center gap-2">
                  {feedback.analysis.sentiment.score < -0.1 && (
                    <span className="text-red-600 text-sm">Négatif</span>
                  )}
                  {feedback.analysis.sentiment.score > 0.1 && (
                    <span className="text-green-600 text-sm">Positif</span>
                  )}
                  <span className="font-medium">
                    {Math.abs(feedback.analysis.sentiment.score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    feedback.analysis.sentiment.score > 0 ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.abs(feedback.analysis.sentiment.score * 100)}%`,
                    marginLeft: feedback.analysis.sentiment.score < 0 ? 'auto' : '0'
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Force de l'opinion</span>
                <span className="font-medium">
                  {(feedback.analysis.sentiment.magnitude * 50).toFixed(0)}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-tetris-blue rounded-full"
                  style={{
                    width: `${Math.min(feedback.analysis.sentiment.magnitude * 50, 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detected Entities */}
        {feedback.analysis.entities?.length > 0 && (
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-tetris-blue" />
              Éléments détectés
            </h4>
            <div className="flex flex-wrap gap-2">
              {feedback.analysis.entities
                .sort((a, b) => b.salience - a.salience)
                .map((entity, index) => (
                  <div 
                    key={index}
                    className="group relative"
                  >
                    <div className="px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 
                                 transition-colors flex items-center gap-2">
                      <span className="font-medium">{entity.name}</span>
                      {entity.mentions > 1 && (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {entity.mentions}×
                        </span>
                      )}
                      {entity.sentiment && (
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              entity.sentiment.score > 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{
                              width: `${Math.abs(entity.sentiment.score * 100)}%`,
                              marginLeft: entity.sentiment.score < 0 ? 'auto' : '0'
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="absolute -top-8 left-0 hidden group-hover:block 
                                  px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                      Pertinence: {(entity.salience * 100).toFixed(1)}%
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* Sentence Analysis */}
        {feedback.analysis.sentiment.sentences?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Analyse par phrase
            </h4>
            <div className="space-y-3">
              {feedback.analysis.sentiment.sentences.map((sentence, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    sentence.sentiment.score > 0.1 ? 'border-green-200 bg-green-50' :
                    sentence.sentiment.score < -0.1 ? 'border-red-200 bg-red-50' :
                    'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className="text-gray-700 mb-3">{sentence.text}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sentence.sentiment.score > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.abs(sentence.sentiment.score * 100)}%`,
                          marginLeft: sentence.sentiment.score < 0 ? 'auto' : '0'
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {Math.abs(sentence.sentiment.score * 100).toFixed(0)}%
                      {sentence.sentiment.score < 0 ? ' négatif' : ' positif'}
                    </span>
                    {sentence.sentiment.magnitude > 0.8 && (
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full whitespace-nowrap">
                        Opinion marquée
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FeedbackAnalyticsPage = ({ onBack }) => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const filteredFeedback = feedbackData.filter(feedback => {
    if (filter === 'all') return true;
    return feedback.analysis?.sentiment?.category === filter;
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

          <div className="flex items-center justify-between">
            <div>
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

            {/* Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'all' 
                    ? 'bg-tetris-blue text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setFilter('POSITIVE')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'POSITIVE'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Positifs
              </button>
              <button
                onClick={() => setFilter('NEGATIVE')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filter === 'NEGATIVE'
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Négatifs
              </button>
            </div>
          </div>
        </div>

        {/* Feedback Cards */}
        <div className="space-y-6">
          {filteredFeedback.map((feedback) => (
            <FeedbackCard key={feedback.id} feedback={feedback} />
          ))}

          {filteredFeedback.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Aucun commentaire trouvé
              </h3>
              <p className="text-gray-500 mt-2">
                {filter === 'all' 
                  ? "Les analyses apparaîtront ici une fois que les utilisateurs auront soumis leurs commentaires."
                  : "Aucun commentaire ne correspond au filtre sélectionné."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackAnalyticsPage;