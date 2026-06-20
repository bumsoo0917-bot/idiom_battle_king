const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const db = require('./config/db');

const gameRoutes = require('./routes/gameRoutes');
const questionRoutes = require('./routes/questionRoutes');
const gameController = require('./controllers/gameController');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middlewares
app.use(cors());
app.use(express.json());

// Share Socket.io instance with Express requests
app.set('io', io);

// API Routes
app.use('/api/games', gameRoutes);
app.use('/api/questions', questionRoutes);
app.post('/api/answers', gameController.submitAnswer); // Match exactly "POST /api/answers"

// Health check
app.get('/health', (req, res) => {
  res.send('Server is healthy');
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // User joins a game room
  socket.on('join_room', ({ gameCode, role, nickname }) => {
    const cleanCode = gameCode.trim().toUpperCase();
    socket.join(cleanCode);
    console.log(`${role || 'Student'} (${nickname || 'Unknown'}) joined room: ${cleanCode}`);

    // If teacher joins, we can notify others or sync state
    if (role === 'teacher') {
      socket.to(cleanCode).emit('teacher_connected');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize database then start server
const PORT = process.env.PORT || 5000;

db.initDatabase().then(() => {
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
