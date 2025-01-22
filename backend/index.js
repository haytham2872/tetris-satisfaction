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
    user: 'root',
    password: 'root123',
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

// Route to store responses
app.post('/api/responses', async (req, res) => {
    try {
        const { survey_id, responses } = req.body;

        if (!survey_id || !responses || Object.keys(responses).length === 0) {
            return res.status(400).send('Invalid data. Make sure to include survey_id and responses.');
        }

        const currentDateTime = new Date();
        const values = Object.entries(responses).map(([questionId, answer]) => [
            Number(survey_id),  // Convert to number
            Number(questionId), // Convert to number
            answer,
            currentDateTime
        ]);

        // Modified query to handle multiple value sets
        const query = 'INSERT INTO responses (survey_id, question_id, answer, responded_at) VALUES (?, ?, ?, ?)';
        
        // Execute queries for each response
        for (const value of values) {
            await executeQuery(query, value);
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
// Add this endpoint to handle additional analytics data
// Add this to your backend index.js file
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