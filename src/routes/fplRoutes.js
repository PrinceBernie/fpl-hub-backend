// File: fpl-hub-backend/src/routes/fplRoutes.js
// API routes for FPL data

const express = require('express');
const router = express.Router();
const fplService = require('../services/fplService');

// Get all players
router.get('/players', async (req, res) => {
  try {
    const players = await fplService.getPlayers();
    res.json({
      success: true,
      count: players.length,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get players by position (1=GKP, 2=DEF, 3=MID, 4=FWD)
router.get('/players/position/:positionId', async (req, res) => {
  try {
    const positionId = parseInt(req.params.positionId);
    const players = await fplService.getPlayersByPosition(positionId);
    res.json({
      success: true,
      position: fplService.getPositionName(positionId),
      count: players.length,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get players by team
router.get('/players/team/:teamId', async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    const players = await fplService.getPlayersByTeam(teamId);
    res.json({
      success: true,
      teamId: teamId,
      count: players.length,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get players within budget
router.get('/players/budget/:maxPrice', async (req, res) => {
  try {
    const maxPrice = parseFloat(req.params.maxPrice);
    const players = await fplService.getPlayersByBudget(maxPrice);
    res.json({
      success: true,
      maxBudget: maxPrice,
      count: players.length,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all Premier League teams
router.get('/teams', async (req, res) => {
  try {
    const teams = await fplService.getTeams();
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get current gameweek
router.get('/gameweek/current', async (req, res) => {
  try {
    const gameweek = await fplService.getCurrentGameweek();
    res.json({
      success: true,
      data: gameweek
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fixtures
router.get('/fixtures', async (req, res) => {
  try {
    const gameweekId = req.query.gameweek ? parseInt(req.query.gameweek) : null;
    const fixtures = await fplService.getFixtures(gameweekId);
    res.json({
      success: true,
      count: fixtures.length,
      data: fixtures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validate a team
router.post('/validate-team', async (req, res) => {
  try {
    const { players } = req.body;
    
    if (!players || !Array.isArray(players)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an array of players'
      });
    }

    const validation = fplService.validateTeam(players);
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get bootstrap data (all FPL data)
router.get('/bootstrap', async (req, res) => {
  try {
    const data = await fplService.getBootstrapData();
    res.json({
      success: true,
      data: {
        players: data.elements.length,
        teams: data.teams.length,
        gameweeks: data.events.length,
        currentGameweek: data.events.find(e => e.is_current)?.id
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;