// File: fpl-hub-backend/server.js
// Updated server with team and league routes

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const fplRoutes = require('./src/routes/fplRoutes');
const teamRoutes = require('./src/routes/teamRoutes');
const leagueRoutes = require('./src/routes/leagueRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FPL Hub API is running!',
    version: '1.0.0',
    endpoints: {
      fpl: {
        players: '/api/fpl/players',
        teams: '/api/fpl/teams',
        gameweek: '/api/fpl/gameweek/current',
        fixtures: '/api/fpl/fixtures'
      },
      teams: {
        create: '/api/teams/create',
        all: '/api/teams/all',
        byId: '/api/teams/:id',
        byUser: '/api/teams/user/:userId'
      },
      leagues: {
        create: '/api/leagues/create',
        all: '/api/leagues/all',
        open: '/api/leagues/open',
        join: '/api/leagues/:id/join',
        standings: '/api/leagues/:id/standings'
      }
    }
  });
});

// Routes
app.use('/api/fpl', fplRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/leagues', leagueRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 FPL API endpoints ready at http://localhost:${PORT}/api/fpl`);
  console.log(`⚽ Team endpoints ready at http://localhost:${PORT}/api/teams`);
  console.log(`🏆 League endpoints ready at http://localhost:${PORT}/api/leagues`);
  console.log(`\n🔍 Try these endpoints:`);
  console.log(`   http://localhost:${PORT}/api/fpl/teams`);
  console.log(`   http://localhost:${PORT}/api/teams/all`);
  console.log(`   http://localhost:${PORT}/api/leagues/open`);
});