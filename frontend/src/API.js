// API.js

export const startSurvey = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/start-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            name: 'Survey ' + new Date().toISOString()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        id: Number(data.id) // On s’assure que l’ID est un nombre
      };
    } catch (error) {
      console.error('Error starting survey:', error);
      return null;
    }
  };
  
// API.js

export const submitResponses = async (surveyId, responses) => {
  /**
   * 'responses' = {
   *   1: { answer: 8, optionalAnswer: 'test 2025' },
   *   2: { answer: 5, optionalAnswer: 'TEST' },
   *   ...
   * }
   */
  try {
    // On construit un **tableau** de réponses :
    // [
    //   { question_id: 1, answer: 8, optional_answer: 'test 2025' },
    //   { question_id: 2, answer: 5, optional_answer: 'TEST' },
    //   ...
    // ]
    const formattedResponses = Object.entries(responses).map(([questionId, data]) => {
      const { answer, optionalAnswer } = data;
      return {
        question_id: Number(questionId),
        answer,
        optional_answer: optionalAnswer || null,
      };
    });

    const payload = {
      survey_id: Number(surveyId),
      responses: formattedResponses
    };

    console.log('Payload envoyé au backend :', payload);

    const response = await fetch('http://localhost:5000/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('Network error:', error);
    return false;
  }
};

  