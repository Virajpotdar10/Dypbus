const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const { initializeCache } = require('./middleware/cache');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config({ path: './config/config.env' });

// Validate essential environment variables
const requiredEnv = ['MONGO_URI', 'JWT_SECRET', 'PORT'];
const missingEnv = requiredEnv.filter(v => !process.env[v]);

if (missingEnv.length > 0) {
  console.error(' FATAL ERROR: Missing required environment variables:');
  missingEnv.forEach(v => console.error(`  - ${v}`));
  console.error('Please ensure they are set in ./config/config.env');
  process.exit(1);
}
console.log(' All required environment variables are set.');

// Connect to database
connectDB();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// --- START: CORS and Socket.IO Configuration ---

// 1. Define the allowed origins (domains) for CORS
const allowedOrigins = [
  'http://localhost:3000', // For local development
  'https://dyptransport.netlify.app' // Your deployed Netlify frontend
];

// 2. Configure CORS options
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// 3. Apply the CORS middleware to your Express app
app.use(cors(corsOptions));

// 4. Initialize Socket.IO with the same CORS options
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// --- END: CORS and Socket.IO Configuration ---

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet());

// Compression middleware for better performance
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mount routers
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/routes', require('./routes/routes'));
app.use('/api/v1/students', require('./routes/students').studentRouter);
app.use('/students', require('./routes/students').studentRouter);
app.use('/api/v1/users', require('./routes/users'));
app.use('/api/v1/pdf', require('./routes/pdf'));

// Serve frontend production build
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const clientBuildPath = path.resolve(__dirname, '..', 'frontend', 'build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Error handling middleware (must be after all routes)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Set port
const PORT = process.env.PORT || 5001;

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join a room specific to a route
  socket.on('joinRouteRoom', (routeId) => {
    socket.join(routeId);
    console.log(`Socket ${socket.id} joined room ${routeId}`);
  });

  // Leave a room
  socket.on('leaveRouteRoom', (routeId) => {
    socket.leave(routeId);
    console.log(`Socket ${socket.id} left room ${routeId}`);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start server
const startServer = async () => {
  try {
    await initializeCache();
    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});