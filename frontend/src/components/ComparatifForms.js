import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Filter, Download, Loader } from 'lucide-react';
import * as XLSX from 'xlsx';

// Constante pour l'URL de l'API
const API_URL = process.env.REACT_APP_API_URL;

// Composant avec informations complètes
const ComparatifForms = ({ onBack, availableForms }) => {
  const [formData, setFormData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterValue, setFilterValue] = useState('');

  useEffect(() => {
    const fetchFormDetails = async () => {
      try {
        setIsLoading(true);

        if (!availableForms || availableForms.length === 0) {
          // Si aucun formulaire disponible, utiliser des données fictives
          setMockData();
          return;
        }

        // Pour chaque formulaire, récupérer les données détaillées
        const formDetailsPromises = availableForms.map(async (form) => {
          try {
            // 1. Récupérer les questions pour chaque formulaire
            const questionsResponse = await fetch(`${API_URL}/api/forms/${form.id}/questions`);
            const questions = await questionsResponse.json();
            
            // 2. Récupérer les réponses pour chaque formulaire
            const responsesResponse = await fetch(`${API_URL}/api/analytics/responses?form_id=${form.id}`);
            const responses = await responsesResponse.json();
            
            // 3. Récupérer les clients insatisfaits
            let unsatisfied = [];
            try {
              const unsatisfiedResponse = await fetch(`${API_URL}/api/low-satisfaction?form_id=${form.id}`);
              if (unsatisfiedResponse.ok) {
                unsatisfied = await unsatisfiedResponse.json();
              } else if (unsatisfiedResponse.status === 404) {
                // C'est normal si aucune réponse d'insatisfaction n'est trouvée
                unsatisfied = []; // Tableau vide explicite
              } else {
                unsatisfied = [];
              }
            } catch (error) {
              unsatisfied = [];
            }
            // 4. Récupérer les analyses de feedback
            const feedbackResponse = await fetch(`${API_URL}/api/feedback/analysis?form_id=${form.id}`);
            const feedbackData = feedbackResponse.ok ? await feedbackResponse.json() : [];
            
            // 5. Récupérer les données de complétion et d'abandon
            const surveyCompletionResponse = await fetch(`${API_URL}/api/analytics/survey-completion?form_id=${form.id}`);
            const surveyCompletionData = surveyCompletionResponse.ok ? await surveyCompletionResponse.json() : null;
            
            // Extraire les statistiques de complétion et d'abandon
            let completedCount = 0;
            let abandonedCount = 0;
            let completionRate = 0;
            
            if (surveyCompletionData && surveyCompletionData.status_breakdown) {
              const statusBreakdown = surveyCompletionData.status_breakdown;
              const completedItem = statusBreakdown.find(item => item.status === 'completed');
              const abandonedItem = statusBreakdown.find(item => item.status === 'abandoned');
              
              completedCount = completedItem ? parseInt(completedItem.count) : 0;
              abandonedCount = abandonedItem ? parseInt(abandonedItem.count) : 0;
              
              // Calculer le taux de complétion
              const totalAttempts = statusBreakdown.reduce((sum, item) => sum + parseInt(item.count || 0), 0);
              completionRate = totalAttempts > 0 ? (completedCount / totalAttempts * 100) : 0;
            }
            
            // Calculer les statistiques
            const totalResponses = responses.length;
            const unsatisfiedCount = Array.isArray(unsatisfied) ? unsatisfied.length : 0;
            
            // Calculer les statistiques de sentiment
            let positiveResponses = 0;
            let totalSentimentResponses = 0;
            let totalSentimentScore = 0;
            
            // Tracker les displayPercentages
            let totalDisplayPercentage = 0;
            let displayPercentageCount = 0;
            
            feedbackData.forEach(feedback => {
              try {
                const analysis = feedback.analysis;
                if (analysis?.overall?.sentiment) {
                  // Traiter le score brut
                  if (analysis.overall.sentiment.score !== undefined) {
                    const score = Number(analysis.overall.sentiment.score);
                    totalSentimentScore += score;
                    totalSentimentResponses++;
                    if (score >= 0.5) {
                      positiveResponses++;
                    }
                  }
                  
                  // Extraire le displayPercentage si disponible
                  if (analysis.overall.sentiment.displayPercentage !== undefined) {
                    const displayPercentage = Number(analysis.overall.sentiment.displayPercentage);
                    if (!isNaN(displayPercentage)) {
                      totalDisplayPercentage += displayPercentage;
                      displayPercentageCount++;
                    }
                  }
                }
              } catch (e) {
                // Ignorer les erreurs de traitement
              }
            });
            
            const averageSentiment = totalSentimentResponses > 0 ? totalSentimentScore / totalSentimentResponses : 0;
            const positiveRate = totalSentimentResponses > 0 ? ((positiveResponses / totalSentimentResponses) * 100) : 0;
            const satisfactionRate = totalResponses > 0 ? ((totalResponses - unsatisfiedCount) / totalResponses * 100) : 0;
            
            // Calculer le displayPercentage moyen
            const averageDisplayPercentage = displayPercentageCount > 0 ? 
              (totalDisplayPercentage / displayPercentageCount) : 0;
            
            return {
              id: form.id,
              name: form.name || 'Sans nom',
              description: form.description || '',
              questionCount: questions.length,
              submissions: totalResponses,
              unsatisfiedCount: unsatisfiedCount,
              positiveResponses: positiveResponses,
              totalSentimentResponses: totalSentimentResponses,
              positiveRate: positiveRate.toFixed(1),
              satisfactionRate: satisfactionRate.toFixed(1),
              averageSentiment: averageSentiment.toFixed(2),
              averageDisplayPercentage: averageDisplayPercentage.toFixed(1),
              completedCount: completedCount,
              abandonedCount: abandonedCount,
              completionRate: completionRate.toFixed(1),
              lastUpdated: form.updated_at || form.created_at || new Date()
            };
          } catch (error) {
            // En cas d'erreur, retourner le formulaire avec des statistiques par défaut
            return {
              id: form.id,
              name: form.name || 'Sans nom',
              description: form.description || '',
              questionCount: 0,
              submissions: 0,
              unsatisfiedCount: 0,
              positiveResponses: 0,
              totalSentimentResponses: 0,
              positiveRate: '0.0',
              satisfactionRate: '0.0',
              averageSentiment: '0.00',
              averageDisplayPercentage: '0.0',
              completedCount: 0,
              abandonedCount: 0,
              completionRate: '0.0',
              lastUpdated: form.updated_at || form.created_at || new Date()
            };
          }
        });
        
        // Attendre que toutes les requêtes soient terminées
        const detailedForms = await Promise.all(formDetailsPromises);
        setFormData(detailedForms);
      } catch (error) {
        setMockData();
      } finally {
        setIsLoading(false);
      }
    };
    
    const setMockData = () => {
      // Données fictives en cas d'erreur ou d'absence de formulaires
      const mockData = [
        { 
          id: 1, 
          name: 'Formulaire de satisfaction client', 
          description: 'Évaluation des clients', 
          questionCount: 12, 
          submissions: 78, 
          unsatisfiedCount: 5,
          positiveResponses: 52,
          totalSentimentResponses: 68,
          positiveRate: '76.5',
          satisfactionRate: '93.6',
          averageSentiment: '0.82',
          averageDisplayPercentage: '78.0',
          completedCount: 65,
          abandonedCount: 13,
          completionRate: '83.3',
          lastUpdated: new Date() 
        },
        { 
          id: 2, 
          name: 'Évaluation des services', 
          description: 'Qualité de service', 
          questionCount: 8, 
          submissions: 45, 
          unsatisfiedCount: 8,
          positiveResponses: 24,
          totalSentimentResponses: 35,
          positiveRate: '68.6',
          satisfactionRate: '82.2',
          averageSentiment: '0.65',
          averageDisplayPercentage: '65.0',
          completedCount: 37,
          abandonedCount: 15,
          completionRate: '71.2',
          lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) 
        },
        { 
          id: 3, 
          name: 'Feedback produit', 
          description: 'Avis sur produits', 
          questionCount: 15, 
          submissions: 120, 
          unsatisfiedCount: 12,
          positiveResponses: 80,
          totalSentimentResponses: 95,
          positiveRate: '84.2',
          satisfactionRate: '90.0',
          averageSentiment: '0.78',
          averageDisplayPercentage: '73.0',
          completedCount: 108,
          abandonedCount: 22,
          completionRate: '83.1',
          lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) 
        }
      ];
      setFormData(mockData);
    };
    
    // Simuler un délai pour montrer le chargement
    const timer = setTimeout(() => {
      fetchFormDetails();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [availableForms]);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR');
    } catch (error) {
      return 'Date invalide';
    }
  };

  const sortedData = [...formData].sort((a, b) => {
    if (sortField === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortField === 'lastUpdated') {
      const dateA = new Date(a.lastUpdated || 0);
      const dateB = new Date(b.lastUpdated || 0);
      return sortDirection === 'asc' 
        ? dateA - dateB
        : dateB - dateA;
    } else if (['positiveRate', 'satisfactionRate', 'averageSentiment', 'averageDisplayPercentage', 'completionRate'].includes(sortField)) {
      const valA = parseFloat(a[sortField] || 0);
      const valB = parseFloat(b[sortField] || 0);
      return sortDirection === 'asc'
        ? valA - valB
        : valB - valA;
    } else {
      return sortDirection === 'asc'
        ? a[sortField] - b[sortField]
        : b[sortField] - a[sortField];
    }
  });

  const filteredData = sortedData.filter(form => 
    form.name.toLowerCase().includes(filterValue.toLowerCase())
  );

  const handleExportExcel = () => {
    // Créer les en-têtes du fichier Excel
    const headers = [
      'Nom du formulaire', 
      'Nombre de questions', 
      'Nombre de réponses',
      'Clients insatisfaits',
      'Réponses positives',
      'Taux de réponses positives (%)',
      'Taux de satisfaction (%)',
      'Sentiment moyen (%)',
      'Formulaires complétés',
      'Formulaires abandonnés',
      'Taux de complétion (%)',
      'Dernière mise à jour'
    ];
    
    // Transformer les données pour Excel
    const excelData = [
      headers,
      ...filteredData.map(form => [
        form.name,
        form.questionCount,
        form.submissions,
        form.unsatisfiedCount,
        form.positiveResponses,
        parseFloat(form.positiveRate.replace(',', '.')),
        parseFloat(form.satisfactionRate.replace(',', '.')),
        parseFloat(form.averageDisplayPercentage.replace(',', '.')),
        form.completedCount,
        form.abandonedCount,
        parseFloat(form.completionRate.replace(',', '.')),
        formatDate(form.lastUpdated)
      ])
    ];
    
    // Créer une nouvelle feuille de calcul
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Définir les largeurs de colonnes
    const columnWidths = [
      { wch: 30 }, // Nom du formulaire
      { wch: 10 }, // Nombre de questions
      { wch: 10 }, // Nombre de réponses
      { wch: 10 }, // Clients insatisfaits
      { wch: 10 }, // Réponses positives
      { wch: 15 }, // Taux de réponses positives
      { wch: 15 }, // Taux de satisfaction
      { wch: 15 }, // Sentiment moyen (%)
      { wch: 15 }, // Formulaires complétés
      { wch: 15 }, // Formulaires abandonnés
      { wch: 15 }, // Taux de complétion (%)
      { wch: 15 }  // Dernière mise à jour
    ];
    worksheet['!cols'] = columnWidths;
    
    // Créer un nouveau classeur
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Comparaison Formulaires");
    
    // Créer un nom de fichier avec la date et l'heure actuelles
    const today = new Date();
    const date = today.toISOString().split('T')[0]; // Format YYYY-MM-DD
    const hours = today.getHours().toString().padStart(2, '0');
    const minutes = today.getMinutes().toString().padStart(2, '0');
    const seconds = today.getSeconds().toString().padStart(2, '0');
    const time = `${hours}h${minutes}m${seconds}`;
    const fileName = `Comparaison_formulaires_${date}_${time}.xlsx`;
    
    // Générer et télécharger le fichier Excel
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-3xl font-bold text-tetris-blue mb-8">Tableau Comparatif des Formulaires</h2>
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="relative w-full md:w-1/3 mb-4 md:mb-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Filtrer par nom..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-tetris-blue focus:border-tetris-blue"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
          
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-tetris-blue text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={isLoading || filteredData.length === 0}
          >
            <Download className="h-5 w-5" />
            Exporter Excel
          </button>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader className="animate-spin h-10 w-10 text-tetris-blue mb-4" />
              <p className="text-gray-600">Chargement des données des formulaires...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Nom du formulaire
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('questionCount')}
                  >
                    <div className="flex items-center gap-2">
                      Nb Questions
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('submissions')}
                  >
                    <div className="flex items-center gap-2">
                      Réponses
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('unsatisfiedCount')}
                  >
                    <div className="flex items-center gap-2">
                      Insatisfaits
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('completedCount')}
                  >
                    <div className="flex items-center gap-2">
                      Complétés
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('abandonedCount')}
                  >
                    <div className="flex items-center gap-2">
                      Abandonnés
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('completionRate')}
                  >
                    <div className="flex items-center gap-2">
                      Taux Complétion
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('positiveRate')}
                  >
                    <div className="flex items-center gap-2">
                      Taux Positif
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('satisfactionRate')}
                  >
                    <div className="flex items-center gap-2">
                      Satisfaction
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('averageDisplayPercentage')}
                  >
                    <div className="flex items-center gap-2">
                      Sentiment
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('lastUpdated')}
                  >
                    <div className="flex items-center gap-2">
                      Mis à jour
                      <ArrowUpDown className="h-4 w-4" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length > 0 ? (
                  filteredData.map((form) => (
                    <tr key={form.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{form.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-500">{form.questionCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-500">{form.submissions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-500">{form.unsatisfiedCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-green-600 font-medium">{form.completedCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-red-600 font-medium">{form.abandonedCount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-purple-600 h-2.5 rounded-full" 
                            style={{ width: `${form.completionRate}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{form.completionRate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-500">{form.positiveRate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-tetris-blue h-2.5 rounded-full" 
                            style={{ width: `${form.satisfactionRate}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{form.satisfactionRate}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`text-sm ${
                          parseFloat(form.averageDisplayPercentage) > 70 ? 'text-green-600' : 
                          parseFloat(form.averageDisplayPercentage) < 30 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {form.averageDisplayPercentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(form.lastUpdated)}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="px-6 py-4 text-center text-sm text-gray-500">
                      Aucun formulaire ne correspond à votre recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComparatifForms;