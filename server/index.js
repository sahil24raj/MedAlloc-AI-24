const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock io for Vercel
const io = { emit: () => {} };
const apiRoutes = require('./routes/api')(io);

// Handle both /api and / routes to be safe with Vercel rewrites
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
