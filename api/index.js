const app = require('../server/index');

module.exports = (req, res) => {
  // Ensure we handle CORS at the very beginning of the serverless execution
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Pass control to Express
  return app(req, res);
};
