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
          id: Number(data.id) // Ensure ID is a number
      };
  } catch (error) {
      console.error('Error starting survey:', error);
      return null;
  }
};

export const submitResponses = async (surveyId, responses) => {
  try {
      const payload = {
          survey_id: Number(surveyId), // Ensure survey_id is a number
          responses: Object.fromEntries(
              Object.entries(responses).map(([key, value]) => [
                  Number(key), // Convert question_id to number
                  value
              ])
          )
      };

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