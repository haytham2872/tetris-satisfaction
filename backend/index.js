const express = require('express');
const bodyParser = require('body-parser');
const mariadb = require('mariadb');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database configuration
const pool = mariadb.createPool({
    host: 'localhost',
    port:3306,
    user: 'root',
    password: '123',
    database: 'satisfaction_db',
    connectionLimit: 5,
    bigIntAsNumber: true  // Convert BigInt to Number

});

// Database connection handling
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