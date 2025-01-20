export const startSurvey = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/start-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Survey ' + new Date().toISOString() }), // Optionnel
    });
    return await response.json();
  } catch (error) {
    console.error('Erreur lors du démarrage du survey:', error);
    return null;
  }
};

export const submitResponses = async (surveyId, responses) => {
  try {
    const payload = {
      survey_id: surveyId,
      responses: responses,
    };

    const response = await fetch('http://localhost:5000/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error('Erreur réseau :', error);
    return false;
  }
};
