import express from 'express';
import mysql from 'mysql2/promise'; // Using mysql2 with promise support for MariaDB
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
app.use(cors({
    origin: '*',  // Allow all origins - for development only
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));


app.use(express.json());

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST ,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME ,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Global pool variable
let pool;

// Database connection function
const connectToDatabase = async () => {
    try {
        console.log('Attempting database connection...');
        pool = await mysql.createPool(dbConfig);
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

app.get('/api/debug/db-status', async (req, res) => {
    try {
        if (!pool) {
            return res.status(500).json({ status: 'No pool connection' });
        }
        
        const [result] = await pool.query('SELECT 1 as connection_test');
        res.json({ 
            status: 'Database connected', 
            test_result: result,
            pool_status: {
                connectionLimit: pool.config.connectionLimit,
                waitForConnections: pool.config.waitForConnections
            }
        });
    } catch (err) {
        console.error('Database status check error:', err);
        res.status(500).json({ status: 'Database error', error: err.message });
    }
});

// Forms Management Routes
app.post('/api/forms', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        // Debug log to inspect what's being received
        console.log("Creating form with:", { name, description });
        
        // Ensure the pool is initialized
        if (!pool) {
            console.error("Database pool not initialized");
            return res.status(500).json({ error: 'Database connection not available' });
        }
        
        // Validate input
        if (!name) {
            return res.status(400).json({ error: 'Form name is required' });
        }
        
        const [result] = await pool.execute(
            'INSERT INTO forms (name, description) VALUES (?, ?)',
            [name, description || null]
        );
            
        console.log("Form creation result:", result);
        
        // Return success response with the new ID
        res.status(201).json({ 
            id: result.insertId,
            message: 'Form created successfully' 
        });
    } catch (err) {
        console.error('Error creating form:', err);
        
        // Send a more detailed error for debugging
        res.status(500).json({ 
            error: 'Server error', 
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

app.get('/api/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await pool.execute(
            'SELECT id, name, description, created_at, updated_at, is_active FROM forms WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching form details:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.get('/api/forms', async (req, res) => {
    try {
        // Ensure pool is initialized
        if (!pool) {
            console.error("Database pool not initialized");
            return res.status(500).json({ error: 'Database connection not available' });
        }
        
        console.log("Executing query to fetch all forms");
        const [rows] = await pool.execute(
            'SELECT id, name, description, created_at, updated_at, is_active FROM forms ORDER BY id'
        );
        
        console.log(`Retrieved ${rows.length} forms from database`);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching forms:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.put('/api/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_active } = req.body;
        
        await pool.execute(
            'UPDATE forms SET name = ?, description = ?, is_active = ?, updated_at = ? WHERE id = ?',
            [name, description, is_active, new Date(), id]
        );
            
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
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            for (const question of questions) {
                await connection.execute(
                    `INSERT INTO questions (
                        form_id,
                        question_text,
                        question_type,
                        max_value,
                        class,
                        importance,
                        options
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        form_id,
                        question.question_text,
                        question.question_type,
                        question.max_value,
                        question.class,
                        question.importance,
                        JSON.stringify(question.options)
                    ]
                );
            }
            
            await connection.commit();
            res.status(201).json({ message: 'Questions created successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error creating questions:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.get('/api/forms/:formId/questions', async (req, res) => {
    try {
        const { formId } = req.params;
        
        const [rows] = await pool.execute(
            'SELECT * FROM questions WHERE form_id = ? ORDER BY id',
            [formId]
        );

        const formattedQuestions = rows.map(q => ({
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

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Track created questions to return their IDs
            const newQuestionIds = [];
            
            for (const question of questions) {
                console.log('Processing question:', question);

                // Check if this is an existing question (positive ID) or new question (negative ID)
                if (question.id && question.id > 0) {
                    // Update existing question
                    await connection.execute(
                        `UPDATE questions SET
                            question_text = ?,
                            question_type = ?,
                            max_value = ?,
                            class = ?,
                            importance = ?,
                            options = ?,
                            form_id = ?
                        WHERE id = ?`,
                        [
                            question.question_text,
                            question.question_type,
                            question.max_value,
                            question.class,
                            question.importance,
                            JSON.stringify(question.options || []),
                            form_id,
                            question.id
                        ]
                    );
                } else {
                    // Insert new question (negative or null ID)
                    const [result] = await connection.execute(
                        `INSERT INTO questions (
                            form_id,
                            question_text,
                            question_type,
                            max_value,
                            class,
                            importance,
                            options
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            form_id,
                            question.question_text,
                            question.question_type,
                            question.max_value,
                            question.class,
                            question.importance,
                            JSON.stringify(question.options || [])
                        ]
                    );
                    
                    const newId = result.insertId;
                    console.log('New question inserted with ID:', newId);
                    
                    // Track the mapping from temporary ID to new database ID
                    newQuestionIds.push({
                        tempId: question.id, // The negative ID
                        newId: newId        // The new database ID
                    });
                }
            }
            
            await connection.commit();
            
            // Return success with the mapping of temporary to new IDs
            res.status(200).json({ 
                message: 'Questions updated successfully',
                newQuestionIds: newQuestionIds
            });
            
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
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

        const [result] = await pool.execute('DELETE FROM questions WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
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
        
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            for (const response of responses) {
                let nlpAnalysis = null;
                if (response.answer && typeof response.answer === 'string' && response.answer.trim() !== '') {
                    try {
                        nlpAnalysis = await analyzeFeedback(response.answer);
                    } catch (error) {
                        console.error('Error in NLP analysis:', error);
                    }
                }

                await connection.execute(
                    `INSERT INTO responses (
                        form_id,
                        survey_id, 
                        question_id, 
                        answer, 
                        optional_answer, 
                        nlp_analysis
                    ) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        form_id,
                        survey_id,
                        response.question_id,
                        response.answer.toString(),
                        response.optional_answer || null,
                        nlpAnalysis ? JSON.stringify(nlpAnalysis) : null
                    ]
                );
            }
            
            await connection.commit();
            res.status(200).json({ message: 'Responses recorded successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
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
        let query, params = [];
        
        if (form_id) {
            query = `
                SELECT form_id, survey_id, question_id, answer, responded_at
                FROM responses
                WHERE form_id = ?
                ORDER BY survey_id, question_id
            `;
            params = [form_id];
        } else {
            query = `
                SELECT form_id, survey_id, question_id, answer, responded_at
                FROM responses
                ORDER BY survey_id, question_id
            `;
        }

        const [rows] = await pool.execute(query, params);

        const groupedData = rows.reduce((acc, row) => {
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
        let query, params = [];
        
        if (form_id) {
            query = `
                SELECT form_id, survey_id, question_id, answer, responded_at
                FROM responses
                WHERE form_id = ? AND question_id IN (5, 6, 7, 8, 9)
                ORDER BY survey_id, question_id
            `;
            params = [form_id];
        } else {
            query = `
                SELECT form_id, survey_id, question_id, answer, responded_at
                FROM responses
                WHERE question_id IN (5, 6, 7, 8, 9)
                ORDER BY survey_id, question_id
            `;
        }

        const [rows] = await pool.execute(query, params);

        const groupedData = rows.reduce((acc, row) => {
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
        
        const [result] = await pool.execute(
            'INSERT INTO surveys (name, form_id) VALUES (?, ?)',
            [name || 'Nouveau survey', form_id]
        );
            
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// Route for period analytics
app.get('/api/analytics/period', async (req, res) => {
    try {
        const { form_id, start_date, end_date } = req.query;
        let query, params = [];
        
        if (form_id) {
            query = `
                SELECT 
                    form_id,
                    survey_id,
                    question_id,
                    answer,
                    responded_at
                FROM responses
                WHERE form_id = ?
                    AND responded_at >= ?
                    AND responded_at <= ?
                ORDER BY responded_at
            `;
            params = [
                form_id, 
                new Date(start_date || '2000-01-01'), 
                new Date(end_date || new Date())
            ];
        } else {
            query = `
                SELECT 
                    form_id,
                    survey_id,
                    question_id,
                    answer,
                    responded_at
                FROM responses
                WHERE responded_at >= ?
                    AND responded_at <= ?
                ORDER BY responded_at
            `;
            params = [
                new Date(start_date || '2000-01-01'), 
                new Date(end_date || new Date())
            ];
        }

        const [rows] = await pool.execute(query, params);

        const groupedData = rows.reduce((acc, row) => {
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

// Route for summary analytics
app.get('/api/analytics/summary', async (req, res) => {
    try {
        const { form_id } = req.query;
        let query, params = [];
        
        if (form_id) {
            query = `
                SELECT 
                    q.id as question_id,
                    q.question_text,
                    q.question_type,
                    COUNT(r.id) as response_count,
                    AVG(CASE WHEN r.answer REGEXP '^[0-9]+(\.[0-9]+)?$' THEN r.answer ELSE NULL END) as average_score
                FROM questions q
                LEFT JOIN responses r ON q.id = r.question_id AND r.form_id = ?
                WHERE q.form_id = ?
                GROUP BY q.id, q.question_text, q.question_type
                ORDER BY q.id
            `;
            params = [form_id, form_id];
        } else {
            query = `
                SELECT 
                    q.id as question_id,
                    q.question_text,
                    q.question_type,
                    COUNT(r.id) as response_count,
                    AVG(CASE WHEN r.answer REGEXP '^[0-9]+(\.[0-9]+)?$' THEN r.answer ELSE NULL END) as average_score
                FROM questions q
                LEFT JOIN responses r ON q.id = r.question_id
                GROUP BY q.id, q.question_text, q.question_type
                ORDER BY q.id
            `;
        }

        const [rows] = await pool.execute(query, params);

        const summary = rows.map(row => ({
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

// Route for question analytics
app.get('/api/analytics/question/:questionId', async (req, res) => {
    try {
        const { questionId } = req.params;
        const { form_id } = req.query;
        let query, params = [];

        if (form_id) {
            query = `
                SELECT 
                    r.answer,
                    COUNT(*) as count,
                    (COUNT(*) * 100.0 / (
                        SELECT COUNT(*) FROM responses 
                        WHERE question_id = ? AND form_id = ?
                    )) as percentage
                FROM responses r
                WHERE r.question_id = ? 
                    AND r.form_id = ?
                GROUP BY r.answer
                ORDER BY r.answer
            `;
            params = [questionId, form_id, questionId, form_id];
        } else {
            query = `
                SELECT 
                    r.answer,
                    COUNT(*) as count,
                    (COUNT(*) * 100.0 / (
                        SELECT COUNT(*) FROM responses 
                        WHERE question_id = ?
                    )) as percentage
                FROM responses r
                WHERE r.question_id = ?
                GROUP BY r.answer
                ORDER BY r.answer
            `;
            params = [questionId, questionId];
        }

        const [rows] = await pool.execute(query, params);

        const analysis = {
            question_id: parseInt(questionId),
            total_responses: rows.reduce((sum, row) => sum + row.count, 0),
            distribution: rows.map(row => ({
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
        let query, params = [];
        
        if (form_id) {
            query = `
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
                WHERE r.form_id = ? 
                    AND r.answer IS NOT NULL 
                    AND r.answer != ''
                    AND r.nlp_analysis IS NOT NULL
                ORDER BY r.responded_at DESC
            `;
            params = [form_id];
        } else {
            query = `
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
        }

        const [rows] = await pool.execute(query, params);

        const formattedResult = rows.map(row => {
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

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            for (const analysis of analyses) {
                await connection.execute(
                    `UPDATE responses
                    SET nlp_analysis = ?
                    WHERE form_id = ?
                    AND survey_id = ?
                    AND question_id = ?`,
                    [
                        JSON.stringify(analysis.analysis),
                        form_id,
                        survey_id,
                        analysis.questionId
                    ]
                );
            }

            await connection.commit();
            res.status(200).json({ message: 'Analyses updated successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('Error updating analyses:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.get('/api/feedback/sentiment-summary', async (req, res) => {
    try {
        const { form_id } = req.query;
        let query, params = [];
        
        if (form_id) {
            query = `
                SELECT r.nlp_analysis
                FROM responses r
                INNER JOIN questions q ON r.question_id = q.id
                WHERE r.form_id = ? 
                    AND q.question_type = 'text'
                    AND r.nlp_analysis IS NOT NULL
            `;
            params = [form_id];
        } else {
            query = `
                SELECT r.nlp_analysis
                FROM responses r
                INNER JOIN questions q ON r.question_id = q.id
                WHERE q.question_type = 'text'
                    AND r.nlp_analysis IS NOT NULL
            `;
        }

        const [rows] = await pool.execute(query, params);

        const summary = {
            total_feedback: rows.length,
            positive_count: 0,
            neutral_count: 0,
            negative_count: 0,
            avg_sentiment: 0
        };

        let totalSentiment = 0;
        rows.forEach(row => {
            const analysis = typeof row.nlp_analysis === 'string' ? 
                JSON.parse(row.nlp_analysis) : row.nlp_analysis;
            const score = analysis?.overall?.sentiment?.score || 0;
            totalSentiment += score;

            if (score > 0.2) summary.positive_count++;
            else if (score < -0.2) summary.negative_count++;
            else summary.neutral_count++;
        });

        summary.avg_sentiment = rows.length > 0 ? 
            totalSentiment / rows.length : 0;

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
        let query, params = [];
        
        if (form_id) {
            query = `
                SELECT form_id, survey_id, question_id, answer, optional_answer
                FROM responses
                WHERE form_id = ? 
                    AND optional_answer IS NOT NULL
                    AND optional_answer <> ''
                    AND question_id <> 10
                ORDER BY survey_id, question_id
            `;
            params = [form_id];
        } else {
            query = `
                SELECT form_id, survey_id, question_id, answer, optional_answer
                FROM responses
                WHERE optional_answer IS NOT NULL
                    AND optional_answer <> ''
                    AND question_id <> 10
                ORDER BY survey_id, question_id
            `;
        }

        const [rows] = await pool.execute(query, params);
        res.json(rows);
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

        await pool.execute(
            `INSERT INTO low_satisfaction_responses 
            (form_id, survey_id, name, phone, email, commentaire)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [form_id, survey_id, name, phone, email, commentaire || null]
        );

        res.status(201).json({ message: 'Response recorded successfully' });
    } catch (err) {
        console.error('Error storing low satisfaction response:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

app.get('/api/low-satisfaction', async (req, res) => {
    try {
        const { form_id } = req.query;
        let query, params = [];
        
        if (form_id) {
            query = `
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
                WHERE form_id = ?
                ORDER BY created_at DESC
            `;
            params = [form_id];
        } else {
            query = `
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
        }

        const [rows] = await pool.execute(query, params);

        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No responses found' });
        }

        const formattedResults = rows.map(result => ({
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