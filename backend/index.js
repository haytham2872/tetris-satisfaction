import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://ettyrceazuldlgdqwegn.supabase.co.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());

// Supabase client initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Start survey route
app.post('/api/start-survey', async (req, res) => {
    try {
        const { name } = req.body;
        const { data, error } = await supabase
            .from('surveys')
            .insert([{ name: name || 'Nouveau survey' }])
            .select()
            .single();

        if (error) throw error;

        res.status(201).json({ id: data.id });
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get low satisfaction responses
app.get('/api/low-satisfaction', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('low_satisfaction_responses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No responses found' });
        }

        const formattedResults = data.map(result => ({
            ...result,
            created_at: new Date(result.created_at).toISOString()
        }));

        res.json(formattedResults);
    } catch (err) {
        console.error('Error fetching low satisfaction responses:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get questions
app.get('/api/questions', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .order('id');

        if (error) throw error;

        const formattedQuestions = data.map(q => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            max_value: q.max_value,
            class: q.class,
            importance: q.importance !== null ? Number(q.importance).toFixed(2) : "0.00",
            options: q.options || []
        }));

        res.json(formattedQuestions);
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ error: 'Error fetching questions', details: err.message });
    }
});

// Update questions
app.post('/api/questions/update', async (req, res) => {
    try {
        const { questions } = req.body;

        const validateImportance = (imp) => {
            let value = parseFloat(imp);
            return !isNaN(value) && value >= 0 && value <= 100 ? value : 0;
        };

        for (const question of questions) {
            const { data: existingQuestion, error: checkError } = await supabase
                .from('questions')
                .select('id')
                .eq('id', question.id)
                .single();

            if (checkError && checkError.code !== 'PGRST116') throw checkError;

            const questionData = {
                question_text: question.question_text,
                question_type: question.question_type,
                max_value: question.max_value,
                class: question.class,
                importance: validateImportance(question.importance),
                options: question.options || null
            };

            const { error } = existingQuestion
                ? await supabase
                    .from('questions')
                    .update(questionData)
                    .eq('id', question.id)
                : await supabase
                    .from('questions')
                    .insert([{ ...questionData, id: question.id }]);

            if (error) throw error;
        }

        res.status(200).json({ message: 'Questions updated successfully' });
    } catch (err) {
        console.error('Error updating questions:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Delete question
app.delete('/api/questions/delete', async (req, res) => {
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Question ID is required' });
        }

        const { error } = await supabase
            .from('questions')
            .delete()
            .eq('id', id);

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Question not found' });
            }
            throw error;
        }

        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log('Connected to Supabase');
});


// Submit responses route
app.post('/api/responses', async (req, res) => {
    try {
        const { survey_id, responses } = req.body;

        if (!survey_id || !Array.isArray(responses) || responses.length === 0) {
            return res.status(400).json({
                error: 'Invalid data. Include survey_id and responses array.'
            });
        }

        const currentDateTime = new Date().toISOString();
        const responsesToInsert = responses.map(item => ({
            survey_id: Number(survey_id),
            question_id: Number(item.question_id),
            answer: item.answer,
            optional_answer: item.optional_answer,
            responded_at: currentDateTime
        }));

        const { error } = await supabase
            .from('responses')
            .insert(responsesToInsert);

        if (error) throw error;

        res.status(200).json({ message: 'Responses recorded successfully' });
    } catch (err) {
        console.error('Error inserting responses:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get analytics data
app.get('/api/analytics/responses', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('responses')
            .select(`
                survey_id,
                question_id,
                answer,
                responded_at
            `)
            .order('survey_id')
            .order('question_id');

        if (error) throw error;

        // Group responses by survey
        const groupedData = data.reduce((acc, row) => {
            if (!acc[row.survey_id]) {
                acc[row.survey_id] = {
                    survey_id: row.survey_id,
                    responses: []
                };
            }
            acc[row.survey_id].responses.push({
                question_id: row.question_id,
                answer: row.answer,
                responded_at: row.responded_at
            });
            return acc;
        }, {});

        res.json(Object.values(groupedData));
    } catch (err) {
        console.error('Error fetching analytics:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get additional analytics
app.get('/api/analytics/additional', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('responses')
            .select(`
                survey_id,
                question_id,
                answer,
                responded_at
            `)
            .in('question_id', [5, 6, 7, 8, 9])
            .order('survey_id')
            .order('question_id');

        if (error) throw error;

        const groupedData = data.reduce((acc, row) => {
            if (!acc[row.survey_id]) {
                acc[row.survey_id] = {
                    survey_id: row.survey_id,
                    responses: []
                };
            }
            acc[row.survey_id].responses.push({
                question_id: row.question_id,
                answer: row.answer,
                responded_at: row.responded_at
            });
            return acc;
        }, {});

        res.json(Object.values(groupedData));
    } catch (err) {
        console.error('Error fetching additional analytics:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get feedback analysis
app.get('/api/feedback/analysis', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('responses')
            .select('id, survey_id, answer, nlp_analysis, responded_at')
            .eq('question_id', 10)
            .not('nlp_analysis', 'is', null)
            .order('responded_at', { ascending: false });

        if (error) throw error;

        const uniqueResponses = data.reduce((acc, current) => {
            if (!acc.some(item => item.survey_id === current.survey_id)) {
                acc.push(current);
            }
            return acc;
        }, []);

        const formattedResult = uniqueResponses.map(row => ({
            id: row.id,
            survey_id: row.survey_id,
            originalText: row.answer || '',
            analysis: row.nlp_analysis,
            timestamp: row.responded_at
        }));

        res.json(formattedResult);
    } catch (err) {
        console.error('Error in feedback analysis:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Update feedback analysis
app.post('/api/feedback/analyze', async (req, res) => {
    try {
        const { survey_id, analysis } = req.body;

        if (!survey_id || !analysis) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        const { error } = await supabase
            .from('responses')
            .update({ nlp_analysis: analysis })
            .eq('survey_id', survey_id)
            .eq('question_id', 10);

        if (error) throw error;

        res.status(200).json({ message: 'Analysis updated successfully' });
    } catch (err) {
        console.error('Error updating analysis:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get sentiment summary
app.get('/api/feedback/sentiment-summary', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('responses')
            .select('nlp_analysis')
            .eq('question_id', 10)
            .not('nlp_analysis', 'is', null);

        if (error) throw error;

        const summary = {
            total_feedback: data.length,
            positive_count: 0,
            neutral_count: 0,
            negative_count: 0,
            avg_sentiment: 0
        };

        let totalSentiment = 0;
        data.forEach(row => {
            const score = row.nlp_analysis?.sentiment?.score || 0;
            totalSentiment += score;

            if (score > 0.2) summary.positive_count++;
            else if (score < -0.2) summary.negative_count++;
            else summary.neutral_count++;
        });

        summary.avg_sentiment = data.length > 0 ? totalSentiment / data.length : 0;

        res.json(summary);
    } catch (err) {
        console.error('Error fetching sentiment summary:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get comments
app.get('/api/comments', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('responses')
            .select('survey_id, question_id, answer, optional_answer')
            .not('optional_answer', 'is', null)
            .neq('optional_answer', '')
            .neq('question_id', 10)
            .order('survey_id')
            .order('question_id');

        if (error) throw error;

        res.json(data);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Store low satisfaction contact details
app.post('/api/low-satisfaction', async (req, res) => {
    try {
        const { id, name, phone, email } = req.body;

        if (!id || !name || !phone || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { error } = await supabase
            .from('low_satisfaction_responses')
            .insert([{
                survey_id: id,
                name,
                phone,
                email
            }]);

        if (error) throw error;

        res.status(201).json({ message: 'Response recorded successfully' });
    } catch (err) {
        console.error('Error storing low satisfaction response:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});