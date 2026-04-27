// Vercel Serverless Function entry point
// This file re-exports the Express app from server/index.js
const app = require('../server/index');
module.exports = app;
