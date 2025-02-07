// API.js
const API_URL = 'https://tetris-forms.azurewebsites.net';

if (!API_URL) {
    console.error('API_URL is not defined! Make sure REACT_APP_API_URL is set in your environment variables.');
}

export const startSurvey = async () => {
    try {
        console.log('Attempting to start survey with URL:', API_URL);

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
        console.error('API URL used:', API_URL);
        return null;
    }
};

export const submitResponses = async (surveyId, responses, negativeScore) => {
    try {
        if (!surveyId) {
            throw new Error('Survey ID is required');
        }

        console.log('[submitResponses] Starting submission, surveyId=', surveyId, 'negativeScore=', negativeScore);

        const formattedResponses = Object.entries(responses).map(([questionId, data]) => ({
            question_id: Number(questionId),
            answer: data.answer,
            optional_answer: data.optionalAnswer || null,
        }));

        const payload = {
            survey_id: Number(surveyId),
            responses: formattedResponses
        };

        // Include negativeScore only if it's defined
        if (typeof negativeScore !== 'undefined') {
            payload.negativeScore = negativeScore;
            console.log('[submitResponses] Including negativeScore:', negativeScore);
        }

        console.log('Sending payload to:', `${API_URL}/api/responses`);
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
            console.error('[submitResponses] HTTP error, status=', response.status, 'message=', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        console.log('[submitResponses] Submission successful');
        return true;
    } catch (error) {
        console.error('[submitResponses] Network error:', error);
        console.error('API URL used:', API_URL);
        return false;
    }
};