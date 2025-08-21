// File: fpl-hub-backend/src/routes/teamRoutes.js
// API routes for team management

const express = require('express');
const router = express.Router();
const teamModel = require('../models/teamModel');
const fplService = require('../services/fplService');

// Create a new team
router.post('/create', async (req, res) => {
  try {
    const { name, players, captain, viceCaptain, userId } = req.body;
    
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

    // Create team
    const team = teamModel.createTeam({
      name,
      players,
      captain,
      viceCaptain,
      userId: userId || 'guest',
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
      error: error.message
    });
  }
});

// Get all teams
router.get('/all', (req, res) => {
  try {
    const teams = teamModel.getAllTeams();
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

// Get team by ID
router.get('/:id', (req, res) => {
  try {
    const team = teamModel.getTeamById(req.params.id);
    
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
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get teams by user
router.get('/user/:userId', (req, res) => {
  try {
    const teams = teamModel.getTeamsByUser(req.params.userId);
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

// Update team
router.put('/:id', async (req, res) => {
  try {
    const { players, name, captain, viceCaptain } = req.body;
    
    // If updating players, validate them
    if (players) {
      const validation = fplService.validateTeam(players);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          errors: validation.errors
        });
      }
    }

    const updatedTeam = teamModel.updateTeam(req.params.id, {
      players,
      name,
      captain,
      viceCaptain
    });

    if (!updatedTeam) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    res.json({
      success: true,
      message: 'Team updated successfully!',
      data: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete team
router.delete('/:id', (req, res) => {
  try {
    const deleted = teamModel.deleteTeam(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Team not found'
      });
    }

    res.json({
      success: true,
      message: 'Team deleted successfully!'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Validate team without saving
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