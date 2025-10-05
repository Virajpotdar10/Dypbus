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

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Security middleware
app.use(helmet());

// Compression middleware for better performance
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

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

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

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
  // Close server & exit process
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
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize cache
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
