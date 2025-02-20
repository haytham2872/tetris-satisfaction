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

// Database configuration
const config = {
    user: 'tetrisadmin',
    password: 'tetris123.',
    server: 'tetris.database.windows.net',
    database: 'statisfaction_db',
    options: {
        encrypt: true,
        trustServerCertificate: true,
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
// Health check endpoints
app.get('/', (req, res) => {
    res.json({ status: 'Server is running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Forms Management Routes
app.post('/api/forms', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        const result = await pool.request()
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description || null)
            .query`
                INSERT INTO forms (name, description)
                OUTPUT INSERTED.id
                VALUES (@name, @description)
            `;
            
        res.status(201).json({ 
            id: result.recordset[0].id,
            message: 'Form created successfully' 
        });
    } catch (err) {
        console.error('Error creating form:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.get('/api/forms', async (req, res) => {
    try {
        const result = await pool.request().query`
            SELECT id, name, description, created_at, updated_at, is_active
            FROM forms
            ORDER BY created_at DESC
        `;
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching forms:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
// Route pour obtenir les détails d'un formulaire spécifique
app.get('/api/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query`
                SELECT id, name, description, created_at, updated_at, is_active
                FROM forms
                WHERE id = @id
            `;
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching form details:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
app.put('/api/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('name', sql.NVarChar, name)
            .input('description', sql.NVarChar, description)
            .input('is_active', sql.Bit, is_active)
            .input('updated_at', sql.DateTime, new Date())
            .query`
                UPDATE forms 
                SET name = @name,
                    description = @description,
                    is_active = @is_active,
                    updated_at = @updated_at
                WHERE id = @id
            `;
            
        res.json({ message: 'Form updated successfully' });
    } catch (err) {
        console.error('Error updating form:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
// Questions Management Routes
app.post('/api/questions', async (req, res) => {
    try {
        const { form_id, questions } = req.body;
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            for (const question of questions) {
                await transaction.request()
                    .input('formId', sql.Int, form_id)
                    .input('text', sql.NVarChar, question.question_text)
                    .input('type', sql.VarChar, question.question_type)
                    .input('maxValue', sql.Int, question.max_value)
                    .input('class', sql.VarChar, question.class)
                    .input('importance', sql.Decimal(5,2), question.importance)
                    .input('options', sql.NVarChar, JSON.stringify(question.options))
                    .query`
                        INSERT INTO questions (
                            form_id,
                            question_text,
                            question_type,
                            max_value,
                            class,
                            importance,
                            options
                        )
                        VALUES (
                            @formId,
                            @text,
                            @type,
                            @maxValue,
                            @class,
                            @importance,
                            @options
                        )
                    `;
            }
            
            await transaction.commit();
            res.status(201).json({ message: 'Questions created successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error creating questions:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.get('/api/forms/:formId/questions', async (req, res) => {
    try {
        const { formId } = req.params;
        
        const result = await pool.request()
            .input('formId', sql.Int, formId)
            .query`
                SELECT *
                FROM questions
                WHERE form_id = @formId
                ORDER BY id
            `;

        const formattedQuestions = result.recordset.map(q => ({
            id: q.id,
            form_id: q.form_id,
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
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
app.post('/api/questions/update', async (req, res) => {
    try {
        const { form_id, questions } = req.body;
        
        if (!form_id) {
            return res.status(400).json({ error: 'form_id is required' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            for (const question of questions) {
                console.log('Processing question:', question); // Pour le debug

                // Pour une question existante
                if (question.id) {
                    await transaction.request()
                        .input('id', sql.Int, question.id)
                        .input('formId', sql.Int, form_id)
                        .input('text', sql.NVarChar, question.question_text)
                        .input('type', sql.VarChar, question.question_type)
                        .input('maxValue', sql.Int, question.max_value)
                        .input('class', sql.VarChar, question.class)
                        .input('importance', sql.Decimal(5,2), question.importance)
                        .input('options', sql.NVarChar, JSON.stringify(question.options || []))
                        .query`
                            UPDATE questions 
                            SET 
                                question_text = @text,
                                question_type = @type,
                                max_value = @maxValue,
                                class = @class,
                                importance = @importance,
                                options = @options,
                                form_id = @formId
                            WHERE id = @id
                        `;
                } else {
                    // Pour une nouvelle question
                    const insertResult = await transaction.request()
                        .input('formId', sql.Int, form_id)
                        .input('text', sql.NVarChar, question.question_text)
                        .input('type', sql.VarChar, question.question_type)
                        .input('maxValue', sql.Int, question.max_value)
                        .input('class', sql.VarChar, question.class)
                        .input('importance', sql.Decimal(5,2), question.importance)
                        .input('options', sql.NVarChar, JSON.stringify(question.options || []))
                        .query`
                            INSERT INTO questions (
                                form_id,
                                question_text,
                                question_type,
                                max_value,
                                class,
                                importance,
                                options
                            )
                            OUTPUT INSERTED.id
                            VALUES (
                                @formId,
                                @text,
                                @type,
                                @maxValue,
                                @class,
                                @importance,
                                @options
                            )
                        `;
                    
                    console.log('New question inserted with ID:', insertResult.recordset[0].id);
                }
            }
            
            await transaction.commit();
            res.status(200).json({ message: 'Questions updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error updating questions:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
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
// Response Management Routes
app.post('/api/responses', async (req, res) => {
    try {
        const { form_id, survey_id, responses } = req.body;
        
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            for (const response of responses) {
                let nlpAnalysis = null;
                if (response.answer && typeof response.answer === 'string' && response.answer.trim() !== '') {
                    try {
                        nlpAnalysis = await analyzeFeedback(response.answer);
                    } catch (error) {
                        console.error('Error in NLP analysis:', error);
                    }
                }

                await transaction.request()
                    .input('formId', sql.Int, form_id)
                    .input('surveyId', sql.Int, survey_id)
                    .input('questionId', sql.Int, response.question_id)
                    .input('answer', sql.NVarChar, response.answer.toString())
                    .input('optionalAnswer', sql.NVarChar, response.optional_answer || null)
                    .input('nlpAnalysis', sql.NVarChar(sql.MAX), nlpAnalysis ? JSON.stringify(nlpAnalysis) : null)
                    .query`
                        INSERT INTO responses (
                            form_id,
                            survey_id, 
                            question_id, 
                            answer, 
                            optional_answer, 
                            nlp_analysis
                        )
                        VALUES (
                            @formId,
                            @surveyId,
                            @questionId,
                            @answer,
                            @optionalAnswer,
                            @nlpAnalysis
                        )
                    `;
            }
            
            await transaction.commit();
            res.status(200).json({ message: 'Responses recorded successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Error storing responses:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
// Analytics Routes
app.get('/api/analytics/responses', async (req, res) => {
    try {
        const { form_id } = req.query;
        const query = form_id 
            ? `
                SELECT form_id, survey_id, question_id, answer, responded_at
                FROM responses
                WHERE form_id = @formId
                ORDER BY survey_id, question_id
            `
            : `
                SELECT form_id, survey_id, question_id, answer, responded_at
                FROM responses
                ORDER BY survey_id, question_id
            `;

        const request = pool.request();
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }

        const result = await request.query(query);

        const groupedData = result.recordset.reduce((acc, row) => {
            const key = `${row.form_id}_${row.survey_id}`;
            if (!acc[key]) {
                acc[key] = {
                    form_id: row.form_id,
                    survey_id: row.survey_id,
                    responses: []
                };
            }
            acc[key].responses.push({
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

app.get('/api/analytics/additional', async (req, res) => {
    try {
        const { form_id } = req.query;
        const query = form_id 
            ? `
                SELECT form_id, survey_id, question_id, answer, responded_at
                FROM responses
                WHERE form_id = @formId AND question_id IN (5, 6, 7, 8, 9)
                ORDER BY survey_id, question_id
            `
            : `
                SELECT form_id, survey_id, question_id, answer, responded_at
                FROM responses
                WHERE question_id IN (5, 6, 7, 8, 9)
                ORDER BY survey_id, question_id
            `;

        const request = pool.request();
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }

        const result = await request.query(query);

        const groupedData = result.recordset.reduce((acc, row) => {
            const key = `${row.form_id}_${row.survey_id}`;
            if (!acc[key]) {
                acc[key] = {
                    form_id: row.form_id,
                    survey_id: row.survey_id,
                    responses: []
                };
            }
            acc[key].responses.push({
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
// Start survey route
app.post('/api/start-survey', async (req, res) => {
    try {
        const { name, form_id } = req.body;
        
        const result = await pool.request()
            .input('name', sql.NVarChar, name || 'Nouveau survey')
            .input('formId', sql.Int, form_id)
            .query`
                INSERT INTO surveys (name, form_id)
                OUTPUT INSERTED.id
                VALUES (@name, @formId)
            `;
            
        res.status(201).json({ id: result.recordset[0].id });
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
// Route modifiée pour obtenir des statistiques par période
app.get('/api/analytics/period', async (req, res) => {
    try {
        const { form_id, start_date, end_date } = req.query;
        const query = form_id 
            ? `
                SELECT 
                    form_id,
                    survey_id,
                    question_id,
                    answer,
                    responded_at
                FROM responses
                WHERE form_id = @formId
                    AND responded_at >= @startDate
                    AND responded_at <= @endDate
                ORDER BY responded_at
            `
            : `
                SELECT 
                    form_id,
                    survey_id,
                    question_id,
                    answer,
                    responded_at
                FROM responses
                WHERE responded_at >= @startDate
                    AND responded_at <= @endDate
                ORDER BY responded_at
            `;

        const request = pool.request();
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }
        request.input('startDate', sql.DateTime, new Date(start_date || '2000-01-01'));
        request.input('endDate', sql.DateTime, new Date(end_date || new Date()));

        const result = await request.query(query);

        const groupedData = result.recordset.reduce((acc, row) => {
            const date = new Date(row.responded_at).toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = {
                    date,
                    form_id: row.form_id,
                    count: 0,
                    responses: []
                };
            }
            acc[date].count++;
            acc[date].responses.push({
                survey_id: row.survey_id,
                question_id: row.question_id,
                answer: row.answer
            });
            return acc;
        }, {});

        res.json(Object.values(groupedData));
    } catch (err) {
        console.error('Error fetching period analytics:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Route pour obtenir des statistiques aggrégées
app.get('/api/analytics/summary', async (req, res) => {
    try {
        const { form_id } = req.query;
        const query = form_id 
            ? `
                SELECT 
                    q.id as question_id,
                    q.question_text,
                    q.question_type,
                    COUNT(r.id) as response_count,
                    AVG(CASE WHEN ISNUMERIC(r.answer) = 1 THEN CAST(r.answer AS FLOAT) ELSE NULL END) as average_score
                FROM questions q
                LEFT JOIN responses r ON q.id = r.question_id AND r.form_id = @formId
                WHERE q.form_id = @formId
                GROUP BY q.id, q.question_text, q.question_type
                ORDER BY q.id
            `
            : `
                SELECT 
                    q.id as question_id,
                    q.question_text,
                    q.question_type,
                    COUNT(r.id) as response_count,
                    AVG(CASE WHEN ISNUMERIC(r.answer) = 1 THEN CAST(r.answer AS FLOAT) ELSE NULL END) as average_score
                FROM questions q
                LEFT JOIN responses r ON q.id = r.question_id
                GROUP BY q.id, q.question_text, q.question_type
                ORDER BY q.id
            `;

        const request = pool.request();
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }

        const result = await request.query(query);

        const summary = result.recordset.map(row => ({
            question_id: row.question_id,
            question_text: row.question_text,
            question_type: row.question_type,
            total_responses: row.response_count,
            average_score: row.question_type === 'number' ? Number(row.average_score).toFixed(2) : null
        }));

        res.json(summary);
    } catch (err) {
        console.error('Error fetching analytics summary:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Route pour obtenir des statistiques détaillées par question
app.get('/api/analytics/question/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;
        const { form_id } = req.query;

        const query = form_id
            ? `
                SELECT 
                    r.answer,
                    COUNT(*) as count,
                    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM responses WHERE question_id = @questionId AND form_id = @formId)) as percentage
                FROM responses r
                WHERE r.question_id = @questionId 
                    AND r.form_id = @formId
                GROUP BY r.answer
                ORDER BY r.answer
            `
            : `
                SELECT 
                    r.answer,
                    COUNT(*) as count,
                    (COUNT(*) * 100.0 / (SELECT COUNT(*) FROM responses WHERE question_id = @questionId)) as percentage
                FROM responses r
                WHERE r.question_id = @questionId
                GROUP BY r.answer
                ORDER BY r.answer
            `;

        const request = pool.request()
            .input('questionId', sql.Int, questionId);
            
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }

        const result = await request.query(query);

        const analysis = {
            question_id: parseInt(questionId),
            total_responses: result.recordset.reduce((sum, row) => sum + row.count, 0),
            distribution: result.recordset.map(row => ({
                answer: row.answer,
                count: row.count,
                percentage: Number(row.percentage).toFixed(2)
            }))
        };

        res.json(analysis);
    } catch (err) {
        console.error('Error fetching question analytics:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});
// Feedback Analysis Routes
app.get('/api/feedback/analysis', async (req, res) => {
    try {
        const { form_id } = req.query;
        const query = form_id 
            ? `
                SELECT 
                    r.id,
                    r.form_id,
                    r.survey_id,
                    r.question_id,
                    r.answer,
                    r.nlp_analysis,
                    r.responded_at,
                    q.question_text,
                    q.question_type
                FROM responses r
                INNER JOIN questions q ON r.question_id = q.id
                WHERE r.form_id = @formId 
                    AND r.answer IS NOT NULL 
                    AND r.answer != ''
                    AND r.nlp_analysis IS NOT NULL
                ORDER BY r.responded_at DESC
            `
            : `
                SELECT 
                    r.id,
                    r.form_id,
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

        const request = pool.request();
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }

        const result = await request.query(query);

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
                form_id: row.form_id,
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

app.post('/api/feedback/analyze', async (req, res) => {
    try {
        const { survey_id, form_id, analyses } = req.body;

        if (!survey_id || !form_id || !analyses) {
            return res.status(400).json({ error: 'Missing required data' });
        }

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            for (const analysis of analyses) {
                await transaction.request()
                    .input('formId', sql.Int, form_id)
                    .input('surveyId', sql.Int, survey_id)
                    .input('questionId', sql.Int, analysis.questionId)
                    .input('analysis', sql.NVarChar, JSON.stringify(analysis.analysis))
                    .query`
                        UPDATE responses
                        SET nlp_analysis = @analysis
                        WHERE form_id = @formId
                        AND survey_id = @surveyId
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

app.get('/api/feedback/sentiment-summary', async (req, res) => {
    try {
        const { form_id } = req.query;
        const query = form_id 
            ? `
                SELECT r.nlp_analysis
                FROM responses r
                INNER JOIN questions q ON r.question_id = q.id
                WHERE r.form_id = @formId 
                    AND q.question_type = 'text'
                    AND r.nlp_analysis IS NOT NULL
            `
            : `
                SELECT r.nlp_analysis
                FROM responses r
                INNER JOIN questions q ON r.question_id = q.id
                WHERE q.question_type = 'text'
                    AND r.nlp_analysis IS NOT NULL
            `;

        const request = pool.request();
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }

        const result = await request.query(query);

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
// Comments and Satisfaction Routes
app.get('/api/comments', async (req, res) => {
    try {
        const { form_id } = req.query;
        const query = form_id 
            ? `
                SELECT form_id, survey_id, question_id, answer, optional_answer
                FROM responses
                WHERE form_id = @formId 
                    AND optional_answer IS NOT NULL
                    AND optional_answer <> ''
                    AND question_id <> 10
                ORDER BY survey_id, question_id
            `
            : `
                SELECT form_id, survey_id, question_id, answer, optional_answer
                FROM responses
                WHERE optional_answer IS NOT NULL
                    AND optional_answer <> ''
                    AND question_id <> 10
                ORDER BY survey_id, question_id
            `;

        const request = pool.request();
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.post('/api/low-satisfaction', async (req, res) => {
    try {
        const { form_id, survey_id, name, phone, email, commentaire } = req.body;

        if (!form_id || !survey_id || !name || !phone || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        await pool.request()
            .input('formId', sql.Int, form_id)
            .input('surveyId', sql.Int, survey_id)
            .input('name', sql.NVarChar, name)
            .input('phone', sql.NVarChar, phone)
            .input('email', sql.NVarChar, email)
            .input('commentaire', sql.NVarChar(sql.MAX), commentaire || null)
            .query`
                INSERT INTO low_satisfaction_responses 
                (form_id, survey_id, name, phone, email, commentaire)
                VALUES (@formId, @surveyId, @name, @phone, @email, @commentaire)
            `;

        res.status(201).json({ message: 'Response recorded successfully' });
    } catch (err) {
        console.error('Error storing low satisfaction response:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.get('/api/low-satisfaction', async (req, res) => {
    try {
        const { form_id } = req.query;
        const query = form_id 
            ? `
                SELECT 
                    id,
                    form_id,
                    survey_id,
                    name,
                    phone,
                    email,
                    commentaire,
                    created_at
                FROM low_satisfaction_responses
                WHERE form_id = @formId
                ORDER BY created_at DESC
            `
            : `
                SELECT 
                    id,
                    form_id,
                    survey_id,
                    name,
                    phone,
                    email,
                    commentaire,
                    created_at
                FROM low_satisfaction_responses
                ORDER BY created_at DESC
            `;

        const request = pool.request();
        if (form_id) {
            request.input('formId', sql.Int, form_id);
        }

        const result = await request.query(query);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ error: 'No responses found' });
        }

        const formattedResults = result.recordset.map(result => ({
            id: result.id,
            form_id: result.form_id,
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