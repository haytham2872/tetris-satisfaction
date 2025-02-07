// index.js
import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware with cors allowing all origins
app.use(cors());
app.use(express.json());

// Database connection pool
let pool;
const connectToDatabase = async () => {
    try {
        pool = await sql.connect(config);
        console.log('Connected to Azure SQL Database');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
};
// Test connection endpoint
app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.request().query('SELECT 1 as testValue');
        res.json({ 
            success: true, 
            message: 'Database connection successful',
            data: result.recordset 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// Start survey route
app.post('/api/start-survey', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await pool.request()
            .input('name', sql.NVarChar, name || 'Nouveau survey')
            .query`
                INSERT INTO surveys (name)
                OUTPUT INSERTED.id
                VALUES (@name)
            `;
        res.status(201).json({ id: result.recordset[0].id });
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
// Get analytics data
app.get('/api/analytics/responses', async (req, res) => {
    try {
        const result = await pool.request().query`
            SELECT survey_id, question_id, answer, responded_at
            FROM responses
            ORDER BY survey_id, question_id
        `;

        const groupedData = result.recordset.reduce((acc, row) => {
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
        const result = await pool.request().query`
            SELECT survey_id, question_id, answer, responded_at
            FROM responses
            WHERE question_id IN (5, 6, 7, 8, 9)
            ORDER BY survey_id, question_id
        `;

        const groupedData = result.recordset.reduce((acc, row) => {
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
        const result = await pool.request().query`
            SELECT id, survey_id, answer, nlp_analysis, responded_at
            FROM responses
            WHERE question_id = 10
            AND nlp_analysis IS NOT NULL
            ORDER BY responded_at DESC
        `;

        const uniqueResponses = result.recordset.reduce((acc, current) => {
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

        const result = await pool.request()
            .input('surveyId', sql.Int, survey_id)
            .input('analysis', sql.NVarChar, JSON.stringify(analysis))
            .query`
                UPDATE responses
                SET nlp_analysis = @analysis
                WHERE survey_id = @surveyId
                AND question_id = 10
            `;

        res.status(200).json({ message: 'Analysis updated successfully' });
    } catch (err) {
        console.error('Error updating analysis:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get sentiment summary
app.get('/api/feedback/sentiment-summary', async (req, res) => {
    try {
        const result = await pool.request().query`
            SELECT nlp_analysis
            FROM responses
            WHERE question_id = 10
            AND nlp_analysis IS NOT NULL
        `;

        const summary = {
            total_feedback: result.recordset.length,
            positive_count: 0,
            neutral_count: 0,
            negative_count: 0,
            avg_sentiment: 0
        };

        let totalSentiment = 0;
        result.recordset.forEach(row => {
            const analysis = typeof row.nlp_analysis === 'string' ? 
                JSON.parse(row.nlp_analysis) : row.nlp_analysis;
            const score = analysis?.sentiment?.score || 0;
            totalSentiment += score;

            if (score > 0.2) summary.positive_count++;
            else if (score < -0.2) summary.negative_count++;
            else summary.neutral_count++;
        });

        summary.avg_sentiment = result.recordset.length > 0 ? 
            totalSentiment / result.recordset.length : 0;

        res.json(summary);
    } catch (err) {
        console.error('Error fetching sentiment summary:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get comments
app.get('/api/comments', async (req, res) => {
    try {
        const result = await pool.request().query`
            SELECT survey_id, question_id, answer, optional_answer
            FROM responses
            WHERE optional_answer IS NOT NULL
            AND optional_answer <> ''
            AND question_id <> 10
            ORDER BY survey_id, question_id
        `;

        res.json(result.recordset);
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

        await pool.request()
            .input('surveyId', sql.Int, id)
            .input('name', sql.VarChar, name)
            .input('phone', sql.VarChar, phone)
            .input('email', sql.VarChar, email)
            .query`
                INSERT INTO low_satisfaction_responses 
                (survey_id, name, phone, email)
                VALUES (@surveyId, @name, @phone, @email)
            `;

        res.status(201).json({ message: 'Response recorded successfully' });
    } catch (err) {
        console.error('Error storing low satisfaction response:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});




// Get low satisfaction responses
app.get('/api/low-satisfaction', async (req, res) => {
    try {
        const result = await pool.request().query`
            SELECT *
            FROM low_satisfaction_responses
            ORDER BY created_at DESC
        `;

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ error: 'No responses found' });
        }

        const formattedResults = result.recordset.map(result => ({
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
        const result = await pool.request().query`
            SELECT *
            FROM questions
            ORDER BY id
        `;

        const formattedQuestions = result.recordset.map(q => ({
            id: q.id,
            question_text: q.question_text,
            question_type: q.question_type,
            max_value: q.max_value,
            class: q.class,
            importance: q.importance !== null ? Number(q.importance).toFixed(2) : "0.00",
            options: q.options ? JSON.parse(q.options) : []
        }));

        res.json(formattedQuestions);
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ 
            error: 'Error fetching questions', 
            details: err.message 
        });
    }
});

// Update questions endpoint
app.post('/api/questions/update', async (req, res) => {
    try {
        const { questions } = req.body;
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();
        try {
            for (const question of questions) {
                const questionData = {
                    question_text: question.question_text || '',
                    question_type: question.question_type || 'choice',
                    max_value: question.max_value || null,
                    class: question.class || null,
                    importance: parseFloat(question.importance || 0),
                    options: Array.isArray(question.options) ? JSON.stringify(question.options) : null
                };

                await transaction.request()
                    .input('id', sql.Int, question.id)
                    .input('text', sql.NVarChar, questionData.question_text)
                    .input('type', sql.VarChar, questionData.question_type)
                    .input('maxValue', sql.Int, questionData.max_value)
                    .input('class', sql.VarChar, questionData.class)
                    .input('importance', sql.Decimal(5,2), questionData.importance)
                    .input('options', sql.NVarChar, questionData.options)
                    .query`
                        UPDATE questions 
                        SET question_text = @text,
                            question_type = @type,
                            max_value = @maxValue,
                            class = @class,
                            importance = @importance,
                            options = @options
                        WHERE id = @id
                    `;
            }
            await transaction.commit();
            
            // Fetch and return updated questions
            const result = await pool.request().query`
                SELECT * FROM questions ORDER BY id
            `;
            
            res.json({
                message: 'Questions updated successfully',
                data: result.recordset
            });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
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

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query`DELETE FROM questions WHERE id = @id`;

        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (err) {
        console.error('Error deleting question:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Submit responses route
app.post('/api/responses', async (req, res) => {
    try {
        const { survey_id, responses, negativeScore } = req.body;
        const transaction = new sql.Transaction(pool);
        
        await transaction.begin();
        try {
            // Update negative score if provided
            if (typeof negativeScore !== 'undefined') {
                await transaction.request()
                    .input('surveyId', sql.Int, survey_id)
                    .input('score', sql.Decimal(5,2), negativeScore)
                    .query`
                        UPDATE surveys 
                        SET score_negatif = @score
                        WHERE id = @surveyId
                    `;
            }

            // Insert responses
            for (const response of responses) {
                await transaction.request()
                    .input('surveyId', sql.Int, survey_id)
                    .input('questionId', sql.Int, response.question_id)
                    .input('answer', sql.NVarChar, response.answer)
                    .input('optionalAnswer', sql.NVarChar, response.optional_answer)
                    .query`
                        INSERT INTO responses (survey_id, question_id, answer, optional_answer)
                        VALUES (@surveyId, @questionId, @answer, @optionalAnswer)
                    `;
            }

            await transaction.commit();
            res.status(200).json({ message: 'Responses recorded successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error submitting responses:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!', details: err.message });
});

// Initialize server
const startServer = async () => {
    try {
        await connectToDatabase();
        
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (err) {
        console.error('Server initialization failed:', err);
        process.exit(1);
    }
};

startServer();