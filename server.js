const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import database service to initialize connection
const { prisma } = require('./src/services/databaseService');

// Import routes
const fplRoutes = require('./src/routes/fplRoutes');
const authRoutes = require('./src/routes/authRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const leagueRoutes = require('./src/routes/leagueRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FPL Hub API is running with Database!',
    version: '2.0.0',
    database: 'PostgreSQL with Prisma'
  });
});

// Routes
app.use('/api/auth', authRoutes);  // NEW: Authentication routes
app.use('/api/fpl', fplRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/leagues', leagueRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!' 
  });
});

// Connect to database and start server
async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`🗄️  Database: PostgreSQL with Prisma`);
      console.log(`🔐 Authentication: JWT enabled`);
      console.log(`\n📝 Test the API:`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});