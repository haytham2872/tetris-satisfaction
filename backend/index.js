import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Basic error logging
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint that doesn't require database connection
app.get('/', (req, res) => {
    res.json({ status: 'Server is running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Database configuration
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        connectionTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Global pool variable
let pool;

// Database connection function
const connectToDatabase = async () => {
    try {
        console.log('Attempting database connection...');
        pool = await sql.connect(config);
        console.log('Database connected successfully');
        return true;
    } catch (err) {
        console.error('Database connection error:', err);
        return false;
    }
};

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
            SELECT 
                r.id,
                r.survey_id,
                r.question_id,
                r.answer,
                r.nlp_analysis,
                r.responded_at,
                q.question_text,
                q.question_type
            FROM responses r
            INNER JOIN questions q ON r.question_id = q.id
            WHERE r.answer IS NOT NULL 
                AND r.answer != ''
                AND r.nlp_analysis IS NOT NULL
            ORDER BY r.responded_at DESC
        `;

        const formattedResult = result.recordset.map(row => {
            let analysis;
            try {
                analysis = typeof row.nlp_analysis === 'string' ? 
                    JSON.parse(row.nlp_analysis) : row.nlp_analysis;
            } catch (e) {
                console.error('Error parsing NLP analysis:', e);
                analysis = null;
            }

            return {
                id: row.id,
                survey_id: row.survey_id,
                questionId: row.question_id,
                questionText: row.question_text,
                questionType: row.question_type,
                originalText: row.answer || '',
                analysis: analysis,
                timestamp: row.responded_at
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error('Error in feedback analysis:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Update feedback analysis - Modified to handle multiple analyses
app.post('/api/feedback/analyze', async (req, res) => {
    try {
        const { survey_id, analyses } = req.body;

        if (!survey_id || !analyses) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Update each analysis
            for (const analysis of analyses) {
                await transaction.request()
                    .input('surveyId', sql.Int, survey_id)
                    .input('questionId', sql.Int, analysis.questionId)
                    .input('analysis', sql.NVarChar, JSON.stringify(analysis.analysis))
                    .query`
                        UPDATE responses
                        SET nlp_analysis = @analysis
                        WHERE survey_id = @surveyId
                        AND question_id = @questionId
                    `;
            }

            await transaction.commit();
            res.status(200).json({ message: 'Analyses updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error updating analyses:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Get sentiment summary
app.get('/api/feedback/sentiment-summary', async (req, res) => {
    try {
        const result = await pool.request().query`
            SELECT r.nlp_analysis
            FROM responses r
            INNER JOIN questions q ON r.question_id = q.id
            WHERE q.question_type = 'text'
            AND r.nlp_analysis IS NOT NULL
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
            const score = analysis?.overall?.sentiment?.score || 0;
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

/// Store low satisfaction contact details
app.post('/api/low-satisfaction', async (req, res) => {
    try {
        const { id, name, phone, email, commentaire } = req.body;

        if (!id || !name || !phone || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await pool.request()
            .input('surveyId', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .input('email', sql.NVarChar, email)
            .input('commentaire', sql.NVarChar(sql.MAX), commentaire || null)
            .query`
                INSERT INTO low_satisfaction_responses 
                (survey_id, name, phone, email, commentaire)
                VALUES (@surveyId, @name, @phone, @email, @commentaire)
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
            SELECT 
                id,
                survey_id,
                name,
                phone,
                email,
                commentaire,
                created_at
            FROM low_satisfaction_responses
            ORDER BY created_at DESC
        `;

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ error: 'No responses found' });
        }

        const formattedResults = result.recordset.map(result => ({
            id: result.id,
            survey_id: result.survey_id,
            name: result.name,
            phone: result.phone,
            email: result.email,
            commentaire: result.commentaire || null,
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
// Update the submit responses route to properly handle the negative score
// In your backend index.js, update the /api/responses endpoint

app.post('/api/responses', async (req, res) => {
    try {
        if (!pool) {
            console.error('No database pool available');
            return res.status(503).json({ error: 'Database connection not available' });
        }

        const { survey_id, responses } = req.body;
        console.log('Received responses:', { survey_id, responses });

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const response of responses) {
                console.log(`Processing response for question ${response.question_id}:`, response);

                if (!response.answer && response.answer !== '') {
                    throw new Error(`Invalid answer for question ${response.question_id}`);
                }

                let nlpAnalysis = null;
                // Only analyze text responses
                if (response.answer && 
                    typeof response.answer === 'string' && 
                    response.answer.trim() !== '') {
                    try {
                        console.log('Starting NLP analysis for:', response.answer);
                        nlpAnalysis = await analyzeFeedback(response.answer);
                        console.log('NLP Analysis completed:', nlpAnalysis);

                        // Verify nlpAnalysis structure
                        if (!nlpAnalysis || !nlpAnalysis.overall || !nlpAnalysis.overall.sentiment) {
                            console.error('Invalid NLP analysis structure:', nlpAnalysis);
                            nlpAnalysis = null;
                        }
                    } catch (error) {
                        console.error('Error in NLP analysis:', error);
                        nlpAnalysis = null;
                    }
                }

                // Convert nlpAnalysis to string safely
                let nlpAnalysisString = null;
                if (nlpAnalysis) {
                    try {
                        nlpAnalysisString = JSON.stringify(nlpAnalysis);
                        console.log('Stringified NLP analysis:', nlpAnalysisString);
                    } catch (error) {
                        console.error('Error stringifying NLP analysis:', error);
                    }
                }

                // Log the exact values being inserted
                console.log('Inserting into database:', {
                    surveyId: survey_id,
                    questionId: response.question_id,
                    answer: response.answer,
                    optionalAnswer: response.optional_answer,
                    nlpAnalysis: nlpAnalysisString ? nlpAnalysisString.substring(0, 50) + '...' : null
                });

                // Perform the database insertion
                try {
                    await transaction.request()
                        .input('surveyId', sql.Int, survey_id)
                        .input('questionId', sql.Int, response.question_id)
                        .input('answer', sql.NVarChar, response.answer.toString())
                        .input('optionalAnswer', sql.NVarChar, response.optional_answer || null)
                        .input('nlpAnalysis', sql.NVarChar(sql.MAX), nlpAnalysisString)
                        .query`
                            INSERT INTO responses (
                                survey_id, 
                                question_id, 
                                answer, 
                                optional_answer, 
                                nlp_analysis
                            )
                            VALUES (
                                @surveyId,
                                @questionId,
                                @answer,
                                @optionalAnswer,
                                @nlpAnalysis
                            )
                        `;
                    
                    console.log(`Successfully inserted response for question ${response.question_id}`);
                } catch (dbError) {
                    console.error('Database insertion error:', dbError);
                    throw dbError;
                }
            }

            await transaction.commit();
            console.log('Transaction committed successfully');
            res.status(200).json({ 
                message: 'Responses recorded successfully',
                debug: { processed: responses.length }
            });
        } catch (err) {
            console.error('Transaction error:', err);
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Overall error in /api/responses:', err);
        res.status(500).json({ 
            error: 'Server error', 
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
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
        }).on('error', (err) => {
            console.error('Server failed to start:', err);
            process.exit(1);
        });
    } catch (err) {
        console.error('Server initialization failed:', err);
        process.exit(1);
    }
};

startServer();