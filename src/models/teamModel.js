// File: fpl-hub-backend/src/models/teamModel.js
// Simple in-memory storage for teams (we'll add database later)

class TeamModel {
  constructor() {
    this.teams = [];
    this.nextId = 1;
  }

  // Create a new team
  createTeam(teamData) {
    const team = {
      id: this.nextId++,
      name: teamData.name || 'Unnamed Team',
      userId: teamData.userId || 'guest',
      players: teamData.players || [],
      captain: teamData.captain || null,
      viceCaptain: teamData.viceCaptain || null,
      budget: teamData.budget || 0,
      totalCost: teamData.totalCost || 0,
      gameweek: teamData.gameweek || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.teams.push(team);
    return team;
  }

  // Get all teams
  getAllTeams() {
    return this.teams;
  }

  // Get team by ID
  getTeamById(id) {
    return this.teams.find(team => team.id === parseInt(id));
  }

  // Get teams by user
  getTeamsByUser(userId) {
    return this.teams.filter(team => team.userId === userId);
  }

  // Update team
  updateTeam(id, updates) {
    const index = this.teams.findIndex(team => team.id === parseInt(id));
    if (index === -1) return null;
    
    this.teams[index] = {
      ...this.teams[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.teams[index];
  }

  // Delete team
  deleteTeam(id) {
    const index = this.teams.findIndex(team => team.id === parseInt(id));
    if (index === -1) return false;
    
    this.teams.splice(index, 1);
    return true;
  }

  // Clear all teams (for testing)
  clearAll() {
    this.teams = [];
    this.nextId = 1;
  }
}

module.exports = new TeamModel();