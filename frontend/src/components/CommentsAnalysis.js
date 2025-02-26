import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Filter,
  Search,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Heart,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import { analyzeFeedback } from '../services/nlpService';
const API_URL = process.env.REACT_APP_API_URL;
// Helper function to truncate text
const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// EmotionBadge Component
const EmotionBadge = ({ emotion }) => {
  const configs = {
    SATISFACTION: { icon: ThumbsUp, color: 'bg-green-100 text-green-800' },
    FRUSTRATION: { icon: AlertCircle, color: 'bg-red-100 text-red-800' },
    ENTHUSIASM: { icon: Heart, color: 'bg-purple-100 text-purple-800' },
    CONCERN: { icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-800' }
  };

  const config = configs[emotion] || configs.SATISFACTION;
  const Icon = config.icon;
  const displayName = emotion.charAt(0) + emotion.slice(1).toLowerCase();

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${config.color}`}>
      <Icon size={14} />
      {displayName}
    </span>
  );
};

// UrgencyBadge Component
const UrgencyBadge = ({ level }) => {
  const configs = {
    HIGH: { color: 'bg-red-100 text-red-800', label: 'haute' },
    MEDIUM: { color: 'bg-yellow-100 text-yellow-800', label: 'moyenne' },
    LOW: { color: 'bg-blue-100 text-blue-800', label: 'basse' },
    NORMAL: { color: 'bg-gray-100 text-gray-800', label: 'normale' }
  };

  const config = configs[level] || configs.NORMAL;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${config.color}`}>
      <Flag size={14} />
      Urgence {config.label}
    </span>
  );
};

