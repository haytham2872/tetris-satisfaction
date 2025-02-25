import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Clock, Download, MessageSquare, Star, AlignLeft, ListFilter, BarChart } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_URL = 'https://tetris-forms.azurewebsites.net';

const ContactDetailsView = ({ formId, onBack }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formInfo, setFormInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [surveyResponses, setSurveyResponses] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Build URL with formId if present
        const contactsUrl = formId
          ? `${API_URL}/api/low-satisfaction?form_id=${formId}`
          : `${API_URL}/api/low-satisfaction`;

        const promises = [fetch(contactsUrl)];

        // Get form information if formId exists
        if (formId) {
          promises.push(fetch(`${API_URL}/api/forms/${formId}`));
          // Also fetch questions for this form to understand the response data
          promises.push(fetch(`${API_URL}/api/forms/${formId}/questions`));
        }

        const responses = await Promise.all(promises);

        if (!responses.every(response => response.ok)) {
          throw new Error('Failed to fetch data');
        }

        const resultsData = await Promise.all(
          responses.map(response => response.json())
        );

        const contactsData = resultsData[0];
        console.log('Contacts data received:', contactsData);

        let formData = null;
        let questionsData = [];

        if (formId) {
          formData = resultsData[1];
          questionsData = resultsData[2];
          setQuestions(questionsData);
        }

        setContacts(contactsData);
        if (formData) {
          setFormInfo(formData);
        }

        // Fetch survey responses for each contact that has a survey_id
        const surveyIds = contactsData
          .filter(contact => contact.survey_id)
          .map(contact => contact.survey_id);

        if (surveyIds.length > 0) {
          await fetchSurveyResponses(surveyIds, formId);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  // Function to fetch survey responses by survey IDs
  const fetchSurveyResponses = async (surveyIds, formId) => {
    try {
      const uniqueSurveyIds = [...new Set(surveyIds)];
      const responsesData = {};

      for (const surveyId of uniqueSurveyIds) {
        const response = await fetch(
          `${API_URL}/api/analytics/responses?form_id=${formId}&survey_id=${surveyId}`
        );
        if (response.ok) {
          const data = await response.json();
          responsesData[surveyId] = data;
        }
      }

      setSurveyResponses(responsesData);
      console.log('Survey responses fetched:', responsesData);
    } catch (error) {
      console.error('Error fetching survey responses:', error);
    }
  };

  // Helper function to get question text
  const getQuestionText = (questionId) => {
    // Try to find the question by exact ID match first (string comparison)
    const question = questions.find(q => q.id.toString() === questionId.toString());
    return question ? question.question_text : `Question ${questionId}`;
  };

  // Replace the getQuestionType function with this updated version
  const getQuestionType = (questionId) => {
    // Try to find the question by exact ID match first (string comparison)
    const question = questions.find(q => q.id.toString() === questionId.toString());
    return question ? question.question_type : 'Unknown';
  };

  // Get type label and icon for the question type
  const getTypeInfo = (questionType) => {
    switch (questionType.toLowerCase()) {
      case 'text':
        return {
          label: 'Texte',
          icon: <AlignLeft size={14} className="mr-1" />
        };
      case 'number':
      case 'rating':
        return {
          label: 'Rating',
          icon: <BarChart size={14} className="mr-1" />
        };
      case 'stars':
        return {
          label: 'Étoiles',
          icon: <Star size={14} className="mr-1" />
        };
      case 'choice':
        return {
          label: 'Choix',
          icon: <ListFilter size={14} className="mr-1" />
        };
      default:
        return {
          label: questionType,
          icon: null
        };
    }
  };

  // Helper function to render response based on question type
  const renderResponse = (questionType, answer) => {
    const type = questionType.toLowerCase();

    switch (type) {
      case 'text':
        return <p className="text-gray-700">{answer || '-'}</p>;
      case 'number':
      case 'rating':
        return (
          <div className="flex items-center">
            <div className="bg-blue-100 text-tetris-blue px-3 py-1 rounded font-medium">
              {answer || '-'}
            </div>
          </div>
        );
      case 'stars':
        return <RatingStars rating={parseInt(answer, 10)} />;
      case 'choice':
        return <p className="text-gray-700 font-medium">{answer || '-'}</p>;
      default:
        return <p className="text-gray-700">{answer || '-'}</p>;
    }
  };

  // Star rating component without maximum limit
  const RatingStars = ({ rating }) => {
    // Dynamic number of stars based on the rating value
    const starsToShow = Math.max(rating, 5); // Show at least 5 stars for visual consistency

    return (
      <div className="flex items-center mt-1">
        {[...Array(starsToShow)].map((_, i) => (
          <Star
            key={i}
            size={18}
            className={i < rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
            }
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  // Helper function to extract responses from contact object
  const getResponsesFromContact = (contact) => {
    if (contact.survey_id && surveyResponses[contact.survey_id]) {
      const surveyResponse = surveyResponses[contact.survey_id].find(
        response => response.survey_id === contact.survey_id
      );
      return surveyResponse ? surveyResponse.responses : [];
    }

    if (contact.responses) {
      return Array.isArray(contact.responses) ? contact.responses : [];
    }

    if (contact.survey_responses) {
      return Array.isArray(contact.survey_responses) ? contact.survey_responses : [];
    }

    if (contact.negative_responses) {
      return Array.isArray(contact.negative_responses) ? contact.negative_responses : [];
    }

    const possibleResponses = [];
    for (const key in contact) {
      if (key.startsWith('question_') || key.match(/^q\d+$/i)) {
        possibleResponses.push({
          question_id: key.replace(/^question_|^q/i, ''),
          answer: contact[key]
        });
      }
    }

    if (possibleResponses.length > 0) {
      return possibleResponses;
    }

    return [];
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(contacts.map(contact => {
      const responses = getResponsesFromContact(contact);

      const formattedResponses = responses.length > 0
        ? responses
          .map(resp => {
            const questionId = resp.question_id;
            const questionText = getQuestionText(questionId);
            const questionType = getQuestionType(questionId);

            // Find the sequential question number (index + 1)
            const questionNumber = questions.findIndex(q => q.id.toString() === questionId.toString()) + 1;

            return `Q${questionNumber} [${questionType}]: ${questionText} - A: ${resp.answer || resp.response || '-'}`;
          })
          .join('\n')
        : '-';

      return {
        'ID Formulaire': contact.form_id,
        'Formulaire': formInfo?.name || `-`,
        'Nom': contact.name,
        'Téléphone': contact.phone,
        'Email': contact.email,
        'Commentaire': contact.commentaire || '-',
        'Réponses': formattedResponses,
        'Date': new Date(contact.created_at).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    }));

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    XLSX.writeFile(workbook, `contacts${formId ? `_${formInfo?.name || formId}` : ''}.xlsx`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-tetris-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mt-6">
              Contacts à Suivre
              {formInfo && (
                <span className="ml-2 text-lg font-normal text-gray-600">
                  | {formInfo.name}
                </span>
              )}
            </h1>
            <p className="mt-2 text-gray-600">
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} à suivre
              {formInfo && ' pour ce formulaire'}
            </p>
          </div>

          <div className="flex gap-4">
            {contacts.length > 0 && (
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 px-4 py-2 bg-tetris-blue text-white rounded-lg hover:bg-tetris-light transition-colors"
              >
                <Download size={20} />
                Télécharger Excel
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {contacts.map((contact) => {
            const allResponses = getResponsesFromContact(contact);

            return (
              <div
                key={contact.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl"
              >
                {/* Contact Information Header */}
                <div className="grid md:grid-cols-4 gap-6 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <User className="w-6 h-6 text-tetris-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nom</p>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Phone className="w-6 h-6 text-tetris-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium text-gray-900">{contact.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Mail className="w-6 h-6 text-tetris-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{contact.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <Clock className="w-6 h-6 text-tetris-blue" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(contact.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display all survey responses */}
                {allResponses.length > 0 && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-tetris-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Réponses</p>
                        <div className="space-y-4">
                          {allResponses.map((response, index) => {
                            const questionId = response.question_id;
                            const questionText = getQuestionText(questionId);
                            const questionType = getQuestionType(questionId);
                            const answer = response.answer || response.response || '-';
                            const typeInfo = getTypeInfo(questionType);

                            return (
                              <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-medium text-gray-700 flex items-center">
                                    <span className="bg-tetris-blue text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2">
                                      {questions.findIndex(q => q.id.toString() === questionId.toString()) + 1}
                                    </span>
                                    {questionText}
                                  </p>
                                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full flex items-center">
                                    {typeInfo.icon}
                                    {typeInfo.label}
                                  </span>
                                </div>
                                <div className="ml-8">
                                  {renderResponse(questionType, answer)}
                                </div>
                                {response.optional_answer && (
                                  <p className="text-sm italic text-gray-600 mt-2 ml-8 bg-gray-100 p-2 rounded">
                                    Détail: {response.optional_answer}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show when no responses are available */}
                {allResponses.length === 0 && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-tetris-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Réponses</p>
                        <div className="bg-gray-50 p-3 rounded-lg text-gray-500 italic">
                          Aucune réponse disponible pour ce contact.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments section */}
                {contact.commentaire && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <MessageSquare className="w-6 h-6 text-tetris-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Commentaire</p>
                        <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-100">
                          {contact.commentaire}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {contacts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                Aucun contact à suivre
              </h3>
              <p className="text-gray-500 mt-2">
                {formInfo
                  ? "Aucun contact à suivre pour ce formulaire."
                  : "Les contacts apparaîtront ici lorsque des utilisateurs nécessiteront une attention particulière."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsView;