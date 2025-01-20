import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell,
} from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowLeft, TrendingUp, Clock, MessageSquare, CreditCard, Info } from 'lucide-react';

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

const AdditionalAnalytics = ({ onBack }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryStats, setSummaryStats] = useState({
    avgClarity: 0,
    processScore: 0,
    deadlinePercent: 0,
    supportScore: 0,
    pricingScore: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'surveys'));
        const surveyData = querySnapshot.docs.map(doc => doc.data());
        setData(surveyData);
        
        // Calculate summary statistics
        const clarity = processChoiceData('clarity', surveyData);
        const process = processChoiceData('submissionProcess', surveyData);
        const deadlines = processChoiceData('deadlines', surveyData);
        const support = processChoiceData('support', surveyData);
        const pricing = processChoiceData('pricing', surveyData);
        
        setSummaryStats({
          avgClarity: calculatePositivePercentage(clarity, ['Très clair', 'Clair']),
          processScore: calculatePositivePercentage(process, ['Oui, très simple', 'Plutôt simple']),
          deadlinePercent: calculatePositivePercentage(deadlines, ['Toujours', 'Souvent']),
          supportScore: calculatePositivePercentage(support, ['Excellent', 'Bon']),
          pricingScore: calculatePositivePercentage(pricing, ['Très compétitive', 'Assez compétitive'])
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
            onClick={onBack}
            className="flex items-center gap-2 text-tetris-blue hover:text-tetris-light transition-colors"
          >
            <ArrowLeft size={20} />
            Retour aux statistiques principales
          </button>
        </div>

        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Statistiques complémentaires</h1>
          <p className="mt-2 text-gray-600">Analyse détaillée des processus et services</p>
        </div>

        {/* Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <StatCard
            icon={Info}
            title="Clarté des Informations"
            value={`${summaryStats.avgClarity}%`}
            description="Taux de satisfaction sur la clarté"
          />
          <StatCard
            icon={TrendingUp}
            title="Simplicité du Processus"
            value={`${summaryStats.processScore}%`}
            description="Trouvent le processus simple"
          />
          <StatCard
            icon={Clock}
            title="Respect des Délais"
            value={`${summaryStats.deadlinePercent}%`}
            description="Délais respectés"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Information Clarity */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Clarté des informations</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processChoiceData('clarity')}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={CustomLabel}
                >
                  {processChoiceData('clarity').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Submission Process */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Simplicité du processus</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processChoiceData('submissionProcess')}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={CustomLabel}
                >
                  {processChoiceData('submissionProcess').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Deadlines */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Respect des délais</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processChoiceData('deadlines')}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={CustomLabel}
                >
                  {processChoiceData('deadlines').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Technical Support */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Support technique</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processChoiceData('support')}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={CustomLabel}
                >
                  {processChoiceData('support').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Pricing */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 col-span-full">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-tetris-blue" />
              <h2 className="text-xl font-semibold">Tarification</h2>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={processChoiceData('pricing')}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0B3D91">
                  {processChoiceData('pricing').map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalAnalytics;