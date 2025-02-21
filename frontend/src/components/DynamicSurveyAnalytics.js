import React, { useState, useEffect } from 'react';
import { 
    Tooltip, Legend, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';
import { Star, Users, AlertTriangle, BarChart, ThumbsUp, MessageSquare } from 'lucide-react';

const COLORS = ['#0B3D91', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB'];
const RADIAN = Math.PI / 180;
const API_URL = 'https://tetris-forms.azurewebsites.net';

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

const StatCard = ({ icon: Icon, title, value, description, colorClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClass}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-600 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {description && (
                    <p className="text-sm text-gray-500 mt-1">{description}</p>
                )}
            </div>
        </div>
    </div>
);

const DynamicSurveyAnalytics = ({ formId, onBack, onShowAdditional, onShowComments, onShowFeedback, onShowEditForm }) => {
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formName, setFormName] = useState('');
    const [stats, setStats] = useState({
        totalResponses: 0,
        unsatisfiedUsers: 0,
        positiveResponses: 0,
        totalAnalyzed: 0,
        averageSentiment: 0,
        totalSentimentResponses: 0
    });

    const analyzeSentiment = (responses, questions) => {
        let positiveCount = 0;
        let totalAnalyzedResponses = 0;
        let totalSentimentScore = 0;
        let totalSentimentResponses = 0;

        responses.forEach(survey => {
            survey.responses.forEach(response => {
                const question = questions.find(q => q.id === response.question_id);
                if (!question) return;

                if (question.question_type === 'choice' && Array.isArray(question.options) && question.options.length > 0) {
                    // For choice questions, first option is positive
                    if (response.answer === question.options[0]) {
                        positiveCount++;
                    }
                    totalAnalyzedResponses++;
                } else if (question.question_type === 'text' && response.nlp_analysis) {
                    try {
                        const nlpAnalysis = typeof response.nlp_analysis === 'string' 
                            ? JSON.parse(response.nlp_analysis) 
                            : response.nlp_analysis;

                        const sentimentScore = nlpAnalysis?.overall?.sentiment?.score;
                        if (typeof sentimentScore === 'number') {
                            if (sentimentScore >= 0.5) {
                                positiveCount++;
                            }
                            totalSentimentScore += sentimentScore;
                            totalSentimentResponses++;
                            totalAnalyzedResponses++;
                        }
                    } catch (e) {
                        console.error('Error parsing NLP analysis:', e);
                    }
                }
            });
        });

        return {
            positiveResponses: positiveCount,
            totalAnalyzed: totalAnalyzedResponses,
            averageSentiment: totalSentimentResponses > 0 ? totalSentimentScore / totalSentimentResponses : 0,
            totalSentimentResponses
        };
    };

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
    
                const feedbackAnalysisUrl = `${API_URL}/api/feedback/analysis?form_id=${formId}`;
                
                const [questionsRes, responsesRes, formRes, lowSatisfactionRes, feedbackAnalysisRes] = await Promise.all([
                    fetch(questionsUrl, fetchOptions),
                    fetch(responsesUrl, fetchOptions),
                    fetch(formUrl, fetchOptions),
                    fetch(lowSatisfactionUrl, fetchOptions),
                    fetch(feedbackAnalysisUrl, fetchOptions)
                ]);
    
                if (!questionsRes.ok || !responsesRes.ok || !formRes.ok) {
                    throw new Error('Failed to fetch data');
                }
    
                const questionsData = await questionsRes.json();
                const responsesData = await responsesRes.json();
                const formData = await formRes.json();
                const lowSatisfactionData = await lowSatisfactionRes.json();
    
                const processedQuestions = questionsData.map(q => ({
                    ...q,
                    options: Array.isArray(q.options) 
                        ? q.options 
                        : (typeof q.options === 'string' 
                            ? JSON.parse(q.options || '[]') 
                            : [])
                }));

                const feedbackAnalysisData = await feedbackAnalysisRes.json();
                
                // Calculate sentiment statistics from feedback analysis data
                let totalSentimentScore = 0;
                let totalSentimentResponses = 0;
                let positiveResponses = 0;

                feedbackAnalysisData.forEach(feedback => {
                    try {
                        const analysis = feedback.analysis;
                        if (analysis?.overall?.sentiment?.score !== undefined) {
                            const score = analysis.overall.sentiment.score;
                            totalSentimentScore += score;
                            totalSentimentResponses++;
                            if (score >= 0.5) {
                                positiveResponses++;
                            }
                        }
                    } catch (e) {
                        console.error('Error processing feedback analysis:', e);
                    }
                });

                const sentimentStats = {
                    positiveResponses,
                    totalAnalyzed: totalSentimentResponses,
                    averageSentiment: totalSentimentResponses > 0 ? totalSentimentScore / totalSentimentResponses : 0,
                    totalSentimentResponses
                };
    
                setQuestions(processedQuestions);
                setResponses(responsesData);
                setFormName(formData.name || 'Formulaire sans nom');
                setStats({
                    totalResponses: responsesData.length,
                    unsatisfiedUsers: Array.isArray(lowSatisfactionData) ? lowSatisfactionData.length : 0,
                    positiveResponses: sentimentStats.positiveResponses,
                    totalAnalyzed: sentimentStats.totalAnalyzed,
                    averageSentiment: sentimentStats.averageSentiment,
                    totalSentimentResponses: sentimentStats.totalSentimentResponses
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
    }, [formId]);

    const processResponseData = (questionId) => {
        const question = questions.find(q => q.id === questionId);
        if (!question || !Array.isArray(question.options)) return [];

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
    };

    const getChartData = (questionId) => {
        const allData = processResponseData(questionId);
        return allData.filter(item => item.value > 0);
    };

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
                <div className="text-red-500 text-xl">{error}</div>
            </div>
        );
    }

    const choiceQuestions = questions.filter(q => 
        q.question_type === 'choice' && 
        Array.isArray(q.options) && 
        q.options.length > 0
    );

    const positiveRate = stats.totalAnalyzed > 0 
        ? ((stats.positiveResponses / stats.totalAnalyzed) * 100).toFixed(1)
        : '0.0';

    const satisfactionRate = stats.totalResponses > 0 
        ? ((stats.totalResponses - stats.unsatisfiedUsers) / stats.totalResponses * 100).toFixed(1)
        : '0.0';

    const averageSentimentFormatted = stats.averageSentiment.toFixed(2);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {formName ? `Statistiques - ${formName}` : 'Statistiques détaillées'}
                    </h1>
                    <p className="text-gray-600">Analyse approfondie des réponses</p>
                </div>

                {/* Statistics Summary Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
                    <StatCard
                        icon={Users}
                        title="Total des réponses"
                        value={stats.totalResponses}
                        description="Nombre total de participants"
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
                        title="Réponses positives"
                        value={`${positiveRate}%`}
                        description={`${stats.positiveResponses} sur ${stats.totalAnalyzed} réponses`}
                        colorClass="bg-green-500"
                    />
                    <StatCard
                        icon={MessageSquare}
                        title="Taux de satisfaction"
                        value={`${satisfactionRate}%`}
                        description="Basé sur les retours clients"
                        colorClass="bg-indigo-500"
                    />
                    <StatCard
                        icon={BarChart}
                        title="Sentiment moyen"
                        value={averageSentimentFormatted}
                        description={`Basé sur ${stats.totalSentimentResponses} réponses analysées`}
                        colorClass="bg-purple-500"
                    />
                </div>

                {/* Pie Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {choiceQuestions.map(question => {
                        const allData = processResponseData(question.id);
                        const chartData = getChartData(question.id);
                        return (
                            <div key={question.id} 
                                 className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <Star className="w-6 h-6 text-tetris-blue" />
                                    <h2 className="text-xl font-semibold">
                                        {question.question_text}
                                    </h2>
                                </div>
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
                                            payload={allData.map((entry, index) => ({
                                                value: entry.label,
                                                type: 'circle',
                                                color: COLORS[index % COLORS.length],
                                                payload: entry
                                            }))}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default DynamicSurveyAnalytics;