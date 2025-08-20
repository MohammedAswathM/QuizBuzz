// server.js — Express backend for Quiz Buzz App
// ----------------------------------------------------
// Imports the Express framework to build a web server
const express = require('express');
// Built-in Node modules: path for file paths, fs/promises for async file I/O
const path = require('path');
const fs = require('fs').promises;

// Create an Express application instance
const app = express();
// The port our server listens on
const PORT = process.env.PORT || 3000;

// Helper: absolute paths to data files
const DATA_DIR = path.join(__dirname, 'data');
const QUESTIONS_PATH = path.join(DATA_DIR, 'questions.json');
const SCORES_PATH = path.join(DATA_DIR, 'scores.json');

// Parse JSON bodies on incoming requests (e.g., POST /api/score)
app.use(express.json());

// Serve static frontend files from the public/ folder
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/questions — returns the list of questions
app.get('/api/questions', async (req, res) => {
  try {
    const raw = await fs.readFile(QUESTIONS_PATH, 'utf8');
    const questions = JSON.parse(raw);
    res.json({ ok: true, questions });
  } catch (err) {
    console.error('Error reading questions:', err);
    res.status(500).json({ ok: false, message: 'Unable to load questions' });
  }
});

// GET /api/leaderboard — returns top 10 scores (highest first)
app.get('/api/leaderboard', async (req, res) => {
  try {
    const raw = await fs.readFile(SCORES_PATH, 'utf8');
    const scores = JSON.parse(raw);
    const top = scores
      .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)
      .slice(0, 10);
    res.json({ ok: true, top });
  } catch (err) {
    console.error('Error reading scores:', err);
    res.status(500).json({ ok: false, message: 'Unable to load leaderboard' });
  }
});

// POST /api/score — save a new score entry
app.post('/api/score', async (req, res) => {
  try {
    const { name, score, timeMs } = req.body;

    // Basic validation to help beginners avoid crashes
    if (typeof name !== 'string' || name.trim().length < 1 || name.length > 20) {
      return res.status(400).json({ ok: false, message: 'Name must be 1–20 chars' });
    }
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ ok: false, message: 'Score must be a positive number' });
    }
    if (typeof timeMs !== 'number' || timeMs < 0) {
      return res.status(400).json({ ok: false, message: 'timeMs must be a positive number' });
    }

    // Read existing scores (or default to empty array)
    let scores = [];
    try {
      const raw = await fs.readFile(SCORES_PATH, 'utf8');
      scores = JSON.parse(raw);
    } catch (_) {
      scores = [];
    }

    // Create a new score record
    const entry = {
      name: name.trim(),
      score,
      timeMs,             // time taken to finish the quiz (lower is better)
      when: new Date().toISOString()
    };

    // Add and persist
    scores.push(entry);
    await fs.writeFile(SCORES_PATH, JSON.stringify(scores, null, 2), 'utf8');

    // The scoreboard displays the top 10 (sorted by score desc, then time asc)
    const top = scores
      .sort((a, b) => b.score - a.score || a.timeMs - b.timeMs)
      .slice(0, 10);

    res.json({ ok: true, top });
  } catch (err) {
    console.error('Error saving score:', err);
    res.status(500).json({ ok: false, message: 'Unable to save score' });
  }
});

// Fallback: serve index.html for any unknown route (so you can refresh on the frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`Quiz Buzz server running at http://localhost:${PORT}`);
});
