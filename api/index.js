// Vercel entry point
const app = require('../server/index');

// Vercel expects a function (req, res) => {}. Express 'app' is exactly that.
module.exports = app;
