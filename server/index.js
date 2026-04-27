require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

let dbConnected = false;

async function connectDB() {
  if (dbConnected || mongoose.connection.readyState === 1) {
    dbConnected = true;
    return;
  }

  let uri = process.env.MONGO_URI;

  if (!uri) {
    // On Vercel, we CANNOT use MongoMemoryServer — it downloads binaries which is not allowed
    if (process.env.VERCEL) {
      console.error("VERCEL detected but no MONGO_URI set. Database will not be available.");
      return;
    }
    // Local development: use in-memory MongoDB
    console.log("No MONGO_URI found, starting MongoMemoryServer for local dev...");
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
    } catch (err) {
      console.error("MongoMemoryServer failed:", err.message);
      return;
    }
  }

  try {
    await mongoose.connect(uri);
    dbConnected = true;
    console.log("MongoDB Connected:", uri.substring(0, 30) + '...');

    // Seed data if using memory server or explicitly told to
    if (!process.env.MONGO_URI || process.env.SEED === 'true') {
      const seedHospitals = require('./seed');
      await seedHospitals();
    }
  } catch (err) {
    console.error("MongoDB Connection Error:", err.message);
  }
}

// Connect immediately (but don't block module export)
const dbReady = connectDB().catch(console.error);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Import API routes
const apiRoutes = require('./routes/api')(io);
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Sehat Sync AI — API Running', db: dbConnected });
});

// Only start listening when NOT on Vercel (Vercel handles routing itself)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