const CommentsAnalysis = ({ formId, onBack }) => {
  const [comments, setComments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionFilter, setQuestionFilter] = useState('all');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [analyzedComments, setAnalyzedComments] = useState([]);
  const [uniqueQuestionIds, setUniqueQuestionIds] = useState([]);
  const [error, setError] = useState(null);
  const [formInfo, setFormInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch questions for specific form
        const questionsUrl = formId
          ? `${API_URL}/api/forms/${formId}/questions`
          : `${API_URL}/api/questions`;

        const questionsResponse = await fetch(questionsUrl);

        if (!questionsResponse.ok) {
          throw new Error(`Failed to fetch questions: ${questionsResponse.status}`);
        }

        const questionsData = await questionsResponse.json();

        // Normalize questions data structure
        const normalizedQuestions = questionsData.map(q => ({
          id: q.id || q.question_id,
          text: q.text || q.question_text || '',
        }));

        setQuestions(normalizedQuestions);

        // Fetch comments with form_id parameter
        const commentsUrl = formId
          ? `${API_URL}/api/comments?form_id=${formId}`
          : `${API_URL}/api/comments`;

        const commentsResponse = await fetch(commentsUrl);

        if (!commentsResponse.ok) {
          throw new Error(`Failed to fetch comments: ${commentsResponse.status}`);
        }

        const commentsData = await commentsResponse.json();

        // Fetch form info if formId is provided
        if (formId) {
          const formResponse = await fetch(`${API_URL}/api/forms/${formId}`);

          if (formResponse.ok) {
            const formData = await formResponse.json();
            setFormInfo(formData);
          }
        }

        // Create a questions lookup map
        const questionsMap = new Map(normalizedQuestions.map(q => [String(q.id), q.text]));

        // Process comments with question text lookup
        const processedComments = commentsData
          .filter(item => !formId || item.form_id === parseInt(formId)) // Filtrer par formId
          .map(item => {
            const questionId = item.question_id || item.questionId;
            const questionText = questionsMap.get(String(questionId));

            return {
              questionId: parseInt(questionId, 10),
              comment: item.optional_answer || item.comment,
              surveyId: item.survey_id,
              mainAnswer: item.answer,
              formId: item.form_id, // Ajouter formId aux données
              questionText: questionText || `Question ${questionId}`
            };
          });

        setComments(processedComments);

        // Set unique question IDs for filtering
        const uniqueIds = [...new Set(processedComments.map(c => c.questionId))].sort((a, b) => a - b);
        setUniqueQuestionIds(uniqueIds);

        // Process sentiment analysis
        const analyzed = await Promise.all(
          processedComments
            .filter(c => c.comment && c.comment.trim().length > 0)
            .map(async (comment) => {
              try {
                const analysis = await analyzeFeedback(comment.comment);
                return { ...comment, analysis };
              } catch (error) {
                console.error(`Error analyzing comment:`, error);
                return { ...comment, analysis: null };
              }
            })
        );

        setAnalyzedComments(analyzed);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  // Check if a comment matches the current filters
  const matchesSentimentFilter = (comment) => {
    const analyzed = analyzedComments.find(
      c => c.surveyId === comment.surveyId && c.questionId === comment.questionId
    );

    if (!analyzed || !analyzed.analysis) return sentimentFilter === 'all';

    const sentimentScore = analyzed.analysis.overall?.sentiment?.score || 0;
    const urgencyLevel = analyzed.analysis.overall?.urgency?.level || 'NORMAL';

    switch (sentimentFilter) {
      case 'positive':
        return sentimentScore >= 0;
      case 'negative':
        return sentimentScore < 0;
      case 'urgent':
        return urgencyLevel === 'HIGH' || urgencyLevel === 'MEDIUM';
      case 'all':
      default:
        return true;
    }
  };

  const filteredComments = comments.filter(comment => {
    const matchesFormId = !formId || comment.formId === parseInt(formId);
    const matchesQuestion = questionFilter === 'all' || questionFilter === comment.questionId.toString();
    const matchesSentiment = matchesSentimentFilter(comment);
    const matchesSearch = searchTerm === '' ||
      (comment.comment && comment.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (comment.questionText && comment.questionText.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply all filters
    return matchesFormId && matchesSearch && matchesQuestion && matchesSentiment;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Une erreur est survenue</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-tetris-blue text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyse des Commentaires Optionnels</h1>
              <p className="text-gray-600">
                {filteredComments.length} commentaire{filteredComments.length > 1 ? 's' : ''} au total
                {formInfo && ` pour "${formInfo.name}"`}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher dans les commentaires..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters Section - Side by side design like in FeedbackAnalysisPage */}
          <div className="flex flex-wrap items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium">Filtres:</span>
            </div>

            {/* Question Filter */}
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <select
                value={questionFilter}
                onChange={(e) => setQuestionFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
              >
                <option value="all">Toutes les questions</option>
                {uniqueQuestionIds.map(id => {
                  const question = questions.find(q => q.id === id);
                  return (
                    <option key={id} value={id.toString()}>
                      {question?.text ? truncateText(question.text, 40) : `Question ${id}`}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sentiment Filter */}
            <div className="flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-gray-500" />
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white text-sm"
              >
                <option value="all">Tous les sentiments</option>
                <option value="positive">Positifs</option>
                <option value="negative">Négatifs</option>
                <option value="urgent">Urgents</option>
              </select>
            </div>
          </div>
        </div>

        {/* Comments Grid */}
        <div className="space-y-4">
          {filteredComments.length > 0 ? (
            filteredComments.map((comment, index) => {
              const analyzed = analyzedComments.find(
                c => c.surveyId === comment.surveyId && c.questionId === comment.questionId
              );

              // Get sentiment data
              const sentimentScore = analyzed?.analysis?.overall?.sentiment?.score || 0;
              const displayPercentage = analyzed?.analysis?.overall?.sentiment?.displayPercentage || 50;
              const sentimentDisplay = sentimentScore >= 0 ? 'positif' : 'négatif';
              const sentimentClass = sentimentScore >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
              const SentimentIcon = sentimentScore >= 0 ? ThumbsUp : ThumbsDown;

              // Get other analysis data
              const dominantEmotion = analyzed?.analysis?.overall?.emotions?.dominant;
              const urgencyLevel = analyzed?.analysis?.overall?.urgency?.level || 'NORMAL';
              const wordCount = analyzed?.analysis?.metadata?.wordCount || 0;

              return (
                <div
                  key={`${comment.surveyId}-${comment.questionId}-${index}`}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Question information */}
                  <div className="mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="px-3 py-1.5 bg-tetris-blue text-white text-sm font-medium rounded-lg">
                        Question {comment.questionId}
                      </span>
                      {comment.mainAnswer && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-tetris-blue rounded-lg">
                          {comment.questionId === 1 ? (
                            <>
                              <Star className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Note: {comment.mainAnswer}/10
                              </span>
                            </>
                          ) : (
                            <span className="text-sm font-medium">
                              Réponse: {comment.mainAnswer}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-3">
                      {comment.questionText || `Question ${comment.questionId}`}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-6">
                    {analyzed && analyzed.analysis && (
                      <>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${sentimentClass}`}>
                          <SentimentIcon size={14} />
                          {displayPercentage}% {sentimentDisplay}
                        </span>

                        {dominantEmotion && (
                          <EmotionBadge emotion={dominantEmotion} />
                        )}

                        <UrgencyBadge level={urgencyLevel} />

                        <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                          <MessageSquare size={14} />
                          {wordCount} mots
                        </div>
                      </>
                    )}
                  </div>

                  {/* Comment Content */}
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-tetris-blue flex-shrink-0 mt-1" />
                    <p className="text-gray-700 leading-relaxed">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Aucun commentaire trouvé
              </h3>
              <p className="text-gray-500 mt-2">
                {searchTerm
                  ? "Aucun commentaire ne correspond à votre recherche."
                  : questionFilter !== 'all' && sentimentFilter !== 'all'
                    ? "Aucun commentaire ne correspond aux filtres sélectionnés."
                    : questionFilter !== 'all'
                      ? "Aucun commentaire n'a été laissé pour cette question."
                      : sentimentFilter !== 'all'
                        ? `Aucun commentaire ${sentimentFilter === 'positive' ? 'positif' :
                          sentimentFilter === 'negative' ? 'négatif' :
                            sentimentFilter === 'urgent' ? 'urgent' : ''
                        } n'a été trouvé.`
                        : "Aucun commentaire n'a été laissé."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentsAnalysis;