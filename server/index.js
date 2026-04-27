const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { db } = require('./firebase');

const app = express();
app.use(cors());
app.use(express.json());

// Socket.io setup (Mocked for Vercel)
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

// Import API routes
const apiRoutes = require('./routes/api')(io);

// Mount routes at root. 
// The vercel.json rewrite will point /api/* to this app.
// If the URL is /api/patients, Express will see it as /api/patients.
// So we mount at /api for consistency.
app.use('/api', apiRoutes);

// Fallback for root calls
app.get('/', (req, res) => res.send('Sehat Sync API is online.'));

// Only start server locally
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

// IMPORTANT: Export app for Vercel
module.exports = app;
