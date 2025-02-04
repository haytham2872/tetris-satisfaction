const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const cors = require('cors');

const app = express();
const PORT = 5000;

require('dotenv').config();


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database configuration
const pool = mariadb.createPool({
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT || 3306,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    connectionLimit: 5,
    bigIntAsNumber: true
});

const createLowSatisfactionTable = async () => {
    const query = `
      CREATE TABLE IF NOT EXISTS low_satisfaction_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        survey_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (survey_id) REFERENCES surveys(id)
      )
    `;
    
    try {
      await executeQuery(query);
      console.log('Low satisfaction responses table created or already exists');
    } catch (err) {
      console.error('Error creating low satisfaction table:', err);
    }
  };

  createLowSatisfactionTable();

async function executeQuery(query, params = []) {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query(query, params);
        return result;
    } catch (err) {
        console.error('Database error:', err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

// Route to start the survey
app.post('/api/start-survey', async (req, res) => {
    try {
        const { name } = req.body;
        const result = await executeQuery(
            'INSERT INTO surveys (name) VALUES (?)',
            [name || 'Nouveau survey']
        );
        
        // Convert BigInt to Number before sending
        res.status(201).json({ 
            id: Number(result.insertId)
        });
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).send('Server error');
    }
});

// ...
app.post('/api/responses', async (req, res) => {
    try {
        const { survey_id, responses } = req.body;

        // Vérifie qu'on a bien un survey_id et un tableau "responses"
        if (!survey_id || !responses || !Array.isArray(responses) || responses.length === 0) {
            return res.status(400).send('Invalid data. Make sure to include survey_id and an array of responses.');
        }

        // Prépare la requête SQL
        const query = `
          INSERT INTO responses 
            (survey_id, question_id, answer, optional_answer, responded_at) 
          VALUES (?, ?, ?, ?, ?)
        `;

        // Pour chaque item dans le tableau responses
        // item = { question_id, answer, optional_answer }
        const currentDateTime = new Date();
        for (const item of responses) {
            const { question_id, answer, optional_answer } = item;
            
            // Exécute l'insertion
            await executeQuery(query, [
                Number(survey_id),
                Number(question_id),
                answer,
                optional_answer,     // <-- On stocke ici la valeur optionnelle
                currentDateTime,
            ]);
        }

        res.status(200).send('Responses successfully recorded.');
    } catch (err) {
        console.error('Error inserting responses:', err);
        res.status(500).send('Server error');
    }
});



// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log('Attempting to connect to MariaDB...');
    pool.getConnection()
        .then(conn => {
            console.log('Successfully connected to MariaDB!');
            conn.release();
        })
        .catch(err => {
            console.error('Error connecting to MariaDB:', err);
        });
});

