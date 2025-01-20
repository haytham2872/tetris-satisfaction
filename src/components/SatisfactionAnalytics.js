import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  ArrowLeft, ThumbsUp, Star, Zap, Target,
  ArrowRight,
} from 'lucide-react';

const COLORS = ['#0B3D91', '#1E90FF', '#4169E1', '#6495ED', '#87CEEB'];
const RADIAN = Math.PI / 180;

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
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
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const StatCard = ({ icon: Icon, title, value, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        <p className="mt-1 text-gray-600 text-sm">{description}</p>
      </div>
      <div className="bg-blue-50 p-3 rounded-lg">
        <Icon className="w-6 h-6 text-tetris-blue" />
      </div>
    </div>
  </div>
);

const SatisfactionAnalytics = ({ onBack }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    avgRecommendation: 0,
    avgSatisfaction: 0,
    responseRate: 0,
    solutionMatch: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'surveys'));
        const surveyData = querySnapshot.docs.map(doc => doc.data());
        setData(surveyData);
        
        // Calculate summary statistics
        const totalResponses = surveyData.length;
        const avgRec = surveyData.reduce((acc, curr) => {
          const rec = curr.answers.recommendation;
          return acc + (typeof rec === 'number' ? rec : 0);
        }, 0) / totalResponses;
        
        const avgSat = surveyData.reduce((acc, curr) => {
          const sat = curr.answers.satisfaction;
          return acc + (typeof sat === 'number' ? sat : 0);
        }, 0) / totalResponses;
        
        const responseSpeed = processChoiceData('responseSpeed', surveyData);
        const solutions = processChoiceData('solutions', surveyData);
        
        setSummaryStats({
          avgRecommendation: avgRec.toFixed(1),
          avgSatisfaction: avgSat.toFixed(1),
          responseRate: calculatePositivePercentage(responseSpeed, ['Excellent', 'Bon']),
          solutionMatch: calculatePositivePercentage(solutions, ['Toujours', 'Souvent'])
        });
        
        setLoading(false);
      } catch (err) {
        setError('Error fetching data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculatePositivePercentage = (data, positiveResponses) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    const positive = data
      .filter(item => positiveResponses.includes(item.label))
      .reduce((acc, curr) => acc + curr.value, 0);
    return ((positive / total) * 100).toFixed(1);
  };

  const processRecommendationData = () => {
    const counts = Array(11).fill(0);
    data.forEach(survey => {
      if (survey.answers.recommendation >= 0) {
        counts[survey.answers.recommendation]++;
      }
    });
    return counts.map((count, score) => ({
      score: score.toString(),
      count
    }));
  };

  const processSatisfactionData = () => {
    const counts = Array(6).fill(0);
    data.forEach(survey => {
      if (survey.answers.satisfaction > 0) {
        counts[survey.answers.satisfaction]++;
      }
    });
    return counts.map((count, stars) => ({
      stars: stars === 0 ? 'N/A' : `${stars} ★`,
      count
    })).slice(1);
  };

  const processChoiceData = (field, sourceData = data) => {
    const counts = {};
    sourceData.forEach(survey => {
      const answer = survey.answers[field];
      counts[answer] = (counts[answer] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value
    }));
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => onBack()}
            className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors"
          >
            <ArrowLeft size={20} />
            Retour au questionnaire
          </button>
          
          <button
            onClick={() => onBack('additional')}
            className="bg-tetris-blue text-white px-4 py-2 rounded-lg hover:bg-tetris-light transition-colors flex items-center gap-2"
          >
            Statistiques complémentaires
            <ArrowRight size={20} />
          </button>
        </div>

        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Analyse des réponses</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-gray-600">Vue d'ensemble de la satisfaction client</p>
            <span className="bg-tetris-blue text-white px-3 py-1 rounded-full text-sm font-medium">
              {data.length} réponses
            </span>
          </div>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard
            icon={ThumbsUp}
            title="Score de recommandation"
            value={`${summaryStats.avgRecommendation}/10`}
            description="Score moyen de recommandation"
          />
          <StatCard
            icon={Star}
            title="Satisfaction globale"
            value={`${summaryStats.avgSatisfaction}/5`}
            description="Note moyenne de satisfaction"
          />
          <StatCard
            icon={Zap}
            title="Rapidité des réponses"
            value={`${summaryStats.responseRate}%`}
            description="Taux de réponses rapides"
          />
          <StatCard
            icon={Target}
            title="Adéquation solutions"
            value={`${summaryStats.solutionMatch}%`}
            description="Solutions adaptées aux besoins"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recommendation Score (0-10) */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <ThumbsUp className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Distribution des scores de recommandation</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processRecommendationData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="score" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0B3D91">
                  {processRecommendationData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[Math.floor(index/2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Satisfaction Stars (1-5) */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Répartition des niveaux de satisfaction</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processSatisfactionData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="stars" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1E90FF">
                  {processSatisfactionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Response Speed (Pie Chart) */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Rapidité des réponses</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processChoiceData('responseSpeed')}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={CustomLabel}
                >
                  {processChoiceData('responseSpeed').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Solutions Match (Pie Chart) */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Adéquation des solutions</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processChoiceData('solutions')}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={CustomLabel}
                >
                  {processChoiceData('solutions').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatisfactionAnalytics;