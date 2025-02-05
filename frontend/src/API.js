// API.js
const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
    console.error('API_URL is not defined! Make sure REACT_APP_API_URL is set in your environment variables.');
}

export const startSurvey = async () => {
    try {
        console.log('Attempting to start survey with URL:', API_URL); // Debug log

        const response = await fetch(`${API_URL}/api/start-survey`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ 
                name: 'Survey ' + new Date().toISOString()
            }),
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        return {
            id: Number(data.id) 
        };
    } catch (error) {
        console.error('Error starting survey:', error);
        console.error('API URL used:', API_URL); // Debug log
        return null;
    }
};

export const submitResponses = async (surveyId, responses) => {
    try {
        if (!surveyId) {
            throw new Error('Survey ID is required');
        }

        const formattedResponses = Object.entries(responses).map(([questionId, data]) => ({
            question_id: Number(questionId),
            answer: data.answer,
            optional_answer: data.optionalAnswer || null,
        }));

        const payload = {
            survey_id: Number(surveyId),
            responses: formattedResponses
        };

        console.log('Sending payload to:', `${API_URL}/api/responses`); // Debug log
        console.log('Payload:', payload);

        const response = await fetch(`${API_URL}/api/responses`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        return true;
    } catch (error) {
        console.error('Network error:', error);
        console.error('API URL used:', API_URL); // Debug log
        return false;
    }
};