// Add this new endpoint to fetch analytics data
app.get('/api/analytics/responses', async (req, res) => {
  try {
      const result = await executeQuery(`
          SELECT 
              s.id as survey_id,
              r.question_id,
              r.answer,
              r.responded_at
          FROM surveys s
          JOIN responses r ON s.id = r.survey_id
          ORDER BY s.id, r.question_id
      `);

      // Group responses by survey
      const groupedData = result.reduce((acc, row) => {
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
      console.error('Error fetching analytics data:', err);
      res.status(500).send('Server error');
  }
});
app.get('/api/analytics/additional', async (req, res) => {
  try {
      const result = await executeQuery(`
          SELECT 
              s.id as survey_id,
              r.question_id,
              r.answer,
              r.responded_at
          FROM surveys s
          JOIN responses r ON s.id = r.survey_id
          WHERE r.question_id IN (5, 6, 7, 8, 9)  -- Questions for additional analytics
          ORDER BY s.id, r.question_id
      `);

      // Group responses by survey
      const groupedData = result.reduce((acc, row) => {
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
      console.error('Error fetching additional analytics data:', err);
      res.status(500).send('Server error');
  }
});

// Route to get all feedback responses
// Add this route to your backend index.js or update if it exists
// Update your /api/feedback/analysis endpoint in index.js
// Update the /api/feedback/analysis endpoint in index.js

app.get('/api/feedback/analysis', async (req, res) => {
    try {
        console.log('Fetching feedback analysis...'); 

        const result = await executeQuery(`
            SELECT DISTINCT  -- Add DISTINCT to prevent duplicates
                r.id,
                r.survey_id,
                r.answer as originalText,
                r.nlp_analysis as analysis,
                r.responded_at as timestamp
            FROM responses r
            WHERE r.question_id = 10  -- Feedback question
            AND r.nlp_analysis IS NOT NULL
            ORDER BY r.responded_at DESC
        `);
        
        console.log('Raw result count:', result.length);
        
        // Add deduplication logic
        const uniqueResponses = result.reduce((acc, current) => {
            // Use survey_id as the key for uniqueness
            if (!acc.some(item => item.survey_id === current.survey_id)) {
                acc.push(current);
            }
            return acc;
        }, []);

        console.log('Unique responses count:', uniqueResponses.length);
        
        // Format the data
        const formattedResult = uniqueResponses.map(row => {
            let analysis = row.analysis;
            try {
                if (typeof analysis === 'string') {
                    analysis = JSON.parse(analysis);
                }
            } catch (e) {
                console.error('Error parsing analysis JSON:', e);
                analysis = null;
            }

            return {
                id: Number(row.id),
                survey_id: Number(row.survey_id),
                originalText: row.originalText || '',
                analysis: analysis,
                timestamp: row.timestamp
            };
        });

        res.json(formattedResult);
    } catch (err) {
        console.error('Error in /api/feedback/analysis:', err);
        res.status(500).json({ 
            error: 'Failed to fetch feedback analysis',
            details: err.message
        });
    }
});

// Route to update NLP analysis for a response
app.post('/api/feedback/analyze', async (req, res) => {
    try {
        const { survey_id, analysis } = req.body;
        
        if (!survey_id || !analysis) {
            return res.status(400).send('Missing required data');
        }

        await executeQuery(
            `UPDATE responses 
             SET nlp_analysis = ? 
             WHERE survey_id = ? AND question_id = 10`,
            [JSON.stringify(analysis), survey_id]
        );

        res.status(200).send('Analysis updated successfully');
    } catch (err) {
        console.error('Error updating analysis:', err);
        res.status(500).send('Server error');
    }
});

// Route to get aggregated sentiment analysis
app.get('/api/feedback/sentiment-summary', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                COUNT(*) as total_feedback,
                SUM(CASE 
                    WHEN JSON_EXTRACT(nlp_analysis, '$.sentiment.score') > 0.2 THEN 1 
                    ELSE 0 
                END) as positive_count,
                SUM(CASE 
                    WHEN JSON_EXTRACT(nlp_analysis, '$.sentiment.score') BETWEEN -0.2 AND 0.2 THEN 1 
                    ELSE 0 
                END) as neutral_count,
                SUM(CASE 
                    WHEN JSON_EXTRACT(nlp_analysis, '$.sentiment.score') < -0.2 THEN 1 
                    ELSE 0 
                END) as negative_count,
                AVG(JSON_EXTRACT(nlp_analysis, '$.sentiment.score')) as avg_sentiment
            FROM responses
            WHERE question_id = 10 
            AND nlp_analysis IS NOT NULL
        `);
        
        res.json(result[0]);
    } catch (err) {
        console.error('Error fetching sentiment summary:', err);
        res.status(500).send('Server error');
    }
});

// Add this new endpoint to your index.js
app.get('/api/comments', async (req, res) => {
    try {
        const result = await executeQuery(`
            SELECT 
                r.survey_id,
                r.question_id,
                r.answer,
                r.optional_answer
            FROM responses r
            WHERE r.optional_answer IS NOT NULL 
            AND r.optional_answer != ''
            AND r.question_id != 10
            ORDER BY r.survey_id, r.question_id
        `);
        
        res.json(result);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).send('Server error');
    }
});
// Endpoint to store low satisfaction contact details
app.post('/api/low-satisfaction', async (req, res) => {
    try {
      const { id, name, phone, email } = req.body;
  
      if (!id || !name || !phone || !email) {
        return res.status(400).json({ 
          error: 'Missing required fields' 
        });
      }
  
      const query = `
        INSERT INTO low_satisfaction_responses 
        (survey_id, name, phone, email)
        VALUES (?, ?, ?, ?)
      `;
  
      await executeQuery(query, [id, name, phone, email]);
  
      res.status(201).json({ 
        message: 'Low satisfaction response recorded successfully' 
      });
    } catch (err) {
      console.error('Error storing low satisfaction response:', err);
      res.status(500).json({ 
        error: 'Failed to store low satisfaction response' 
      });
    }
  });
  
  // Endpoint to get all low satisfaction responses
app.get('/api/low-satisfaction', async (req, res) => {
    try {
      const query = `
        SELECT 
          lsr.id,
          lsr.survey_id,
          lsr.name,
          lsr.phone,
          lsr.email,
          lsr.created_at
        FROM low_satisfaction_responses lsr
        ORDER BY lsr.created_at DESC
      `;
  
      const results = await executeQuery(query);
      
      if (!results) {
        return res.status(404).json({ 
          error: 'No low satisfaction responses found' 
        });
      }
  
      // Format the dates before sending
      const formattedResults = results.map(result => ({
        ...result,
        created_at: new Date(result.created_at).toISOString()
      }));
  
      res.json(formattedResults);
    } catch (err) {
      console.error('Error fetching low satisfaction responses:', err);
      res.status(500).json({ 
        error: 'Failed to fetch low satisfaction responses',
        details: err.message 
      });
    }
  });

// Get all questions
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await executeQuery(`
            SELECT 
                id, 
                question_text, 
                question_type, 
                max_value, 
                class,
                KPI_type,
                kpi_poids,  
                class_poids,
                (kpi_poids * class_poids) AS raw_importance,
                options
            FROM questions
            ORDER BY id ASC
        `);

        // Calcul de la somme totale des importances
        const totalImportance = questions.reduce((sum, q) => sum + (q.raw_importance || 0), 0);

        // Format the response
        const formattedQuestions = questions.map(q => {
            let parsedOptions = null;
            if (q.options) {
                try {
                    parsedOptions = typeof q.options === 'string' 
                        ? JSON.parse(q.options) 
                        : q.options;
                } catch (e) {
                    console.error('Error parsing options for question', q.id, e);
                    parsedOptions = [];
                }
            }

            return {
                id: q.id,
                question_text: q.question_text,
                question_type: q.question_type,
                max_value: q.max_value,
                class: q.class,
                KPI_type: q.KPI_type,
                kpi_poids: q.kpi_poids,  
                class_poids: q.class_poids,
                importance: totalImportance > 0 && q.raw_importance !== null && q.raw_importance !== undefined 
                ? Number(q.raw_importance / totalImportance).toFixed(4) 
                : "0.0000",
                options: parsedOptions || []
            };
        });

        res.json(formattedQuestions);
    } catch (err) {
        console.error('Error fetching questions:', err);
        res.status(500).json({ error: 'Error fetching questions', details: err.message });
    }
});


// Update or create questions
app.post('/api/questions/update', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const { questions } = req.body;

        for (const question of questions) {
            const checkResult = await conn.query(
                'SELECT id FROM questions WHERE id = ?',
                [question.id]
            );

            const options = question.options ? JSON.stringify(question.options) : null;

            if (checkResult.length > 0) {
                const validatePoids = (poids) => {
                    return poids !== undefined && poids !== null && poids >= 0 && poids <= 1;
                };
                // Update existing question
                await conn.query(`
                    UPDATE questions
                    SET 
                        question_text = ?,
                        question_type = ?,
                        max_value = ?,
                        class = ?,
                        KPI_type = ?,
                        kpi_poids = ?,
                        class_poids = ?,
                        importance = (kpi_poids * class_poids) / (SELECT SUM(kpi_poids * class_poids) FROM questions),
                        options = ?
                    WHERE id = ?
                `, [
                    question.question_text,
                    question.question_type,
                    question.max_value,
                    question.class,
                    question.KPI_type || null,
                    validatePoids(question.kpi_poids) ? question.kpi_poids : 0, 
                    validatePoids(question.class_poids) ? question.class_poids : 0, 
                    options,
                    question.id
                ]);
            } else {
                // Insert new question
                await conn.query(`
                    INSERT INTO questions 
                    (id, question_text, question_type, max_value, class,KPI_type,kpi_poids,class_poids, options)
                    VALUES (?, ?, ?, ?, ?, ? , ?, ?,?)
                `, [
                    question.id,
                    question.question_text,
                    question.question_type,
                    question.max_value,
                    question.class,
                    question.KPI_type || null,
                    question.kpi_poids || null,
                    question.class_poids || null,
                    options
                ]);
            }
        }

        await conn.commit();
        res.status(200).send('Questions updated successfully');
    } catch (err) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Error updating questions:', err);
        res.status(500).send('Server error');
    } finally {
        if (conn) conn.release();
    }
});

// Delete question
// Delete question endpoint
app.delete('/api/questions/delete', async (req, res) => {
    let conn;
    try {
        const { id } = req.body;
        
        if (!id) {
            return res.status(400).json({ error: 'Question ID is required' });
        }

        conn = await pool.getConnection();
        await conn.beginTransaction();

        // Delete the question
        const result = await conn.query('DELETE FROM questions WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Question not found' });
        }

        await conn.commit();
        res.status(200).json({ message: 'Question deleted successfully' });
    } catch (err) {
        if (conn) {
            await conn.rollback();
        }
        console.error('Error deleting question:', err);
        res.status(500).json({ error: 'Failed to delete question' });
    } finally {
        if (conn) conn.release();
    }
});

