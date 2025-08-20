const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const fplRoutes = require('./src/routes/fplRoutes');

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FPL Hub API is running!',
    version: '1.0.0',
    endpoints: {
      players: '/api/fpl/players',
      teams: '/api/fpl/teams',
      gameweek: '/api/fpl/gameweek/current',
      fixtures: '/api/fpl/fixtures'
    }
  });
});

// FPL routes
app.use('/api/fpl', fplRoutes);

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
  console.log(`\n🔍 Try these endpoints:`);
  console.log(`   http://localhost:${PORT}/api/fpl/players`);
  console.log(`   http://localhost:${PORT}/api/fpl/teams`);
  console.log(`   http://localhost:${PORT}/api/fpl/gameweek/current`);
});