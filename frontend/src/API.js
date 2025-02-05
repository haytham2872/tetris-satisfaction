// API.js
const API_URL = process.env.REACT_APP_API_URL;

export const startSurvey = async () => {
    try {
        const response = await fetch(`${API_URL}/api/start-survey`, {
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
            id: Number(data.id) 
        };
    } catch (error) {
        console.error('Error starting survey:', error);
        return null;
    }
};

export const submitResponses = async (surveyId, responses) => {
    try {
        const formattedResponses = Object.entries(responses).map(([questionId, data]) => ({
            question_id: Number(questionId),
            answer: data.answer,
            optional_answer: data.optionalAnswer || null,
        }));

        const payload = {
            survey_id: Number(surveyId),
            responses: formattedResponses
        };

        console.log('Payload sent to backend:', payload);

        const response = await fetch(`${API_URL}/api/responses`, {
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