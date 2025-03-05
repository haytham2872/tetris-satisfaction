const API_URL = process.env.REACT_APP_API_URL;

// Function to transform database questions to the format needed by components
const transformDatabaseQuestion = (dbQuestion) => ({
  id: dbQuestion.id,
  text: dbQuestion.question_text,
  type: dbQuestion.question_type,
  max: dbQuestion.max_value,
  options: dbQuestion.options,
  importance: dbQuestion.importance
});

// Function to fetch and format questions
export const fetchQuestions = async (formId) => {
  try {
    // Utilisation de l'ID du formulaire dans l'URL
    const response = await fetch(`${API_URL}/api/forms/${formId}/questions`);
    if (!response.ok) throw new Error(`Failed to fetch questions for form ${formId}`);
    const data = await response.json();
    return data.map(transformDatabaseQuestion);
  } catch (error) {
    console.error('Error fetching questions:', error);
    // Retourner un tableau vide en cas d'erreur pour éviter les erreurs undefined
    return [];
  }
};