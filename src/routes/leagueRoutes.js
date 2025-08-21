// File: fpl-hub-backend/src/routes/leagueRoutes.js
// API routes for league management

const express = require('express');
const router = express.Router();
const leagueModel = require('../models/leagueModel');
const teamModel = require('../models/teamModel');

// Create a new league
router.post('/create', (req, res) => {
  try {
    const { name, type, entryFee, maxTeams, gameweek } = req.body;
    
    // Validate input
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'League name is required'
      });
    }

    const league = leagueModel.createLeague({
      name,
      type: type || 'classic',
      entryFee: parseFloat(entryFee) || 0,
      maxTeams: parseInt(maxTeams) || 100,
      gameweek: parseInt(gameweek) || 1,
      createdBy: req.body.userId || 'admin'
    });

    res.json({
      success: true,
      message: 'League created successfully!',
      data: league
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all leagues
router.get('/all', (req, res) => {
  try {
    const leagues = leagueModel.getAllLeagues();
    res.json({
      success: true,
      count: leagues.length,
      data: leagues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get open leagues (available to join)
router.get('/open', (req, res) => {
  try {
    const leagues = leagueModel.getOpenLeagues();
    res.json({
      success: true,
      count: leagues.length,
      data: leagues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get league by ID
router.get('/:id', (req, res) => {
  try {
    const league = leagueModel.getLeagueById(req.params.id);
    
    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found'
      });
    }

    res.json({
      success: true,
      data: league
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Join a league
router.post('/:id/join', (req, res) => {
  try {
    const { teamId, userId } = req.body;
    
    // Validate team exists
    const team = teamModel.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    // Join league
    const league = leagueModel.joinLeague(req.params.id, {
      teamId: team.id,
      teamName: team.name,
      userId: userId || team.userId
    });

    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully joined league!',
      data: league
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Leave a league
router.post('/:id/leave', (req, res) => {
  try {
    const { teamId } = req.body;
    
    const league = leagueModel.leaveLeague(req.params.id, teamId);
    
    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League or team not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully left league',
      data: league
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get league standings
router.get('/:id/standings', (req, res) => {
  try {
    const league = leagueModel.getLeagueById(req.params.id);
    
    if (!league) {
      return res.status(404).json({
        success: false,
        error: 'League not found'
      });
    }

    // Sort teams by points and rank
    const standings = league.currentTeams
      .sort((a, b) => b.points - a.points)
      .map((team, index) => ({
        ...team,
        rank: index + 1
      }));

    res.json({
      success: true,
      data: {
        leagueName: league.name,
        gameweek: league.gameweek,
        standings
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Calculate prizes for a league
router.get('/:id/prizes', (req, res) => {
  try {
    const prizes = leagueModel.calculatePrizes(req.params.id);
    
    if (!prizes) {
      return res.status(404).json({
        success: false,
        error: 'League not found'
      });
    }

    res.json({
      success: true,
      data: prizes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete league (admin only)
router.delete('/:id', (req, res) => {
  try {
    const deleted = leagueModel.deleteLeague(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'League not found'
      });
    }

    res.json({
      success: true,
      message: 'League deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;