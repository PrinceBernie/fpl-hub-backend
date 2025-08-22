// File: fpl-hub-backend/src/routes/teamRoutes.js
// Updated team routes using database

const express = require('express');
const router = express.Router();
const { TeamService } = require('../services/databaseService');
const fplService = require('../services/fplService');
const { authMiddleware } = require('../middleware/auth');

// Create a new team (protected)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, players, captain, viceCaptain } = req.body;
    const userId = req.userId; // From auth middleware
    
    // Validate team
    if (!players || players.length !== 15) {
      return res.status(400).json({
        success: false,
        error: 'Team must have exactly 15 players'
      });
    }

    // Validate with FPL rules
    const validation = fplService.validateTeam(players);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors
      });
    }

    // Create team in database
    const team = await TeamService.createTeam({
      name: name || 'My Team',
      userId,
      players,
      captain,
      viceCaptain,
      budget: 100 - validation.totalCost,
      totalCost: validation.totalCost
    });

    res.json({
      success: true,
      message: 'Team created successfully!',
      data: team
    });
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create team'
    });
  }
});

// Get all teams (public)
router.get('/all', async (req, res) => {
  try {
    const teams = await TeamService.getAllTeams();
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams'
    });
  }
});

// Get team by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const team = await TeamService.getTeamById(req.params.id);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    res.json({
      success: true,
      data: team
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team'
    });
  }
});

// Get my teams (protected)
router.get('/user/me', authMiddleware, async (req, res) => {
  try {
    const teams = await TeamService.getTeamsByUser(req.userId);
    res.json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    console.error('Error fetching user teams:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch teams'
    });
  }
});

// Update team (protected - only owner)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { players, name, captain, viceCaptain } = req.body;
    const teamId = req.params.id;
    
    // Check if team belongs to user
    const team = await TeamService.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    if (team.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own teams'
      });
    }
    
    // If updating players, validate them
    let updates = {};
    if (players) {
      const validation = fplService.validateTeam(players);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }
      updates.players = players;
      updates.totalCost = validation.totalCost;
      updates.budget = 100 - validation.totalCost;
    }
    
    if (name) updates.name = name;
    if (captain !== undefined) updates.captain = captain;
    if (viceCaptain !== undefined) updates.viceCaptain = viceCaptain;

    const updatedTeam = await TeamService.updateTeam(teamId, updates);

    res.json({
      success: true,
      message: 'Team updated successfully!',
      data: updatedTeam
    });
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update team'
    });
  }
});

// Delete team (protected - only owner)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const teamId = req.params.id;
    
    // Check if team belongs to user
    const team = await TeamService.getTeamById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }
    
    if (team.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own teams'
      });
    }
    
    await TeamService.deleteTeam(teamId);

    res.json({
      success: true,
      message: 'Team deleted successfully!'
    });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete team'
    });
  }
});

// Validate team without saving (public)
router.post('/validate', async (req, res) => {
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
      valid: validation.valid,
      data: validation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;