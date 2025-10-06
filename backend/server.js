// Example for a Node.js / Express backend

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// --- START OF THE IMPORTANT PART ---

// 1. Define the allowed origins (domains)
const allowedOrigins = [
  'http://localhost:3000', // Your local frontend for testing
  'https://dyptransport.netlify.app' // IMPORTANT: Your deployed Netlify frontend URL
];

// 2. Configure CORS options
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true // This is important for passing cookies or auth headers
};

// 3. Apply the CORS middleware to your Express app
app.use(cors(corsOptions));

// 4. Configure Socket.IO with the same CORS options
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');

});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));