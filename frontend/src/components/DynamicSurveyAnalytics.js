import React, { useState, useEffect } from 'react';
import { 
    Tooltip, Legend, ResponsiveContainer,
    Cell, PieChart, Pie
} from 'recharts';
import { Star } from 'lucide-react';

const COLORS = ['#0B3D91', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB'];
const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
    // Don't render label if the value is 0
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

const DynamicSurveyAnalytics = () => {
    const [questions, setQuestions] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [questionsRes, responsesRes] = await Promise.all([
                    fetch('https://tetris-forms.azurewebsites.net/api/questions'),
                    fetch('https://tetris-forms.azurewebsites.net/api/analytics/responses')
                ]);

                const questionsData = await questionsRes.json();
                const responsesData = await responsesRes.json();

                const processedQuestions = questionsData.map(q => ({
                    ...q,
                    options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
                }));

                setQuestions(processedQuestions);
                setResponses(responsesData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data');
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const processResponseData = (questionId) => {
        const question = questions.find(q => q.id === questionId);
        if (!question || !Array.isArray(question.options)) return [];

        const counts = {};
        question.options.forEach(option => {
            counts[option] = 0;
        });

        let totalResponses = 0;
        responses.forEach(survey => {
            const response = survey.responses.find(r => r.question_id === questionId);
            if (response && response.answer && counts.hasOwnProperty(response.answer)) {
                counts[response.answer]++;
                totalResponses++;
            }
        });

        // Include all options in the data, even those with zero counts
        return Object.entries(counts).map(([label, value]) => ({
            label,
            value,
            percentage: totalResponses > 0 ? (value / totalResponses) : 0
        }));
    };

    const getChartData = (questionId) => {
        const allData = processResponseData(questionId);
        // For the pie chart, only include non-zero values
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

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-12 text-center flex flex-col items-center justify-center">
                    <h1 className="text-3xl font-bold text-gray-900">Statistiques détaillées</h1>
                    <p className="mt-2 text-gray-600">Analyse approfondie des réponses</p>
                </div>

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