import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { 
   AlertTriangle, ThumbsUp, MessageSquare, BarChart2,
   FileText, CheckCircle2,
  ChevronDown, ChevronRight,
} from 'lucide-react';

// Color schemes
const COLORS = ['#0B3D91', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB'];
const RADIAN = Math.PI / 180;
const API_URL = process.env.REACT_APP_API_URL;

// Custom pie chart label component
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (value === 0) return null;
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize="12"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};


// Improved Text Question Card with more nuanced sentiment display
const TextQuestionCard = ({ data }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!data) return null;
  
  // Ensure sentiment value exists and is a valid number
  const sentimentValue = data.sentiment !== undefined && !isNaN(Number(data.sentiment)) 
    ? Number(data.sentiment) 
    : 0;
  
  // Use displayPercentage if available, otherwise calculate from raw score
  const displayPercentage = data.displayPercentage !== undefined && data.displayPercentage !== null
    ? data.displayPercentage
    : Math.abs(sentimentValue) * 100;
  
  // Check if we have sentiment details
  const sentimentDetails = data.sentimentDetails || {};
  
  // Function to get sentiment color
  const getSentimentColor = (score) => {
    if (score >= 0.5) return 'text-green-600';
    if (score >= 0.2) return 'text-green-500';
    if (score <= -0.5) return 'text-red-600';
    if (score <= -0.2) return 'text-red-500';
    return 'text-yellow-500';
  };
  
  // Function to get sentiment icon
  const getSentimentIcon = (score) => {
    if (score >= 0.2) return '😊';
    if (score <= -0.2) return '😞';
    return '😐';
  };

  // Function to format the sentiment display
  const formatSentimentDisplay = (score, percentage) => {
    if (percentage) {
      return `${Math.round(percentage)}% ${score >= 0 ? 'positif' : 'négatif'}`;
    } else {
      return score.toFixed(2);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 truncate" title={data.text}>
            {data.text.length > 60 
              ? data.text.substring(0, 60) + '...' 
              : data.text}
          </h3>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-gray-500 mr-3">{data.responseCount} réponse{data.responseCount !== 1 ? 's' : ''}</span>
            {/* Only show sentiment if it has a sentimentCount */}
            {data.sentimentCount > 0 ? (
              <span className={`flex items-center ${getSentimentColor(sentimentValue)} mr-3`}>
                {formatSentimentDisplay(sentimentValue, displayPercentage)} {getSentimentIcon(sentimentValue)}
              </span>
            ) : (
              <span className="text-gray-400 mr-3">Pas de sentiment</span>
            )}
            <span className="text-gray-500">{data.avgWords} mots/réponse</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>
      
      {expanded && (
        <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50">
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Statistiques</span>
              <span>{data.responseCount} réponses</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-2">
              {/* Sentiment Analysis */}
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-700 mb-2">Analyse de sentiment</p>
                
                {data.sentimentCount > 0 ? (
                  <>
                    {/* Sentiment Score Display */}
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-gray-500">Score</p>
                      <p className={`font-medium text-sm flex items-center ${getSentimentColor(sentimentValue)}`}>
                        {formatSentimentDisplay(sentimentValue, displayPercentage)} {getSentimentIcon(sentimentValue)}
                      </p>
                    </div>
                    
                    {/* Sentiment Bar */}
                    <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
                      <div
                        className={`h-full rounded-full ${sentimentValue < 0 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{
                          width: `${Math.min(Math.abs(displayPercentage), 100)}%`
                        }}
                      />
                    </div>
                    
                    {/* Sentiment Breakdown */}
                    {sentimentDetails.rawScores && sentimentDetails.rawScores.length > 1 && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500 mb-2">Répartition des sentiments :</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Positif</p>
                            <p className="font-medium text-green-600">
                              {sentimentDetails.positiveCount} 
                              <span className="text-xs text-gray-500 ml-1">
                                ({Math.round(sentimentDetails.positiveCount / sentimentDetails.rawScores.length * 100)}%)
                              </span>
                            </p>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Neutre</p>
                            <p className="font-medium text-yellow-600">
                              {sentimentDetails.neutralCount}
                              <span className="text-xs text-gray-500 ml-1">
                                ({Math.round(sentimentDetails.neutralCount / sentimentDetails.rawScores.length * 100)}%)
                              </span>
                            </p>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-xs text-gray-500">Négatif</p>
                            <p className="font-medium text-red-600">
                              {sentimentDetails.negativeCount}
                              <span className="text-xs text-gray-500 ml-1">
                                ({Math.round(sentimentDetails.negativeCount / sentimentDetails.rawScores.length * 100)}%)
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-3">
                      Basé sur {data.sentimentCount} analyse{data.sentimentCount !== 1 ? 's' : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">Aucune analyse de sentiment disponible</p>
                )}
              </div>
              
              {/* Words Analysis */}
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-700 mb-1">Analyse textuelle</p>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Mots par réponse</p>
                  <p className="text-lg font-bold">{data.avgWords}</p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Total : {data.totalWords} mots pour {data.responseCount} réponse{data.responseCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simplified Text Analysis Section
// Improved Text Analysis Section with more nuanced sentiment display
const SimpleTextAnalysisSection = ({ textQuestions, stats }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!textQuestions || textQuestions.length === 0) return null;
  
  // Helper functions for sentiment display
  const getSentimentIcon = (score) => {
    if (score >= 0.2) return '😊';
    if (score <= -0.2) return '😞';
    return '😐';
  };
  
  // Format sentiment as percentage if applicable
  const formatSentiment = (value) => {
    if (Math.abs(value) <= 1) {
      return value.toFixed(2);
    } else {
      return `${Math.round(value)}%`;
    }
  };
  
  // Calculate positive vs negative counts
  const positiveQuestions = textQuestions.filter(q => q.sentiment >= 0.2).length;
  const negativeQuestions = textQuestions.filter(q => q.sentiment <= -0.2).length;
  const neutralQuestions = textQuestions.length - positiveQuestions - negativeQuestions;
  
  return (
    <div className="mb-12">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-xl font-semibold text-gray-800">
          <div className="flex items-center">
            <FileText className="w-6 h-6 mr-2 text-purple-500" />
            Analyse des réponses textuelles
            <span className="ml-2 text-sm text-gray-500 font-normal">
              ({textQuestions.length} question{textQuestions.length > 1 ? 's' : ''})
            </span>
          </div>
        </h2>
        <div>
          <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* Summary bar always visible */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4 mb-4">
        <div className="grid grid-cols-3 gap-4">
          {/* Total Responses */}
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100 mr-3">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total des réponses</p>
              <p className="text-lg font-semibold">
                {stats.totalTextResponses || 0}
              </p>
            </div>
          </div>
          
          {/* Average Sentiment */}
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-purple-100 mr-3">
              <ThumbsUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sentiment moyen</p>
              <p className="text-lg font-semibold flex items-center">
                {formatSentiment(stats.averageSentiment)}
                {getSentimentIcon(stats.averageSentiment)}
              </p>
              {textQuestions.length > 1 && (
                <p className="text-xs text-gray-500">
                  {positiveQuestions} positif{positiveQuestions !== 1 ? 's' : ''}, 
                  {negativeQuestions} négatif{negativeQuestions !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          {/* Average Words */}
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100 mr-3">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Longueur moyenne</p>
              <p className="text-lg font-semibold">
                {stats.averageWords || 0} mots
              </p>
              <p className="text-xs text-gray-500">
                {textQuestions.reduce((sum, q) => sum + q.totalWords, 0)} mots au total
              </p>
            </div>
          </div>
        </div>
        
        {/* Add sentiment distribution bar */}
        {textQuestions.length > 0 && (
          <div className="mt-4 px-2">
            <p className="text-xs text-gray-500 mb-1">Distribution des sentiments :</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex">
              {negativeQuestions > 0 && (
                <div className="h-full bg-red-500" style={{ width: `${(negativeQuestions / textQuestions.length) * 100}%` }}></div>
              )}
              {neutralQuestions > 0 && (
                <div className="h-full bg-yellow-400" style={{ width: `${(neutralQuestions / textQuestions.length) * 100}%` }}></div>
              )}
              {positiveQuestions > 0 && (
                <div className="h-full bg-green-500" style={{ width: `${(positiveQuestions / textQuestions.length) * 100}%` }}></div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Expandable detailed section */}
      {expanded && (
        <div className="grid grid-cols-1 gap-4 mt-2">
          {textQuestions.map((question) => (
            <TextQuestionCard key={question.id} data={question} />
          ))}
        </div>
      )}
    </div>
  );
};

// Rating histogram component
const RatingHistogram = ({ question, data, colorScale = ['#8884d8', '#4169E1', '#0B3D91'] }) => {
  if (!data || !data.histogramData) return null;
  
  const getBarColor = (rating, maxRating) => {
    const index = Math.floor((rating - 1) / maxRating * colorScale.length);
    return colorScale[Math.min(index, colorScale.length - 1)];
  };
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          {question.question_text}
        </h2>
        <div className="flex items-center justify-between mt-2">
          <p className="text-gray-500">
            Score moyen: <span className="font-bold text-blue-600">{data.averageScore}</span>
          </p>
          <p className="text-gray-500">
            {data.totalResponses} réponse{data.totalResponses !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.histogramData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="rating" 
            label={{ 
              value: question.question_type === 'stars' ? 'Étoiles' : 'Note', 
              position: 'insideBottom', 
              offset: -10 
            }}
          />
          <YAxis 
            label={{ 
              value: 'Nombre de réponses', 
              angle: -90, 
              position: 'insideLeft',
              style: { textAnchor: 'middle' }
            }}
          />
          <Tooltip 
            formatter={(value, name, props) => [
              `${value} réponses (${props.payload.percentage}%)`,
              question.question_type === 'stars' ? 'Étoiles' : 'Note'
            ]}
          />
          <Bar dataKey="count">
            {data.histogramData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getBarColor(entry.rating, Math.max(...data.histogramData.map(d => d.rating)))} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Stat card component
const StatCard = ({ icon: Icon, title, value, description, colorClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  </div>
);
const AbandonmentAnalysisSection = ({ completionData, formQuestions }) => {
  const [expanded, setExpanded] = useState(true);

  if (!completionData) return null;

  const statusData = completionData.status_breakdown || [];
  const abandonmentByStep = completionData.abandonment_by_question || [];
  
  // Sort questions by ID (assuming lower IDs come first in the survey)
  const sortedQuestions = [...formQuestions].sort((a, b) => a.id - b.id);
  
  // Create a mapping from step number to question
  const stepToQuestionMap = {};
  sortedQuestions.forEach((question, index) => {
    // Steps are 1-indexed in the database
    const stepNumber = index + 1;
    stepToQuestionMap[stepNumber] = question;
  });
  
  // Map abandonment data to include question information
  const abandonmentWithQuestions = abandonmentByStep.map(item => {
    const stepNumber = parseInt(item.step_number);
    const question = stepToQuestionMap[stepNumber];
    return {
      ...item,
      question_id: question ? question.id : null,
      question_text: question ? question.question_text : `Question ${stepNumber} (non disponible)`,
      question_number: stepNumber,
      abandonment_count: parseInt(item.abandonment_count)
    };
  });
  
  // Sort data by step number
  const sortedAbandonmentData = [...abandonmentWithQuestions]
    .sort((a, b) => a.question_number - b.question_number);
    
  // Map sequence numbers (1, 2, 3...) to question database IDs
  const questionNumberMap = {};
  sortedQuestions.forEach((q, index) => {
    questionNumberMap[q.id] = index + 1; // 1-based numbering
  });
  
  // Prepare data for status pie chart
  const statusChartData = statusData.map(item => ({
    name: item.status === 'completed' ? 'Complétés' : 
          item.status === 'abandoned' ? 'Abandonnés' : 'En cours',
    value: parseInt(item.count),
    percentage: parseFloat(item.percentage),
    originalStatus: item.status
  }));

  return (
    <div className="mb-12">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-xl font-semibold text-gray-800">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 mr-2 text-orange-500" />
            Analyse des abandons
            <span className="ml-2 text-sm text-gray-500 font-normal">
              ({completionData.total_surveys} formulaires)
            </span>
          </div>
        </h2>
        <div>
          <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {expanded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Status breakdown pie chart */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">État des formulaires</h3>
              {statusChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={CustomLabel}
                      labelLine={false}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.originalStatus === 'completed' ? '#4CAF50' : 
                               entry.originalStatus === 'abandoned' ? '#F44336' : '#FFC107'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name, props) => [
                        `${value} formulaires (${props.payload.percentage.toFixed(1)}%)`,
                        props.payload.name
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Aucune donnée disponible sur l'état des formulaires
                </div>
              )}
            </div>
            
            {/* Abandonment by question bar chart */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">Abandons par question</h3>
              {sortedAbandonmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sortedAbandonmentData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="question_number" 
                      label={{ value: 'Numéro de question', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Nombre d\'abandons', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} abandons`]}
                      labelFormatter={(label) => `Question ${label}`}
                    />
                    <Bar 
                      dataKey="abandonment_count" 
                      name="Abandons" 
                      fill="#F44336" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Aucune donnée d'abandon disponible
                </div>
              )}
            </div>
          </div>
          
          {/* Detailed table of abandonment by question */}
          {sortedAbandonmentData.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-6">
              <h3 className="text-lg font-semibold mb-4">Détail des abandons par question</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Question #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Texte de la question
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre d'abandons
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedAbandonmentData.map((item) => (
                      <tr key={item.question_id || item.question_number}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {questionNumberMap[item.question_id] || item.question_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.question_text}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.abandonment_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {sortedAbandonmentData.length === 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mt-6 text-center text-gray-500">
              Aucune donnée d'abandon n'est disponible pour ce formulaire.
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Main component
// Add externalFeedbackData as a new prop
const EnhancedSurveyAnalytics = ({ formId, externalFeedbackData = [] }) => {
  // State
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formName, setFormName] = useState('');
  const [surveyCompletionData, setSurveyCompletionData] = useState(null);
  const [stats, setStats] = useState({
    totalFormSubmissions: 0,
    totalResponses: 0,
    unsatisfiedUsers: 0,
    positiveResponses: 0,
    totalAnalyzed: 0,
    averageSentiment: 0,
    totalSentimentResponses: 0,
    totalTextResponses: 0,
    averageWords: 0
  });
  const [textQuestionsData, setTextQuestionsData] = useState([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
  
        const questionsUrl = `${API_URL}/api/forms/${formId}/questions`;
        const responsesUrl = `${API_URL}/api/analytics/responses?form_id=${formId}`;
        const formUrl = `${API_URL}/api/forms/${formId}`;
        const lowSatisfactionUrl = `${API_URL}/api/low-satisfaction?form_id=${formId}`;
        
        const fetchOptions = {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        };
        
        const [questionsRes, responsesRes, formRes, lowSatisfactionRes] = await Promise.all([
          fetch(questionsUrl, fetchOptions),
          fetch(responsesUrl, fetchOptions),
          fetch(formUrl, fetchOptions),
          fetch(lowSatisfactionUrl, fetchOptions)
        ]);
  
        if (!questionsRes.ok || !responsesRes.ok || !formRes.ok) {
          throw new Error('Failed to fetch data');
        }
  
        const questionsData = await questionsRes.json();
        const responsesData = await responsesRes.json();
        const formData = await formRes.json();
        const lowSatisfactionData = await lowSatisfactionRes.json();
        const surveyCompletionUrl = `${API_URL}/api/analytics/survey-completion?form_id=${formId}`;
        try {
          const surveyCompletionRes = await fetch(surveyCompletionUrl, fetchOptions);
          if (surveyCompletionRes.ok) {
            const completionData = await surveyCompletionRes.json();
            
            console.log('Raw survey completion data:', completionData);
            
            // If the backend is still using the old format, we need to rename the fields
            if (completionData.abandonment_by_question) {
              completionData.abandonment_by_question = completionData.abandonment_by_question.map(item => {
                // Check if we're dealing with the old format (having question_id field)
                if (item.question_id && !item.step_number) {
                  return {
                    ...item,
                    step_number: item.question_id,
                    // Keep the question_id for backward compatibility
                  };
                }
                return item;
              });
            }
            
            setSurveyCompletionData(completionData);
          }
        } catch (err) {
          console.error('Error fetching survey completion data:', err);
        }
  
        const processedQuestions = questionsData.map(q => ({
          ...q,
          options: Array.isArray(q.options) 
            ? q.options 
            : (typeof q.options === 'string' 
              ? JSON.parse(q.options || '[]') 
              : [])
        }));
  
        // Using externalFeedbackData instead of making a separate API call
        const feedbackAnalysisData = externalFeedbackData;
  
        // Calculate sentiment statistics
        let totalSentimentScore = 0;
        let totalSentimentResponses = 0;
        let positiveResponses = 0;
        let totalFormSubmissions = responsesData.length;
        
        // NEW: Track display percentages for averaging
        let totalDisplayPercentage = 0;
        let displayPercentageCount = 0;
        
        // Count unique survey_ids to get actual form submissions
        const uniqueSurveyIds = new Set(responsesData.map(response => response.survey_id));
        const actualFormSubmissions = uniqueSurveyIds.size;
  
        // Process feedback data from external source
        feedbackAnalysisData.forEach(feedback => {
          try {
            // Make sure we're only processing feedback for this form
            if (formId && String(feedback.form_id) !== String(formId)) {
              return;
            }
            
            // Extract sentiment data
            const analysis = feedback.analysis;
            if (analysis && analysis.overall && analysis.overall.sentiment) {
              // Process raw sentiment score
              if (analysis.overall.sentiment.score !== undefined) {
                const score = Number(analysis.overall.sentiment.score);
                
                if (!isNaN(score)) {
                  totalSentimentScore += score;
                  totalSentimentResponses++;
                  
                  if (score >= 0.2) {
                    positiveResponses++;
                  }
                }
              }
              
              // NEW: Process display percentage if available
              if (analysis.overall.sentiment.displayPercentage !== undefined) {
                const displayPercentage = Number(analysis.overall.sentiment.displayPercentage);
                
                if (!isNaN(displayPercentage)) {
                  totalDisplayPercentage += displayPercentage;
                  displayPercentageCount++;
                }
              }
            }
          } catch (e) {
            console.error('Error processing feedback analysis:', e);
          }
        });
  
        setQuestions(processedQuestions);
        setResponses(responsesData);
        setFormName(formData.name || 'Formulaire sans nom');
        
        // Process text questions
        const textQuestions = processedQuestions.filter(q => q.question_type === 'text');
        
        // Use new method that uses external feedback data
        const textQuestionsStats = processTextQuestionsFromFeedback(
          textQuestions, 
          responsesData, 
          feedbackAnalysisData, 
          formId
        );
        
        setTextQuestionsData(textQuestionsStats.questions);
        
        // NEW: Calculate average display percentage
        const avgDisplayPercentage = displayPercentageCount > 0 
          ? totalDisplayPercentage / displayPercentageCount 
          : 0;
        
        setStats({
          totalFormSubmissions: actualFormSubmissions || totalFormSubmissions,
          totalResponses: responsesData.length,
          unsatisfiedUsers: Array.isArray(lowSatisfactionData) ? lowSatisfactionData.length : 0,
          positiveResponses: positiveResponses,
          totalAnalyzed: totalSentimentResponses,
          averageSentiment: totalSentimentResponses > 0 ? totalSentimentScore / totalSentimentResponses : 0,
          // NEW: Add the average display percentage to stats
          averageDisplayPercentage: avgDisplayPercentage,
          totalSentimentResponses: totalSentimentResponses,
          totalTextResponses: textQuestionsStats.totalResponses,
          averageWords: textQuestionsStats.averageWords
        });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Unable to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    if (formId) {
      fetchData();
    }
  }, [formId, externalFeedbackData]);

  // This is a new function that processes text questions using the external feedback data
  const processTextQuestionsFromFeedback = (textQuestions, responsesData, feedbackData, formId) => {
    console.log("Processing text questions with feedback data");
    console.log("Number of text questions:", textQuestions.length);
    console.log("Number of responses:", responsesData.length);
    console.log("Number of feedback items:", feedbackData.length);
    
    // Create a map of question IDs to feedback data
    const questionFeedbackMap = new Map();
    
    // Group feedback by question ID
    feedbackData.forEach(feedback => {
      if (String(feedback.form_id) === String(formId) && feedback.questionId) {
        if (!questionFeedbackMap.has(String(feedback.questionId))) {
          questionFeedbackMap.set(String(feedback.questionId), []);
        }
        questionFeedbackMap.get(String(feedback.questionId)).push(feedback);
      }
    });
    
    console.log("Question feedback map size:", questionFeedbackMap.size);
    
    let totalResponses = 0;
    let totalWords = 0;
    let totalSentiment = 0;
    let analyzedCount = 0;
    
    const processedQuestions = textQuestions.map(question => {
      console.log(`Processing question ${question.id}: ${question.question_text}`);
      
      let questionResponses = 0;
      let questionWords = 0;
      let questionSentiment = 0;
      let questionSentimentCount = 0;
      
      // First count regular responses
      responsesData.forEach(survey => {
        if (String(survey.form_id) === String(formId) && Array.isArray(survey.responses)) {
          survey.responses.forEach(response => {
            if (String(response.question_id) === String(question.id) && 
                response.answer && 
                response.answer.trim()) {
              
              // Count this as a valid response
              questionResponses++;
              
              // Count words
              const words = response.answer.trim().split(/\s+/).length;
              questionWords += words;
            }
          });
        }
      });
      
      // Now process sentiment from feedback data
      const questionFeedback = questionFeedbackMap.get(String(question.id)) || [];
      console.log(`Found ${questionFeedback.length} feedback items for question ${question.id}`);
      
      // Track raw scores and display percentages separately
      const sentimentScores = [];
      const displayPercentages = [];
      
      questionFeedback.forEach(feedback => {
        if (feedback.analysis && 
            feedback.analysis.overall && 
            feedback.analysis.overall.sentiment) {
          
          // Process raw sentiment score
          if (feedback.analysis.overall.sentiment.score !== undefined) {
            const score = Number(feedback.analysis.overall.sentiment.score);
            
            if (!isNaN(score)) {
              console.log(`Found valid sentiment score: ${score}`);
              questionSentiment += score;
              sentimentScores.push(score);
              questionSentimentCount++;
            }
          }
          
          // Also capture display percentage if available
          if (feedback.analysis.overall.sentiment.displayPercentage !== undefined) {
            const percentage = Number(feedback.analysis.overall.sentiment.displayPercentage);
            
            if (!isNaN(percentage)) {
              console.log(`Found display percentage: ${percentage}%`);
              displayPercentages.push(percentage);
            }
          }
          
          // Count words if we have the original text
          if (feedback.originalText) {
            const feedbackWords = feedback.originalText.trim().split(/\s+/).length;
            // Only add to word count if not already counted in responses
            if (questionFeedback.length > questionResponses) {
              questionWords += feedbackWords;
            }
          }
        }
      });
      
      // If we have feedback but no responses counted yet, use feedback count
      if (questionResponses === 0 && questionFeedback.length > 0) {
        questionResponses = questionFeedback.length;
      }
      
      // Calculate averages for this question
      const avgWords = questionResponses > 0 ? Math.round(questionWords / questionResponses) : 0;
      
      // Calculate more precise sentiment averages
      const avgSentiment = questionSentimentCount > 0 ? (questionSentiment / questionSentimentCount) : 0;
      
      // Calculate average display percentage (if available)
      const avgDisplayPercentage = displayPercentages.length > 0 
        ? displayPercentages.reduce((sum, pct) => sum + pct, 0) / displayPercentages.length 
        : null;
      
      // Determine if the average sentiment is positive or negative
      const isPositive = avgSentiment >= 0;
      
      // Create a more detailed sentiment object
      const sentimentDetails = {
        score: avgSentiment,
        displayPercentage: avgDisplayPercentage,
        isPositive: isPositive,
        rawScores: sentimentScores,
        // Calculate the percentage of positive and negative sentiments
        positiveCount: sentimentScores.filter(score => score >= 0.2).length,
        negativeCount: sentimentScores.filter(score => score <= -0.2).length,
        neutralCount: sentimentScores.filter(score => score > -0.2 && score < 0.2).length
      };
      
      // Log results for this question with more detail
      console.log(`Question ${question.id} final stats:`, {
        responses: questionResponses,
        totalWords: questionWords,
        avgWords: avgWords,
        sentimentTotal: questionSentiment,
        sentimentCount: questionSentimentCount,
        avgSentiment: avgSentiment,
        displayPercentage: avgDisplayPercentage,
        sentimentDetails
      });
      
      // Update totals
      totalResponses += questionResponses;
      totalWords += questionWords;
      totalSentiment += questionSentiment;
      analyzedCount += questionSentimentCount;
      
      return {
        id: question.id,
        text: question.question_text,
        responseCount: questionResponses,
        totalWords: questionWords,
        avgWords: avgWords,
        sentiment: avgSentiment,
        sentimentCount: questionSentimentCount,
        sentimentDetails: sentimentDetails,
        // Include the raw display percentage for more detailed display
        displayPercentage: avgDisplayPercentage
      };
    }).filter(q => q.responseCount > 0); // Only include questions with responses
    
    // Calculate overall averages
    const averageWords = totalResponses > 0 ? Math.round(totalWords / totalResponses) : 0;
    const averageSentiment = analyzedCount > 0 ? (totalSentiment / analyzedCount) : 0;
    
    // Log overall results
    console.log("Overall text analysis results:", {
      processedQuestions: processedQuestions.length,
      totalResponses,
      totalWords,
      averageWords,
      totalSentiment,
      analyzedCount,
      averageSentiment
    });
    
    return {
      questions: processedQuestions,
      totalResponses,
      totalWords,
      averageWords,
      averageSentiment
    };
  };

  
  // Process response data for visualization (charts)
const processResponseData = (questionId) => {
  const question = questions.find(q => q.id === questionId);
  if (!question) return [];

  // For choice questions with options
  if (question.question_type === 'choice' && Array.isArray(question.options)) {
    const counts = {};
    question.options.forEach(option => {
      counts[option] = 0;
    });

    let totalResponses = 0;
    responses.forEach(survey => {
      if (!formId || survey.form_id === formId) {
        const response = survey.responses.find(r => r.question_id === questionId);
        if (response && response.answer && counts.hasOwnProperty(response.answer)) {
          counts[response.answer]++;
          totalResponses++;
        }
      }
    });

    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      percentage: totalResponses > 0 ? (value / totalResponses) : 0
    }));
  }
  
  // For rating questions (stars, numeric)
  if (question.question_type === 'rating' || question.question_type === 'stars' || question.question_type === 'number') {
    const maxValue = question.max_value || 5; // Default to 5 for stars if not specified
    const counts = {};
    
    // Initialize counts for all possible values (1 to maxValue)
    for (let i = 1; i <= maxValue; i++) {
      counts[i] = 0;
    }
    
    let totalResponses = 0;
    let totalScore = 0;
    
    responses.forEach(survey => {
      if (!formId || survey.form_id === formId) {
        const response = survey.responses.find(r => r.question_id === questionId);
        if (response && response.answer) {
          const numericAnswer = parseInt(response.answer, 10);
          if (!isNaN(numericAnswer) && numericAnswer >= 1 && numericAnswer <= maxValue) {
            counts[numericAnswer]++;
            totalResponses++;
            totalScore += numericAnswer;
          }
        }
      }
    });
    
    const averageScore = totalResponses > 0 ? (totalScore / totalResponses).toFixed(1) : 0;
    
    return {
      histogramData: Object.entries(counts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
        percentage: totalResponses > 0 ? (count / totalResponses * 100).toFixed(1) : 0
      })),
      averageScore,
      totalResponses
    };
  }
  
  return [];
}

  // Get chart data for a specific question
  const getChartData = (questionId) => {
    const question = questions.find(q => q.id === questionId);
    const data = processResponseData(questionId);
    
    if (!question) return [];
    
    // For choice questions
    if (question.question_type === 'choice' && Array.isArray(data)) {
      return data.filter(item => item.value > 0);
    }
    
    // For rating questions, data already has the correct format
    return data;
  };

  // Filter questions by type for different visualizations
  const choiceQuestions = questions.filter(q => 
    q.question_type === 'choice' && 
    Array.isArray(q.options) && 
    q.options.length > 0
  );
  
  // Filter rating questions (stars, numeric ratings)
  const ratingQuestions = questions.filter(q => 
    q.question_type === 'rating' || 
    q.question_type === 'stars' || 
    (q.question_type === 'number' && q.max_value > 0)
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  // Calculate statistics
  const positiveRate = stats.totalAnalyzed > 0 
    ? ((stats.positiveResponses / stats.totalAnalyzed) * 100).toFixed(1)
    : '0.0';

  const satisfactionRate = stats.totalResponses > 0 
    ? ((stats.totalResponses - stats.unsatisfiedUsers) / stats.totalResponses * 100).toFixed(1)
    : '0.0';

  const averageSentimentFormatted = stats.averageSentiment.toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {formName ? `Statistiques - ${formName}` : 'Statistiques détaillées'}
          </h1>
          <p className="text-gray-600">Analyse approfondie des réponses</p>
        </div>

        {/* Statistics Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
        <StatCard
          icon={CheckCircle2}
          title="Formulaires soumis"
          value={stats.totalFormSubmissions}
          description="Nombre de soumissions complètes"
          colorClass="bg-blue-600"
        />
        <StatCard
          icon={AlertTriangle}
          title="Utilisateurs insatisfaits"
          value={stats.unsatisfiedUsers}
          description="Nécessitant une attention particulière"
          colorClass="bg-red-500"
        />
        <StatCard
          icon={ThumbsUp}
          title="Réponses textuelles positives"
          value={`${positiveRate}%`}
          description={`${stats.positiveResponses} sur ${stats.totalAnalyzed} analysées`}
          colorClass="bg-green-500"
        />
        <StatCard
          icon={MessageSquare}
          title="Taux de satisfaction"
          value={`${satisfactionRate}%`}
          description="Basé sur les retours clients"
          colorClass="bg-indigo-500"
        />
      </div>
        {/* Survey Completion Analysis Section */}
        {surveyCompletionData && (
          <AbandonmentAnalysisSection 
            completionData={surveyCompletionData}
            formQuestions={questions} 
          />
        )}
        {/* Simplified Text Analysis Section */}
        <SimpleTextAnalysisSection 
          textQuestions={textQuestionsData} 
          stats={{ 
            totalTextResponses: stats.totalTextResponses,
            averageSentiment: stats.averageDisplayPercentage,
            averageWords: stats.averageWords
          }} 
        />

        {/* Pie Charts for Choice Questions */}
        {choiceQuestions.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Questions à choix multiples</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {choiceQuestions.map(question => {
                const chartData = getChartData(question.id);
                if (!chartData || chartData.length === 0) return null;
                
                return (
                  <div key={question.id} 
                      className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h2 className="text-xl font-semibold mb-6">
                      {question.question_text}
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={CustomLabel}
                          labelLine={false}
                          minAngle={10}
                        >
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={COLORS[index % COLORS.length]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value} réponses (${(props.payload.percentage * 100).toFixed(1)}%)`,
                            props.payload.label
                          ]}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          formatter={(value, entry) => entry.payload.label}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Rating Questions (Stars and Numbers) */}
        {ratingQuestions.length > 0 && (
          <>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Questions d'évaluation</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {ratingQuestions.map(question => {
                const data = getChartData(question.id);
                if (!data || !data.histogramData) return null;
                
                return (
                  <RatingHistogram 
                    key={question.id} 
                    question={question} 
                    data={data} 
                    colorScale={question.question_type === 'stars' ? 
                      ['#FFD700', '#FFC107', '#FF9800', '#1E88E5', '#0D47A1'] : 
                      ['#82ca9d', '#4169E1', '#0B3D91']} 
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedSurveyAnalytics;